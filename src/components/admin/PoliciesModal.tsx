import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Shield, Calendar, Building2, FileText } from 'lucide-react';
import { getDocumentos } from '@/services/corpnuvem/documentos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PoliciesPeriod } from '@/hooks/useCorpNuvemPolicies';

interface PoliciesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodo: PoliciesPeriod;
  ano?: number;
}

export function PoliciesModal({ open, onOpenChange, periodo, ano }: PoliciesModalProps) {
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    if (open) {
      fetchPolicies(currentPage);
    }
  }, [open, currentPage, periodo, ano]);

  const fetchPolicies = async (page: number) => {
    try {
      setLoading(true);
      const data = await getDocumentos({
        qtd_pag: itemsPerPage,
        pag: page,
        periodo,
        codfil: 1,
        ano,
      });

      setPolicies(data?.documentos || []);
      setTotalCount(data?.header?.count || 0);
      setTotalPages(Math.ceil((data?.header?.count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Erro ao buscar apólices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      // Se vier em formato DD/MM/YYYY
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${day}/${month}/${year}`;
      }
      // Se vier em formato ISO
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (cancelado: string) => {
    if (cancelado === 'S') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Cancelada</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Ativa</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Apólices da API CorpNuvem
          </DialogTitle>
          <DialogDescription>
            Total de {totalCount.toLocaleString('pt-BR')} documentos disponíveis na API
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nº Apólice</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Seguradora</TableHead>
                  <TableHead>Ramo</TableHead>
                  <TableHead>Início Vig.</TableHead>
                  <TableHead>Fim Vig.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Filial</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhuma apólice encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((policy, index) => (
                    <TableRow key={`${policy.codfil}-${policy.nosnum}-${index}`}>
                      <TableCell className="font-medium">
                        {policy.numapo || `${policy.codfil}-${policy.nosnum}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{policy.cliente || '-'}</span>
                          <span className="text-xs text-muted-foreground">
                            {policy.documento || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{policy.seguradora || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{policy.ramo || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(policy.inivig)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(policy.fimvig)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(policy.cancelado)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {policy.codfil || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} ({totalCount.toLocaleString('pt-BR')} documentos)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
