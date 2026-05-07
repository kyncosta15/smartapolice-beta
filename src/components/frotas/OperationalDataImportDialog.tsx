import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedRow {
  rowIndex: number;
  modelo: string;
  placa: string;
  obra: string;
  responsavel: string;
  contato: string;
  rastreador: boolean;
  situacaoFinanceira: string;
  empresa: string;
  tacografoRaw: string;
  tacografoStatus: string | null; // APTO/INAPTO/null
  tacografoVenc: string | null;   // YYYY-MM-DD
}

interface MatchedRow extends ParsedRow {
  veiculoId: string | null;
  placaNormalizada: string;
  status: 'pending' | 'updated' | 'not_found' | 'error';
  errorMsg?: string;
}

const normalizePlaca = (raw: string) => (raw || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '');

// Parse "APTO VENC. 22/11/2027" -> { status: 'APTO', venc: '2027-11-22' }
const parseTacografo = (raw: string): { status: string | null; venc: string | null } => {
  if (!raw) return { status: null, venc: null };
  const text = raw.toString().trim().toUpperCase();
  if (!text) return { status: null, venc: null };

  let status: string | null = null;
  if (text.includes('APTO')) status = text.includes('INAPTO') ? 'INAPTO' : 'APTO';
  else if (text.includes('INAPTO') || text.includes('VENCIDO')) status = 'INAPTO';

  const m = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  let venc: string | null = null;
  if (m) {
    const [, dd, mm, yyyy] = m;
    venc = `${yyyy}-${mm}-${dd}`;
  }
  return { status, venc };
};

const parseRastreador = (raw: string): boolean => {
  const t = (raw || '').toString().trim().toLowerCase();
  if (!t) return false;
  return t.includes('rastread') || t === 'sim' || t === 's' || t === 'yes' || t === 'true' || t === '1';
};

