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
            'flex gap-1 overflow-x-auto rounded-xl bg-gradient-to-r from-primary/8 to-primary/4 p-1',
            'scrollbar-hide scroll-smooth snap-x snap-mandatory border border-primary/15 shadow-sm',
            'bg-white/40 backdrop-blur-sm supports-[backdrop-filter]:bg-white/40',
            listClassName
          )}
        >
          {validItems.map((item) => (
            <Tab
              key={item.id}
              className={({ selected }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200',
                  'min-w-0 flex-shrink-0 snap-start whitespace-nowrap',
                  'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1',
                  'md:px-3 md:py-2.5', // Maior padding em desktop
                  selected
                    ? 'bg-white text-primary shadow-md shadow-primary/20 ring-1 ring-primary/30 font-semibold'
                    : 'text-primary/75 hover:bg-white/60 hover:text-primary hover:shadow-sm active:scale-[0.98]'
                )
              }
            >
              {item.icon && (
                <span className="flex-shrink-0 w-4 h-4">
                  {item.icon}
                </span>
              )}
              
              <span className="truncate font-medium text-xs md:text-sm">
                {item.label}
              </span>
              
              {typeof item.count === 'number' && (
                <span className={cn(
                  'ml-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  'min-w-[1.25rem] h-4 md:min-w-[1.5rem] md:h-5 md:px-2 md:text-[11px]',
                  'bg-primary/20 text-primary border border-primary/30 shadow-sm'
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
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm">Carregando conteúdo...</p>
                  </div>
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