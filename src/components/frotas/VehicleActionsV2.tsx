import React from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Edit, FileText, Trash2 } from 'lucide-react'
import { DropdownRCorp } from '../../packages/ui/src/components/DropdownRCorp'
import type { DropdownItem } from '../../packages/ui/src/components/DropdownRCorp'
import { FrotaVeiculo } from '@/hooks/useFrotasData'

interface VehicleActionsV2Props {
  veiculo: FrotaVeiculo
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDocs: (id: string) => void
}

export function VehicleActionsV2({ veiculo, onView, onEdit, onDocs }: VehicleActionsV2Props) {
  const dropdownItems: DropdownItem[] = [
    {
      id: 'view',
      label: 'Ver detalhes',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => onView(veiculo.id),
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => onEdit(veiculo.id),
    },
    {
      id: 'docs',
      label: 'Documentos',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onDocs(veiculo.id),
    },
  ]

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onView(veiculo.id)}
        className="h-8 px-3"
        aria-label={`Ver detalhes do veículo ${veiculo.placa}`}
      >
        <Eye className="h-3 w-3" />
        <span className="sr-only">Ver detalhes</span>
      </Button>

      <DropdownRCorp
        trigger={
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            aria-label={`Mais ações para o veículo ${veiculo.placa}`}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
            <span className="sr-only">Mais ações</span>
          </Button>
        }
        items={dropdownItems}
        align="end"
      />
    </div>
  )
}