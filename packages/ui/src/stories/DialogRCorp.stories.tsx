import type { Meta, StoryObj } from '@storybook/react'
import { DialogRCorp } from '../components/DialogRCorp'
import { Button } from '../components/Button'

const meta: Meta<typeof DialogRCorp> = {
  title: 'Overlays/DialogRCorp',
  component: DialogRCorp,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Dialog acessível usando Radix UI com foco gerenciado e keyboard navigation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Botão simples para usar como trigger
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
    title: 'Confirmar ação',
    description: 'Esta ação não pode ser desfeita. Tem certeza que deseja continuar?',
    size: 'md',
    trigger: <TriggerButton>Abrir Dialog</TriggerButton>,
    children: (
      <div className="space-y-4">
        <p>Conteúdo do dialog aqui.</p>
        <p>Teste de navegação por teclado: TAB, SHIFT+TAB, ESC para fechar.</p>
      </div>
    ),
    footer: (
      <div className="flex gap-2">
        <TriggerButton>Cancelar</TriggerButton>
        <TriggerButton>Confirmar</TriggerButton>
      </div>
    ),
  },
}

export const Small: Story = {
  args: {
    ...Default.args,
    size: 'sm',
    title: 'Dialog Pequeno',
    description: 'Exemplo de dialog com tamanho pequeno.',
  },
}

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'lg',
    title: 'Dialog Grande',
    description: 'Exemplo de dialog com tamanho grande para mais conteúdo.',
    children: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Nome</label>
            <input className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="Digite seu nome" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="Digite seu email" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Mensagem</label>
          <textarea className="w-full mt-1 px-3 py-2 border rounded-md" rows={4} placeholder="Digite sua mensagem" />
        </div>
      </div>
    ),
  },
}

export const WithoutFooter: Story = {
  args: {
    title: 'Informação',
    description: 'Dialog apenas informativo, sem ações.',
    trigger: <TriggerButton>Mostrar Info</TriggerButton>,
    children: (
      <div className="text-center py-4">
        <p>✅ Operação realizada com sucesso!</p>
      </div>
    ),
  },
}

export const ScrollableContent: Story = {
  args: {
    title: 'Termos de Uso',
    description: 'Conteúdo longo com scroll.',
    trigger: <TriggerButton>Ver Termos</TriggerButton>,
    children: (
      <div className="space-y-4">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} className="text-sm">
            {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        ))}
      </div>
    ),
    footer: (
      <TriggerButton>Aceitar Termos</TriggerButton>
    ),
  },
}