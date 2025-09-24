import type { Meta, StoryObj } from '@storybook/react'
import { TooltipRCorp } from '../components/TooltipRCorp'
import { HelpCircle, AlertCircle, CheckCircle, Info } from 'lucide-react'

const meta: Meta<typeof TooltipRCorp> = {
  title: 'Overlays/TooltipRCorp',
  component: TooltipRCorp,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Tooltip acessível usando Radix UI para dicas rápidas e contextuais.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    content: 'Esta é uma dica simples',
    children: (
      <button className="p-2 border rounded-md hover:bg-muted">
        <HelpCircle className="h-4 w-4" />
      </button>
    ),
  },
}

export const MultilineTooltip: Story = {
  args: {
    content: (
      <div className="space-y-1">
        <p className="font-medium">Informação Importante</p>
        <p className="text-xs">Esta ação irá atualizar todos os registros relacionados ao veículo.</p>
      </div>
    ),
    children: (
      <button className="p-2 border rounded-md hover:bg-muted">
        <Info className="h-4 w-4" />
      </button>
    ),
  },
}

export const StatusTooltips: Story = {
  name: 'Tooltips de Status',
  render: () => (
    <div className="flex gap-4">
      <TooltipRCorp content="Processo concluído com sucesso">
        <div className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm">Aprovado</span>
        </div>
      </TooltipRCorp>
      
      <TooltipRCorp content="Aguardando documentação adicional">
        <div className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm">Pendente</span>
        </div>
      </TooltipRCorp>
      
      <TooltipRCorp content="Documentação rejeitada - verificar observações">
        <div className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm">Rejeitado</span>
        </div>
      </TooltipRCorp>
    </div>
  ),
}

export const TimelineTooltips: Story = {
  name: 'Tooltips na Esteira (Timeline)',
  render: () => (
    <div className="flex items-center justify-between w-full max-w-md">
      {/* Etapa 1 - Concluída */}
      <TooltipRCorp 
        content={
          <div className="space-y-1">
            <p className="font-medium">Solicitação Criada</p>
            <p className="text-xs">25/09/2024 às 14:30</p>
            <p className="text-xs">Por: João Silva</p>
          </div>
        }
      >
        <div className="flex flex-col items-center cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs mt-1">Criada</span>
        </div>
      </TooltipRCorp>

      <div className="flex-1 h-0.5 bg-green-600 mx-2"></div>

      {/* Etapa 2 - Atual */}
      <TooltipRCorp 
        content={
          <div className="space-y-1">
            <p className="font-medium">Em Análise</p>
            <p className="text-xs">Iniciada em 25/09/2024 às 15:45</p>
            <p className="text-xs">Responsável: Maria Santos</p>
            <p className="text-xs text-yellow-600">Aguardando aprovação</p>
          </div>
        }
      >
        <div className="flex flex-col items-center cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center animate-pulse">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs mt-1">Análise</span>
        </div>
      </TooltipRCorp>

      <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>

      {/* Etapa 3 - Pendente */}
      <TooltipRCorp 
        content={
          <div className="space-y-1">
            <p className="font-medium">Aprovação Final</p>
            <p className="text-xs text-muted-foreground">Aguardando etapa anterior</p>
          </div>
        }
      >
        <div className="flex flex-col items-center cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-sm text-gray-600">3</span>
          </div>
          <span className="text-xs mt-1 text-muted-foreground">Aprovação</span>
        </div>
      </TooltipRCorp>
    </div>
  ),
}

export const FormFieldTooltip: Story = {
  name: 'Tooltip de Campo de Formulário',
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-1">
          Chassi do Veículo
          <TooltipRCorp 
            content={
              <div className="max-w-xs">
                <p className="text-sm">O número do chassi é encontrado:</p>
                <ul className="text-xs mt-1 space-y-1">
                  <li>• Documento do veículo</li>
                  <li>• Parabrisa (lado direito)</li>
                  <li>• Compartimento do motor</li>
                </ul>
                <p className="text-xs mt-2 text-muted-foreground">
                  Deve conter 17 caracteres
                </p>
              </div>
            }
            side="right"
          >
            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipRCorp>
        </label>
        <input 
          type="text" 
          placeholder="Ex: 9BD12345678901234"
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      
      <div>
        <label className="flex items-center gap-2 text-sm font-medium mb-1">
          Valor da Franquia
          <TooltipRCorp 
            content="Valor que será descontado em caso de sinistro com culpa"
            side="right"
          >
            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
          </TooltipRCorp>
        </label>
        <input 
          type="text" 
          placeholder="R$ 0,00"
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
    </div>
  ),
}

export const DelayedTooltip: Story = {
  args: {
    content: 'Este tooltip aparece após 1 segundo',
    delayDuration: 1000,
    children: (
      <button className="p-4 border rounded-md hover:bg-muted">
        Hover por 1 segundo
      </button>
    ),
  },
}

export const QuickTooltip: Story = {
  args: {
    content: 'Tooltip rápido (100ms)',
    delayDuration: 100,
    children: (
      <button className="p-4 border rounded-md hover:bg-muted">
        Hover rápido
      </button>
    ),
  },
}