import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Search, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePremiumClients, useTogglePremium, PremiumClientRow } from '@/hooks/usePremiumClients';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export default function ConsultoriaClientesPremiumPage() {
  const navigate = useNavigate();
  const { data, isLoading } = usePremiumClients();
  const toggle = useTogglePremium();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PremiumClientRow | null>(null);
  const [expira, setExpira] = useState('');
  const [obs, setObs] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => r.empresa_nome.toLowerCase().includes(q));
  }, [data, search]);

  const totalAtivos = data?.filter((r) => r.premium_ativo).length || 0;
  const totalCasos = data?.reduce((s, r) => s + r.total_casos, 0) || 0;

  const openEdit = (row: PremiumClientRow) => {
    setEditing(row);
    setExpira(row.premium_expira_em ? row.premium_expira_em.split('T')[0] : '');
    setObs(row.premium_observacao || '');
  };

  const handleQuickToggle = (row: PremiumClientRow, value: boolean) => {
    toggle.mutate({
      empresa_id: row.empresa_id,
      config_id: row.config_id,
      ativar: value,
      expira_em: row.premium_expira_em ? row.premium_expira_em.split('T')[0] : null,
      observacao: row.premium_observacao,
    });
  };

  const handleSave = () => {
    if (!editing) return;
    toggle.mutate(
      {
        empresa_id: editing.empresa_id,
        config_id: editing.config_id,
        ativar: true,
        expira_em: expira || null,
        observacao: obs || null,
      },
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/consultoria-premium')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Clientes Premium
          </h1>
          <p className="text-sm text-muted-foreground">
            Ative ou desative o módulo de Consultoria Premium para cada empresa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Empresas Premium</div>
          <div className="text-3xl font-semibold mt-1">{totalAtivos}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total de empresas</div>
          <div className="text-3xl font-semibold mt-1">{data?.length || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Casos abertos no total</div>
          <div className="text-3xl font-semibold mt-1">{totalCasos}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ativação</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-center">Casos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const expirado = row.premium_expira_em && new Date(row.premium_expira_em) < new Date();
                return (
                  <TableRow key={row.empresa_id}>
                    <TableCell className="font-medium">{row.empresa_nome}</TableCell>
                    <TableCell>
                      {row.premium_ativo && !expirado ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                          Premium ativo
                        </Badge>
                      ) : expirado ? (
                        <Badge variant="outline" className="text-amber-700 border-amber-500/40">Expirado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(row.premium_ativado_em)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground flex items-center gap-1">
                      {row.premium_expira_em && <CalendarIcon className="h-3 w-3" />}
                      {row.premium_expira_em ? formatDate(row.premium_expira_em) : 'Sem validade'}
                    </TableCell>
                    <TableCell className="text-center text-sm">{row.total_casos}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Switch
                          checked={row.premium_ativo}
                          onCheckedChange={(v) => handleQuickToggle(row, v)}
                          disabled={toggle.isPending}
                        />
                        <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                          Detalhes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma empresa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium — {editing?.empresa_nome}</DialogTitle>
            <DialogDescription>
              Defina validade e observações da assinatura Premium desta empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="expira">Data de expiração (opcional)</Label>
              <Input
                id="expira"
                type="date"
                value={expira}
                onChange={(e) => setExpira(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Deixe em branco para acesso sem prazo.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observação interna</Label>
              <Textarea
                id="obs"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={3}
                placeholder="Ex.: contrato anual assinado em..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={toggle.isPending}>
              Salvar e ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
