import type { Meta, StoryObj } from '@storybook/react'
import { ComboboxRCorp } from '../components/ComboboxRCorp'
import { useState } from 'react'

const meta: Meta<typeof ComboboxRCorp> = {
  title: 'Data/ComboboxRCorp',
  component: ComboboxRCorp,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Combobox acessível usando React Aria para busca e seleção com keyboard navigation.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const mockVehicles = [
  { id: '1', label: 'ABC-1234', description: 'Honda Civic 2020 - João Silva' },
  { id: '2', label: 'DEF-5678', description: 'Toyota Corolla 2019 - Maria Santos' },
  { id: '3', label: 'GHI-9012', description: 'Chevrolet Onix 2021 - Pedro Costa' },
  { id: '4', label: 'JKL-3456', description: 'Volkswagen Jetta 2018 - Ana Oliveira' },
  { id: '5', label: 'MNO-7890', description: 'Ford Ka 2020 - Carlos Pereira' },
]

const mockUsers = [
  { id: '1', label: 'João Silva', description: 'joao.silva@empresa.com' },
  { id: '2', label: 'Maria Santos', description: 'maria.santos@empresa.com' },
  { id: '3', label: 'Pedro Costa', description: 'pedro.costa@empresa.com' },
  { id: '4', label: 'Ana Oliveira', description: 'ana.oliveira@empresa.com' },
]

export const Default: Story = {
  render: () => {
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState('')
    
    const filteredItems = mockVehicles.filter(item =>
      item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      item.description.toLowerCase().includes(inputValue.toLowerCase())
    )
    
    return (
      <div className="w-80">
        <ComboboxRCorp
          label="Selecionar Veículo"
          placeholder="Digite a placa ou proprietário..."
          items={filteredItems}
          selectedKey={selectedKey}
          onSelectionChange={setSelectedKey}
          inputValue={inputValue}
          onInputChange={setInputValue}
          isRequired
        />
      </div>
    )
  },
}

export const WithDescription: Story = {
  render: () => {
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState('')
    
    const filteredItems = mockUsers.filter(item =>
      item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      item.description.toLowerCase().includes(inputValue.toLowerCase())
    )
    
    return (
      <div className="w-80">
        <ComboboxRCorp
          label="Responsável pelo Sinistro"
          description="Selecione o colaborador responsável pela análise"
          placeholder="Digite o nome ou email..."
          items={filteredItems}
          selectedKey={selectedKey}
          onSelectionChange={setSelectedKey}
          inputValue={inputValue}
          onInputChange={setInputValue}
        />
      </div>
    )
  },
}

export const Loading: Story = {
  render: () => {
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState('')
    
    return (
      <div className="w-80">
        <ComboboxRCorp
          label="Buscar Veículos"
          placeholder="Digite para buscar..."
          items={[]}
          selectedKey={selectedKey}
          onSelectionChange={setSelectedKey}
          inputValue={inputValue}
          onInputChange={setInputValue}
          isLoading={true}
        />
      </div>
    )
  },
}

export const NoResults: Story = {
  render: () => {
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState('XYZ-9999')
    
    return (
      <div className="w-80">
        <ComboboxRCorp
          label="Buscar Veículos"
          placeholder="Digite a placa..."
          items={[]}
          selectedKey={selectedKey}
          onSelectionChange={setSelectedKey}
          inputValue={inputValue}
          onInputChange={setInputValue}
          noResultsLabel="Nenhum veículo encontrado com esta placa"
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => {
    const [selectedKey, setSelectedKey] = useState<string | null>('2')
    const [inputValue, setInputValue] = useState('DEF-5678')
    
    return (
      <div className="w-80">
        <ComboboxRCorp
          label="Veículo Selecionado"
          description="Este campo está desabilitado"
          placeholder="Campo desabilitado"
          items={mockVehicles}
          selectedKey={selectedKey}
          onSelectionChange={setSelectedKey}
          inputValue={inputValue}
          onInputChange={setInputValue}
          isDisabled={true}
        />
      </div>
    )
  },
}

export const VehicleSearch: Story = {
  name: 'Busca de Veículos (Caso Real)',
  render: () => {
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    
    // Simula busca com debounce
    const filteredItems = mockVehicles.filter(item => {
      if (!inputValue) return true
      return (
        item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        item.description.toLowerCase().includes(inputValue.toLowerCase())
      )
    })
    
    const handleInputChange = (value: string) => {
      setInputValue(value)
      if (value.length > 2) {
        setIsLoading(true)
        // Simula API call
        setTimeout(() => setIsLoading(false), 500)
      }
    }
    
    return (
      <div className="w-96">
        <ComboboxRCorp
          label="Veículo Envolvido"
          description="Digite a placa, chassi ou nome do proprietário"
          placeholder="Ex: ABC-1234 ou João Silva"
          items={filteredItems}
          selectedKey={selectedKey}
          onSelectionChange={(key) => {
            setSelectedKey(key)
            console.log('Veículo selecionado:', key)
          }}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          isLoading={isLoading}
          noResultsLabel="Nenhum veículo encontrado. Verifique a placa ou proprietário."
          isRequired
        />
        
        {selectedKey && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Veículo Selecionado:</p>
            <p className="text-sm text-muted-foreground">
              {mockVehicles.find(v => v.id === selectedKey)?.description}
            </p>
          </div>
        )}
      </div>
    )
  },
}