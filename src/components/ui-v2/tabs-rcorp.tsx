'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Tab } from '@headlessui/react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type TabItem = {
  id: string                 // usado também na URL (?tab=id)
  label: string              // texto da aba
  icon?: React.ReactNode     // opcional: ícone à esquerda
  count?: number             // opcional: badge de contagem
  lazy?: boolean             // se true, o conteúdo carrega on-demand
  content: React.ReactNode   // conteúdo do painel
}

export type TabsRCorpProps = {
  items: TabItem[]
  initialTabId?: string      // id inicial; se ausente, usar ?tab= ou primeira aba
  urlSync?: boolean          // default: true — sincroniza com ?tab=
  className?: string         // container
  listClassName?: string     // Tab.List
  panelClassName?: string    // Tab.Panel
  onTabChange?: (tabId: string) => void // callback para mudança de aba
}

export function TabsRCorp({
  items,
  initialTabId,
  urlSync = true,
  className,
  listClassName,
  panelClassName,
  onTabChange
}: TabsRCorpProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Inicializar após hidratação para evitar mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Determinar aba inicial
  const getInitialTabIndex = useCallback(() => {
    if (!isClient) return 0
    
    const urlTabId = urlSync ? searchParams.get('tab') : null
    const targetTabId = urlTabId || initialTabId
    
    if (targetTabId) {
      const index = items.findIndex(item => item.id === targetTabId)
      return index >= 0 ? index : 0
    }
    
    return 0
  }, [items, initialTabId, urlSync, searchParams, isClient])

  // Atualizar selectedIndex quando parâmetros mudarem
  useEffect(() => {
    if (isClient) {
      const newIndex = getInitialTabIndex()
      setSelectedIndex(newIndex)
      // Marcar primeira aba como montada
      setMountedTabs(prev => new Set([...prev, items[newIndex]?.id]))
    }
  }, [getInitialTabIndex, items, isClient])

  // Handler para mudança de aba
  const handleTabChange = useCallback((index: number) => {
    const newTab = items[index]
    if (!newTab) return

    setSelectedIndex(index)
    
    // Marcar aba como montada para lazy loading
    setMountedTabs(prev => new Set([...prev, newTab.id]))
    
    // Sincronizar com URL
    if (urlSync && isClient) {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.set('tab', newTab.id)
      navigate(`?${newSearchParams.toString()}`, { replace: true })
    }
    
    // Callback customizado
    onTabChange?.(newTab.id)
  }, [items, urlSync, searchParams, navigate, onTabChange, isClient])

  // Memoizar itens válidos
  const validItems = useMemo(() => items.filter(item => item.id && item.label), [items])

  if (!validItems.length) {
    return null
  }

  return (
    <div className={cn('w-full', className)}>
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        <Tab.List 
          className={cn(
            'flex gap-1 overflow-x-auto rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-1 backdrop-blur supports-[backdrop-filter]:bg-primary/10',
            'scrollbar-hide scroll-smooth snap-x snap-mandatory',
            'border border-primary/10 shadow-sm',
            listClassName
          )}
        >
          {validItems.map((item) => (
            <Tab
              key={item.id}
              className={({ selected }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  'min-w-0 flex-shrink-0 snap-start whitespace-nowrap',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background',
                  selected
                    ? 'bg-white text-primary shadow-md shadow-primary/10 ring-1 ring-primary/20'
                    : 'text-primary/70 hover:bg-white/20 hover:text-primary active:scale-[0.98]'
                )
              }
            >
              {item.icon && (
                <span className="flex-shrink-0 w-4 h-4">
                  {item.icon}
                </span>
              )}
              
              <span className="truncate font-medium">
                {item.label}
              </span>
              
              {typeof item.count === 'number' && (
                <span className={cn(
                  'ml-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  'min-w-[1.5rem] h-5 bg-primary/15 text-primary border border-primary/20'
                )}>
                  {item.count}
                </span>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-4">
          {validItems.map((item, index) => (
            <Tab.Panel
              key={item.id}
              className={cn(
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-lg',
                panelClassName
              )}
            >
              {/* Lazy loading: só renderiza se não é lazy ou se já foi montada */}
              {!item.lazy || mountedTabs.has(item.id) ? (
                <div className="animate-in fade-in-0 duration-200">
                  {item.content}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm">Carregando...</span>
                </div>
              )}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default TabsRCorp