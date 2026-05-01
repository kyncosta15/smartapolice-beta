import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Building2, Calendar } from 'lucide-react';
import { ConsultoriaCaso, STATUS_LABELS, TIPO_CASO_LABELS } from '@/hooks/useConsultoria';

export function CasoCard({ caso }: { caso: ConsultoriaCaso }) {
  const navigate = useNavigate();
  const status = STATUS_LABELS[caso.status] ?? STATUS_LABELS.rascunho;

  return (
    <Card
      onClick={() => navigate(`/consultoria-premium/${caso.id}`)}
      className="p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{caso.titulo}</h3>
        <Badge className={`shrink-0 ${status.color} border-0`}>{status.label}</Badge>
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {caso.empresa_nome && (
          <div className="flex items-center gap-1.5 text-foreground/80 font-medium">
            <Building2 className="size-3" />
            <span className="truncate">{caso.empresa_nome}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <FileText className="size-3" />
          <span>{TIPO_CASO_LABELS[caso.tipo_caso] ?? caso.tipo_caso}</span>
        </div>
        {caso.cnpjs && caso.cnpjs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">
              {caso.cnpjs.length} {caso.cnpjs.length === 1 ? 'CNPJ' : 'CNPJs'}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3" />
          <span>
            {new Date(caso.updated_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </Card>
  );
}