export default function OperationalDataImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const { activeEmpresaId } = useTenant();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<MatchedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setFile(null);
    setRows([]);
    setProgress(0);
  };

  const handleFile = async (f: File) => {
    if (!activeEmpresaId) {
      toast.error('Nenhuma empresa ativa selecionada');
      return;
    }
    setFile(f);
    setParsing(true);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Heurística: pular linhas até achar uma que tenha placa no padrão
      const parsed: ParsedRow[] = [];
      aoa.forEach((row, idx) => {
        // Por posição: col0=Modelo, col1=Placa, col2=Obra, col3=Resp, col4=Contato, col5=Rastreador, col6=Sit.Fin, col7=Empresa, col8=Tacógrafo
        const placaRaw = (row[1] || '').toString().trim();
        const placaNorm = normalizePlaca(placaRaw);
        // Só considerar como linha de dados se a placa tem 7 chars e começa com 3 letras
        if (placaNorm.length !== 7 || !/^[A-Z]{3}/.test(placaNorm)) return;

        const tac = parseTacografo((row[8] || '').toString());
        parsed.push({
          rowIndex: idx + 1,
          modelo: (row[0] || '').toString().trim(),
          placa: placaRaw,
          obra: (row[2] || '').toString().trim(),
          responsavel: (row[3] || '').toString().trim(),
          contato: (row[4] || '').toString().trim(),
          rastreador: parseRastreador((row[5] || '').toString()),
          situacaoFinanceira: (row[6] || '').toString().trim(),
          empresa: (row[7] || '').toString().trim(),
          tacografoRaw: (row[8] || '').toString().trim(),
          tacografoStatus: tac.status,
          tacografoVenc: tac.venc,
        });
      });

      if (parsed.length === 0) {
        toast.error('Nenhuma linha válida encontrada na planilha');
        setFile(null);
        setParsing(false);
        return;
      }

      // Match em lote pelas placas no banco
      const placasNorm = Array.from(new Set(parsed.map(p => normalizePlaca(p.placa))));
      const { data: veiculos, error } = await supabase
        .from('frota_veiculos')
        .select('id, placa')
        .eq('empresa_id', activeEmpresaId)
        .in('placa', placasNorm);
      if (error) throw error;

      const placaToId = new Map<string, string>();
      (veiculos || []).forEach(v => placaToId.set(normalizePlaca(v.placa), v.id));

      const matched: MatchedRow[] = parsed.map(p => {
        const placaNorm = normalizePlaca(p.placa);
        const id = placaToId.get(placaNorm) || null;
        return { ...p, placaNormalizada: placaNorm, veiculoId: id, status: id ? 'pending' : 'not_found' };
      });
      setRows(matched);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao ler planilha: ' + (err?.message || 'desconhecido'));
      reset();
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!activeEmpresaId) return;
    const toProcess = rows.filter(r => r.veiculoId);
    if (toProcess.length === 0) {
      toast.error('Nenhuma linha vinculada a um veículo existente');
      return;
    }

    setImporting(true);
    setProgress(0);
    const today = format(new Date(), 'yyyy-MM-dd');
    let done = 0;
    const updatedRows = [...rows];

    for (const row of toProcess) {
      try {
        // 1) Atualizar veículo: rastreador, modalidade_compra, observações,
        //    + cache de alocação atual (campos lidos pela aba Obra)
        const updates: Record<string, any> = {
          tem_rastreador: row.rastreador,
        };
        const sitUpper = (row.situacaoFinanceira || '').toUpperCase();
        let financeStatus: 'QUITADO' | 'EM_ANDAMENTO' | null = null;
        let financeType: 'A_VISTA' | 'FINANCIAMENTO' | 'CONSORCIO' | null = null;
        if (sitUpper) {
          if (sitUpper.includes('QUITADO') || sitUpper.includes('AVISTA') || sitUpper.includes('À VISTA') || sitUpper.includes('A VISTA')) {
            updates.modalidade_compra = 'avista';
            financeType = 'A_VISTA';
            financeStatus = 'QUITADO';
          } else if (sitUpper.includes('FINANC')) {
            updates.modalidade_compra = 'financiado';
            financeType = 'FINANCIAMENTO';
            financeStatus = 'EM_ANDAMENTO';
          } else if (sitUpper.includes('CONSORCIO') || sitUpper.includes('CONSÓRCIO')) {
            updates.modalidade_compra = 'consorcio';
            financeType = 'CONSORCIO';
            financeStatus = 'EM_ANDAMENTO';
          }
        }
        // Cache de alocação no próprio veículo (a aba "Obra" lê daqui)
        if (row.obra || row.responsavel || row.contato) {
          updates.current_responsible_name = row.responsavel || 'Não informado';
          updates.current_responsible_contact = row.contato || null;
          updates.current_worksite_name = row.obra || 'Não informado';
          updates.current_worksite_start_date = today;
          updates.has_assignment_info = true;
        }
        if (row.empresa) {
          // Anexa empresa responsável às observações sem perder o que já existe
          const { data: cur } = await supabase
            .from('frota_veiculos')
            .select('observacoes')
            .eq('id', row.veiculoId!)
            .maybeSingle();
          const tag = `Empresa Resp.: ${row.empresa}`;
          const prev = (cur?.observacoes || '').trim();
          if (!prev.includes(tag)) {
            updates.observacoes = prev ? `${prev}\n${tag}` : tag;
          }
        }

        const { error: updErr } = await supabase
          .from('frota_veiculos')
          .update(updates)
          .eq('id', row.veiculoId!);
        if (updErr) throw updErr;

        // 1b) Criar/atualizar registro em vehicle_finance (a aba Financeiro lê daqui)
        if (financeType) {
          const { data: existingFin } = await supabase
            .from('vehicle_finance')
            .select('id')
            .eq('vehicle_id', row.veiculoId!)
            .maybeSingle();
          const finPayload: Record<string, any> = {
            vehicle_id: row.veiculoId!,
            empresa_id: activeEmpresaId,
            type: financeType,
            status: financeStatus || 'EM_ANDAMENTO',
            direct_payment: financeType === 'AVISTA',
            term_months: financeType === 'AVISTA' ? 1 : 1,
            installment_value: 0,
            installments_paid: financeType === 'AVISTA' ? 1 : 0,
            down_payment: 0,
            notes: `Importado via planilha — ${row.situacaoFinanceira}`,
          };
          if (existingFin?.id) {
            await supabase.from('vehicle_finance').update(finPayload).eq('id', existingFin.id);
          } else {
            await supabase.from('vehicle_finance').insert(finPayload as any);
          }
        }

        // 2) Alocação (obra + responsável) — encerra a anterior e cria nova
        if (row.obra || row.responsavel) {
          // Encerra ativa anterior
          await supabase
            .from('vehicle_assignment_history')
            .update({ end_date: today })
            .eq('vehicle_id', row.veiculoId!)
            .is('end_date', null);

          const { error: insErr } = await supabase
            .from('vehicle_assignment_history')
            .insert({
              vehicle_id: row.veiculoId!,
              responsible_name: row.responsavel || 'Não informado',
              responsible_contact: row.contato || null,
              worksite_name: row.obra || 'Não informado',
              start_date: today,
              notes: 'Importado via planilha operacional',
            });
          if (insErr) throw insErr;
        }

        // 3) Tacógrafo: criar vistoria se houver data de validade
        if (row.tacografoVenc) {
          // Evitar duplicar se já existe vistoria com mesma validade
          const { data: existing } = await supabase
            .from('truck_tachograph_inspections')
            .select('id')
            .eq('vehicle_id', row.veiculoId!)
            .eq('valid_until', row.tacografoVenc)
            .limit(1);
          if (!existing || existing.length === 0) {
            // Inferir data da vistoria como 2 anos antes da validade
            const [yy, mm, dd] = row.tacografoVenc.split('-').map(Number);
            const inspDate = `${yy - 2}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
            await supabase.from('truck_tachograph_inspections').insert({
              vehicle_id: row.veiculoId!,
              inspection_date: inspDate,
              valid_until: row.tacografoVenc,
              cost: 0,
              notes: `Importado via planilha — status: ${row.tacografoStatus || 'N/A'}`,
            });
          }
        }

        const i = updatedRows.findIndex(r => r.rowIndex === row.rowIndex);
        if (i >= 0) updatedRows[i] = { ...updatedRows[i], status: 'updated' };
      } catch (err: any) {
        console.error('Erro ao importar linha', row, err);
        const i = updatedRows.findIndex(r => r.rowIndex === row.rowIndex);
        if (i >= 0) updatedRows[i] = { ...updatedRows[i], status: 'error', errorMsg: err?.message || 'Erro' };
      }
      done++;
      setProgress(Math.round((done / toProcess.length) * 100));
      setRows([...updatedRows]);
    }

    setImporting(false);
    const okCount = updatedRows.filter(r => r.status === 'updated').length;
    const errCount = updatedRows.filter(r => r.status === 'error').length;
    const nfCount = updatedRows.filter(r => r.status === 'not_found').length;
    toast.success(`Importação concluída: ${okCount} atualizados, ${errCount} erros, ${nfCount} placas não encontradas`);
    onSuccess?.();
    window.dispatchEvent(new Event('frota-data-updated'));
  };

  const okCount = rows.filter(r => r.status === 'updated').length;
  const pendingCount = rows.filter(r => r.status === 'pending').length;
  const notFoundCount = rows.filter(r => r.status === 'not_found').length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!importing) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Dados Operacionais (Obra, Rastreador, Tacógrafo)
          </DialogTitle>
          <DialogDescription>
            Faça upload da planilha SmartControl. Match feito por placa. Veículos que não existirem na frota serão ignorados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {!file && (
            <Card className="p-8 border-dashed border-2 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Selecione a planilha (.xlsx, .xls ou .csv)
              </p>
              <input
                id="op-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button onClick={() => document.getElementById('op-file-input')?.click()}>
                Escolher arquivo
              </Button>
              <div className="mt-4 text-xs text-muted-foreground space-y-0.5 text-left max-w-md mx-auto">
                <p className="font-medium">Colunas esperadas (por posição):</p>
                <p>1. Veículo • 2. <strong>Placa</strong> • 3. Obra • 4. Responsável</p>
                <p>5. Contato • 6. Rastreador • 7. Sit. Financeira</p>
                <p>8. Empresa Responsável • 9. Tacógrafo (ex: "APTO VENC. 22/11/2027")</p>
              </div>
            </Card>
          )}

          {parsing && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Lendo planilha…</p>
            </div>
          )}

          {file && rows.length > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    {file.name}
                  </Badge>
                  <Badge variant="secondary">{rows.length} linhas</Badge>
                  {pendingCount > 0 && <Badge className="bg-blue-100 text-blue-800">{pendingCount} prontos</Badge>}
                  {okCount > 0 && <Badge className="bg-green-100 text-green-800">{okCount} atualizados</Badge>}
                  {notFoundCount > 0 && <Badge variant="destructive">{notFoundCount} não encontrados</Badge>}
                </div>
                {!importing && (
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <X className="h-4 w-4 mr-1" />Trocar
                  </Button>
                )}
              </div>

              {importing && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-2 py-1.5">Status</th>
                      <th className="px-2 py-1.5">Placa</th>
                      <th className="px-2 py-1.5">Veículo</th>
                      <th className="px-2 py-1.5">Obra</th>
                      <th className="px-2 py-1.5">Responsável</th>
                      <th className="px-2 py-1.5 text-center">Rastr.</th>
                      <th className="px-2 py-1.5">Sit. Fin.</th>
                      <th className="px-2 py-1.5">Tacógrafo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.rowIndex} className="border-t hover:bg-muted/30">
                        <td className="px-2 py-1.5">
                          {r.status === 'updated' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {r.status === 'not_found' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                          {r.status === 'error' && <X className="h-4 w-4 text-destructive" />}
                          {r.status === 'pending' && <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />}
                        </td>
                        <td className="px-2 py-1.5 font-mono">{r.placaNormalizada}</td>
                        <td className="px-2 py-1.5 truncate max-w-[140px]">{r.modelo}</td>
                        <td className="px-2 py-1.5 truncate max-w-[140px]">{r.obra || '—'}</td>
                        <td className="px-2 py-1.5 truncate max-w-[120px]">{r.responsavel || '—'}</td>
                        <td className="px-2 py-1.5 text-center">{r.rastreador ? '✓' : '—'}</td>
                        <td className="px-2 py-1.5 truncate max-w-[100px]">{r.situacaoFinanceira || '—'}</td>
                        <td className="px-2 py-1.5 truncate max-w-[160px]">
                          {r.tacografoVenc ? `${r.tacografoStatus || ''} ${r.tacografoVenc.split('-').reverse().join('/')}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || pendingCount === 0}
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando…</>
            ) : (
              <>Importar {pendingCount > 0 ? `(${pendingCount})` : ''}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
