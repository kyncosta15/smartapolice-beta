import type { Meta, StoryObj } from '@storybook/react'
import { 
  HomeIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  CogIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import { TabsRCorp } from '../components/TabsRCorp'

const meta: Meta<typeof TabsRCorp> = {
  title: 'Components/TabsRCorp',
  component: TabsRCorp,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Componente de abas reutilizável baseado em Headless UI com suporte a lazy loading, contadores e sincronização com URL.'
      }
    }
  },
  argTypes: {
    urlSync: {
      control: 'boolean',
      description: 'Sincroniza a aba selecionada com a URL (?tab=id)'
    },
    initialTabId: {
      control: 'text',
      description: 'ID da aba inicial a ser selecionada'
    }
  },
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof TabsRCorp>

// Componentes de exemplo para os painéis
const DashboardPanel = () => (
  <div className="bg-white rounded-lg border p-6">
    <h3 className="text-lg font-semibold mb-4">Dashboard</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-blue-600">150</div>
        <div className="text-sm text-blue-600">Total de tickets</div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-green-600">45</div>
        <div className="text-sm text-green-600">Resolvidos hoje</div>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="text-2xl font-bold text-orange-600">12</div>
        <div className="text-sm text-orange-600">Pendentes</div>
      </div>
    </div>
  </div>
)

const UsersPanel = () => (
  <div className="bg-white rounded-lg border p-6">
    <h3 className="text-lg font-semibold mb-4">Usuários</h3>
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">U{i}</span>
          </div>
          <div>
            <div className="font-medium">Usuário {i}</div>
            <div className="text-sm text-gray-500">usuario{i}@example.com</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const ReportsPanel = () => (
  <div className="bg-white rounded-lg border p-6">
    <h3 className="text-lg font-semibold mb-4">Relatórios</h3>
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <h4 className="font-medium">Relatório Mensal</h4>
        <p className="text-sm text-gray-500 mt-1">Dados consolidados do último mês</p>
        <button className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
          Baixar PDF
        </button>
      </div>
      <div className="border rounded-lg p-4">
        <h4 className="font-medium">Análise de Performance</h4>
        <p className="text-sm text-gray-500 mt-1">Métricas de desempenho da equipe</p>
        <button className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
          Visualizar
        </button>
      </div>
    </div>
  </div>
)

const LazyPanel = ({ name }: { name: string }) => (
  <div className="bg-white rounded-lg border p-6">
    <h3 className="text-lg font-semibold mb-4">Painel Lazy: {name}</h3>
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
    <p className="mt-4 text-sm text-gray-500">
      Este conteúdo foi carregado apenas quando a aba foi selecionada (lazy loading).
    </p>
  </div>
)

// Story: Padrão
export const Default: Story = {
  args: {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <HomeIcon className="w-4 h-4" />,
        content: <DashboardPanel />
      },
      {
        id: 'users',
        label: 'Usuários',
        icon: <UserGroupIcon className="w-4 h-4" />,
        count: 25,
        content: <UsersPanel />
      },
      {
        id: 'reports',
        label: 'Relatórios',
        icon: <ChartBarIcon className="w-4 h-4" />,
        content: <ReportsPanel />
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: <CogIcon className="w-4 h-4" />,
        content: (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações</h3>
            <p className="text-gray-600">Painel de configurações do sistema.</p>
          </div>
        )
      }
    ],
    initialTabId: 'dashboard',
    urlSync: false
  }
}

// Story: Com Contadores
export const ComContadores: Story = {
  args: {
    items: [
      {
        id: 'todos',
        label: 'Todos',
        icon: <HomeIcon className="w-4 h-4" />,
        count: 156,
        content: <div className="p-6 bg-white rounded-lg border">
          <h3 className="font-semibold mb-2">Todos os Tickets (156)</h3>
          <p className="text-gray-600">Lista completa de todos os tickets do sistema.</p>
        </div>
      },
      {
        id: 'sinistros',
        label: 'Sinistros',
        icon: <ExclamationTriangleIcon className="w-4 h-4" />,
        count: 89,
        content: <div className="p-6 bg-red-50 rounded-lg border border-red-200">
          <h3 className="font-semibold mb-2 text-red-800">Sinistros (89)</h3>
          <p className="text-red-600">Tickets de sinistros em andamento.</p>
        </div>
      },
      {
        id: 'assistencias',
        label: 'Assistências',
        icon: <WrenchScrewdriverIcon className="w-4 h-4" />,
        count: 67,
        content: <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2 text-blue-800">Assistências (67)</h3>
          <p className="text-blue-600">Tickets de assistência técnica.</p>
        </div>
      }
    ],
    initialTabId: 'todos',
    urlSync: false
  }
}

