import type { Meta, StoryObj } from '@storybook/react'
import { PopoverRCorp } from '../components/PopoverRCorp'
import { Info, Calendar, Settings } from 'lucide-react'

const meta: Meta<typeof PopoverRCorp> = {
  title: 'Overlays/PopoverRCorp',
  component: PopoverRCorp,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Popover acessível usando Radix UI para exibir conteúdo contextual.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const TriggerButton = ({ children, ...props }: any) => (
  <button
    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    {...props}
  >
    {children}
  </button>
)

export const Default: Story = {
  args: {
    trigger: <TriggerButton><Info className="h-4 w-4 mr-2" />Informações</TriggerButton>,
    children: (
      <div className="space-y-2">
        <h3 className="font-medium">Detalhes do Veículo</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Placa:</strong> ABC-1234</p>
          <p><strong>Modelo:</strong> Honda Civic</p>
          <p><strong>Ano:</strong> 2020</p>
          <p><strong>Status:</strong> Ativo</p>
        </div>
      </div>
    ),
  },
}

export const ChartTooltip: Story = {
  name: 'Tooltip do Gráfico',
  args: {
    trigger: (
      <div className="h-20 w-20 bg-primary/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors">
        <span className="text-2xl font-bold text-primary">85%</span>
      </div>
    ),
    children: (
      <div className="space-y-2">
        <h4 className="font-medium">Conformidade</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Documentos OK:</span>
            <span className="font-medium text-green-600">340</span>
          </div>
          <div className="flex justify-between">
            <span>Pendentes:</span>
            <span className="font-medium text-yellow-600">45</span>
          </div>
          <div className="flex justify-between">
            <span>Vencidos:</span>
            <span className="font-medium text-red-600">15</span>
          </div>
          <hr className="my-1" />
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>400</span>
          </div>
        </div>
      </div>
    ),
    side: 'top',
  },
}

export const FormHelp: Story = {
  name: 'Ajuda do Formulário',
  args: {
    trigger: (
      <button className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80">
        <Info className="h-3 w-3" />
      </button>
    ),
    children: (
      <div className="max-w-xs">
        <p className="text-sm">
          Informe o número da placa do veículo no formato ABC-1234 ou ABC1D23 (Mercosul).
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          <p>Exemplos válidos:</p>
          <ul className="list-disc list-inside mt-1">
            <li>ABC-1234</li>
            <li>BRA2E19</li>
          </ul>
        </div>
      </div>
    ),
    side: 'right',
    align: 'start',
  },
}

export const StatusDetails: Story = {
  name: 'Detalhes do Status',
  args: {
    trigger: (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200 transition-colors">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
        Pendente
      </div>
    ),
    children: (
      <div className="space-y-3">
        <div>
          <h4 className="font-medium mb-2">Status: Pendente Aprovação</h4>
          <p className="text-sm text-muted-foreground">
            Aguardando aprovação do gestor para liberação do sinistro.
          </p>
        </div>
        
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Próximos passos:</h5>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Análise da documentação</li>
            <li>2. Aprovação do valor</li>
            <li>3. Autorização de reparo</li>
          </ol>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Última atualização: há 2 horas
          </p>
        </div>
      </div>
    ),
    className: "w-80",
  },
}

export const DateRangePicker: Story = {
  name: 'Seletor de Data',
  args: {
    trigger: (
      <TriggerButton>
        <Calendar className="h-4 w-4 mr-2" />
        Selecionar Período
      </TriggerButton>
    ),
    children: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Filtrar por período</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Data inicial</label>
            <input type="date" className="w-full px-2 py-1 border rounded text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Data final</label>
            <input type="date" className="w-full px-2 py-1 border rounded text-sm" />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
            Cancelar
          </button>
          <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Aplicar
          </button>
        </div>
      </div>
    ),
    className: "w-80",
  },
}