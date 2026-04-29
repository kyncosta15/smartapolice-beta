import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Building2, FileText, CheckCircle2, RefreshCw, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParsedPolicyData } from '@/utils/policyDataParser';

type Tipo = 'pf' | 'pj';

interface VinculoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: Tipo;
  policies: ParsedPolicyData[];
}

function extractDocumento(policy: any): string {
  const field = policy?.documento;
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field.value) return String(field.value);
  return '';
}

function formatDoc(doc: string, tipo: Tipo): string {
  const d = doc.replace(/\D/g, '');
  if (tipo === 'pf' && d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (tipo === 'pj' && d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return doc;
}

type LifecycleStatus = 'vigente' | 'renovada' | 'antiga';

function getEndTime(p: any): number {
  const raw = p?.endDate || p?.end_date;
  if (!raw) return 0;
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1).getTime();
  }
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

function classifyPolicies(list: ParsedPolicyData[]): Map<string, LifecycleStatus> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  // Agrupa por segurado(doc) + seguradora + tipo (ramo)
  const groups = new Map<string, ParsedPolicyData[]>();
  list.forEach((p) => {
    const doc = extractDocumento(p).replace(/\D/g, '');
    const insurer = (p.insurer || '').toLowerCase().trim();
    const ramo = (p.type || '').toLowerCase().trim();
    const key = `${doc}|${insurer}|${ramo}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });

  const result = new Map<string, LifecycleStatus>();
  groups.forEach((items) => {
    // Ordena por endDate desc
    const sorted = [...items].sort((a, b) => getEndTime(b) - getEndTime(a));
    const newestEnd = getEndTime(sorted[0]);
    sorted.forEach((p, idx) => {
      const end = getEndTime(p);
      if (end >= todayMs) {
        // Vigente
        result.set(p.id, 'vigente');
      } else if (idx === 0 || end === newestEnd) {
        // É a mais recente do grupo, mas já venceu => antiga
        result.set(p.id, 'antiga');
      } else {
        // Existe versão mais nova => renovada
        result.set(p.id, 'renovada');
      }
    });
  });

  return result;
}

const LIFECYCLE_META: Record<LifecycleStatus, { label: string; Icon: typeof CheckCircle2; className: string }> = {
  vigente: {
    label: 'Vigente',
    Icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  renovada: {
    label: 'Renovada',
    Icon: RefreshCw,
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  antiga: {
    label: 'Antiga',
    Icon: Archive,
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function VinculoModal({ open, onOpenChange, tipo, policies }: VinculoModalProps) {
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const expectedLen = tipo === 'pf' ? 11 : 14;

  const subset = useMemo(() => policies.filter((p) => {
    const d = extractDocumento(p).replace(/\D/g, '');
    return d.length === expectedLen;
  }), [policies, expectedLen]);

  const lifecycleMap = useMemo(() => classifyPolicies(subset), [subset]);

  const visibleSubset = useMemo(() => {
    if (showAll) return subset;
    return subset.filter((p) => lifecycleMap.get(p.id) === 'vigente');
  }, [subset, lifecycleMap, showAll]);

  const hiddenCount = subset.length - visibleSubset.length;

  const filtered = useMemo(() => {
    if (!query.trim()) return visibleSubset;
    const q = query.toLowerCase().trim();
    return visibleSubset.filter((p) => {
      const doc = extractDocumento(p).toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.insurer?.toLowerCase().includes(q) ||
        p.policyNumber?.toLowerCase().includes(q) ||
        doc.includes(q)
      );
    });
  }, [subset, query]);

  const config = tipo === 'pf'
    ? { Icon: Users, title: 'Pessoa Física', sublabel: 'Apólices vinculadas a CPF', tone: 'pf' as const }
    : { Icon: Building2, title: 'Pessoa Jurídica', sublabel: 'Apólices vinculadas a CNPJ', tone: 'pj' as const };

  const Icon = config.Icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                config.tone === 'pf' ? 'bg-pf/15' : 'bg-pj/15'
              )}
            >
              <Icon className={cn('h-5 w-5', config.tone === 'pf' ? 'text-pf' : 'text-pj')} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-medium text-foreground">{config.title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {config.sublabel}
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-xs',
                config.tone === 'pf'
                  ? 'bg-pf/10 text-pf-foreground border-transparent'
                  : 'bg-pj/10 text-pj-foreground border-transparent'
              )}
            >
              {filtered.length} {filtered.length === 1 ? 'apólice' : 'apólices'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Busca */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, documento, seguradora ou apólice..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Lista */}
        <ScrollArea className="max-h-[420px]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-foreground font-medium">Nenhuma apólice encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                {query ? 'Tente refinar sua busca.' : `Não há apólices vinculadas a ${tipo === 'pf' ? 'CPF' : 'CNPJ'}.`}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => {
                const doc = extractDocumento(p);
                const lifecycle = lifecycleMap.get(p.id) || 'antiga';
                const meta = LIFECYCLE_META[lifecycle];
                const LIcon = meta.Icon;
                return (
                  <li
                    key={p.id}
                    className="px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">
                            {p.name || 'Sem nome'}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 text-[10px] gap-1 px-1.5 py-0 h-5 font-medium',
                              meta.className
                            )}
                          >
                            <LIcon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                          {doc && <span className="font-mono">{formatDoc(doc, tipo)}</span>}
                          {p.insurer && (
                            <>
                              <span className="text-border">•</span>
                              <span className="truncate">{p.insurer}</span>
                            </>
                          )}
                          {p.type && (
                            <>
                              <span className="text-border">•</span>
                              <span className="capitalize">{p.type.toLowerCase()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {p.policyNumber && (
                        <Badge variant="outline" className="shrink-0 text-[10px] font-mono bg-muted text-muted-foreground border-transparent">
                          {p.policyNumber}
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default VinculoModal;