// Story: Muitas Abas (demonstra scroll horizontal)
export const MuitasAbas: Story = {
  args: {
    items: [
      { id: 'tab1', label: 'Dashboard Geral', icon: <HomeIcon className="w-4 h-4" />, count: 150, content: <LazyPanel name="Dashboard" /> },
      { id: 'tab2', label: 'Sinistros Ativos', icon: <ExclamationTriangleIcon className="w-4 h-4" />, count: 45, content: <LazyPanel name="Sinistros" /> },
      { id: 'tab3', label: 'Assistências Pendentes', icon: <WrenchScrewdriverIcon className="w-4 h-4" />, count: 23, content: <LazyPanel name="Assistências" /> },
      { id: 'tab4', label: 'Usuários do Sistema', icon: <UserGroupIcon className="w-4 h-4" />, count: 89, content: <LazyPanel name="Usuários" /> },
      { id: 'tab5', label: 'Relatórios Mensais', icon: <ChartBarIcon className="w-4 h-4" />, count: 12, content: <LazyPanel name="Relatórios" /> },
      { id: 'tab6', label: 'Configurações Avançadas', icon: <CogIcon className="w-4 h-4" />, content: <LazyPanel name="Configurações" /> },
      { id: 'tab7', label: 'Logs do Sistema', count: 1250, content: <LazyPanel name="Logs" /> },
      { id: 'tab8', label: 'Backup e Restauração', content: <LazyPanel name="Backup" /> }
    ],
    initialTabId: 'tab1',
    urlSync: false
  }
}

// Story: Lazy Loading
export const LazyPanels: Story = {
  args: {
    items: [
      {
        id: 'instant',
        label: 'Carregamento Imediato',
        icon: <HomeIcon className="w-4 h-4" />,
        lazy: false,
        content: (
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-2 text-green-800">✅ Carregado Imediatamente</h3>
            <p className="text-green-600">Este painel é carregado assim que o componente é montado.</p>
          </div>
        )
      },
      {
        id: 'lazy1',
        label: 'Lazy Loading 1',
        icon: <ChartBarIcon className="w-4 h-4" />,
        lazy: true,
        count: 100,
        content: <LazyPanel name="Primeiro Lazy" />
      },
      {
        id: 'lazy2',
        label: 'Lazy Loading 2',
        icon: <UserGroupIcon className="w-4 h-4" />,
        lazy: true,
        count: 250,
        content: <LazyPanel name="Segundo Lazy" />
      },
      {
        id: 'lazy3',
        label: 'Lazy Loading 3',
        icon: <CogIcon className="w-4 h-4" />,
        lazy: true,
        content: <LazyPanel name="Terceiro Lazy" />
      }
    ],
    initialTabId: 'instant',
    urlSync: false
  }
}

// Story: Sem Ícones
export const SemIcones: Story = {
  args: {
    items: [
      {
        id: 'simples1',
        label: 'Primeira Aba',
        content: <div className="p-6 bg-white rounded-lg border">Conteúdo da primeira aba sem ícone.</div>
      },
      {
        id: 'simples2',
        label: 'Segunda Aba',
        count: 42,
        content: <div className="p-6 bg-white rounded-lg border">Conteúdo da segunda aba com contador mas sem ícone.</div>
      },
      {
        id: 'simples3',
        label: 'Terceira Aba',
        content: <div className="p-6 bg-white rounded-lg border">Conteúdo da terceira aba minimalista.</div>
      }
    ],
    initialTabId: 'simples1',
    urlSync: false
  }
}