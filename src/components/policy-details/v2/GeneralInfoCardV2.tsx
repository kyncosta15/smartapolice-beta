import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoCardV2 } from './InfoCardV2';

interface Props {
  policy: any;
  onEdit?: () => void;
}

export const GeneralInfoCardV2: React.FC<Props> = ({ policy, onEdit }) => {
  const tipo = policy?.tipo_seguro || policy?.type || '—';
  const seguradora = policy?.seguradora || policy?.insurer || '—';
  const numero = policy?.policyNumber || policy?.numero_apolice || '—';
  const uf = policy?.uf;

  return (
    <InfoCardV2
      title="Informações Gerais"
      icon={FileText}
      rows={[
        { label: 'Apólice', value: numero, mono: true },
        { label: 'Tipo de Seguro', value: tipo },
        { label: 'Seguradora', value: seguradora },
        {
          label: 'Estado (UF)',
          value: uf || (
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Não informado
            </span>
          ),
          action: !uf ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
              className="h-7 px-2.5 text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              Completar
            </Button>
          ) : undefined,
        },
      ]}
    />
  );
};
