import type { Meta, StoryObj } from '@storybook/react'
import { DropdownRCorp } from '../components/DropdownRCorp'
import { MoreHorizontal, Edit, Trash2, Eye, Copy, Share } from 'lucide-react'

const meta: Meta<typeof DropdownRCorp> = {
  title: 'Overlays/DropdownRCorp',
  component: DropdownRCorp,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Dropdown Menu acessível usando Radix UI com keyboard navigation e submenus.',
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
    trigger: <TriggerButton><MoreHorizontal className="h-4 w-4" /></TriggerButton>,
    items: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => alert('Visualizar clicado'),
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: <Edit className="h-4 w-4" />,
        onClick: () => alert('Editar clicado'),
      },
      { type: 'separator' },
      {
        id: 'copy',
        label: 'Copiar',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => alert('Copiar clicado'),
      },
      {
        id: 'share',
        label: 'Compartilhar',
        icon: <Share className="h-4 w-4" />,
        onClick: () => alert('Compartilhar clicado'),
      },
      { type: 'separator' },
      {
        id: 'delete',
        label: 'Excluir',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        onClick: () => alert('Excluir clicado'),
      },
    ],
  },
}

export const WithSubMenu: Story = {
  args: {
    trigger: <TriggerButton>Menu com Submenu</TriggerButton>,
    items: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => alert('Visualizar clicado'),
      },
      {
        id: 'edit',
        label: 'Editar',
        icon: <Edit className="h-4 w-4" />,
        items: [
          {
            id: 'edit-name',
            label: 'Editar Nome',
            onClick: () => alert('Editar Nome'),
          },
          {
            id: 'edit-description',
            label: 'Editar Descrição',
            onClick: () => alert('Editar Descrição'),
          },
        ],
      },
      { type: 'separator' },
      {
        id: 'share',
        label: 'Compartilhar',
        icon: <Share className="h-4 w-4" />,
        items: [
          {
            id: 'share-email',
            label: 'Por Email',
            onClick: () => alert('Compartilhar por Email'),
          },
          {
            id: 'share-link',
            label: 'Copiar Link',
            onClick: () => alert('Copiar Link'),
          },
        ],
      },
    ],
  },
}

export const DisabledItems: Story = {
  args: {
    trigger: <TriggerButton>Com Itens Desabilitados</TriggerButton>,
    items: [
      {
        id: 'view',
        label: 'Visualizar',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => alert('Visualizar clicado'),
      },
      {
        id: 'edit',
        label: 'Editar (Desabilitado)',
        icon: <Edit className="h-4 w-4" />,
        disabled: true,
        onClick: () => alert('Este não deveria ser chamado'),
      },
      { type: 'separator' },
      {
        id: 'delete',
        label: 'Excluir (Desabilitado)',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        disabled: true,
        onClick: () => alert('Este não deveria ser chamado'),
      },
    ],
  },
}

export const TableRowActions: Story = {
  name: 'Ações da Tabela (Caso de Uso Real)',
  args: {
    trigger: (
      <button className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Abrir menu</span>
      </button>
    ),
    items: [
      {
        id: 'view-details',
        label: 'Ver detalhes',
        icon: <Eye className="h-4 w-4" />,
        onClick: () => console.log('Abrir modal de detalhes'),
      },
      {
        id: 'edit-vehicle',
        label: 'Editar veículo',
        icon: <Edit className="h-4 w-4" />,
        onClick: () => console.log('Abrir formulário de edição'),
      },
      { type: 'separator' },
      {
        id: 'copy-plate',
        label: 'Copiar placa',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => console.log('Placa copiada!'),
      },
      { type: 'separator' },
      {
        id: 'delete-vehicle',
        label: 'Excluir veículo',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'destructive',
        onClick: () => console.log('Confirmar exclusão'),
      },
    ],
  },
}