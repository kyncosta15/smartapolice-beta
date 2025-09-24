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
        {/* Container com indicadores de scroll */}
        <div className="relative">
          {/* Indicador de scroll esquerdo */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none md:hidden" />
          
          {/* Indicador de scroll direito */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none md:hidden" />
          
          <Tab.List 
            className={cn(
              'flex overflow-x-auto rounded-2xl bg-gradient-to-r from-primary/8 to-primary/4 p-1.5',
              'scrollbar-hide scroll-smooth snap-x snap-mandatory border border-primary/15 shadow-lg',
              'bg-white/50 backdrop-blur-md supports-[backdrop-filter]:bg-white/50',
              // Mobile otimizado
              'gap-1 px-2', 
              // Desktop
              'md:gap-2 md:p-2 md:px-2 md:rounded-xl',
              listClassName
            )}
          >
            {validItems.map((item, itemIndex) => (
              <Tab
                key={item.id}
                className={({ selected }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-xl font-medium transition-all duration-300',
                    'min-w-0 flex-shrink-0 snap-start whitespace-nowrap relative',
                    'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1',
                    // Mobile-first: mais compact
                    'px-2.5 py-2.5 text-xs min-h-[44px] min-w-fit',
                    // Desktop: mais espaçoso  
                    'md:px-4 md:py-3 md:text-sm md:min-h-[48px] md:gap-2',
                    selected
                      ? 'bg-white text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30 font-bold scale-[1.02] z-10'
                      : 'text-primary/80 hover:bg-white/70 hover:text-primary hover:shadow-md hover:scale-[1.01] active:scale-[0.99]',
                    // Melhor feedback visual
                    'transform-gpu will-change-transform'
                  )
                }
              >
                {/* Indicador de aba ativa */}
                {selectedIndex === itemIndex && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-full md:w-8" />
                )}
                
                {item.icon && (
                  <span className="flex-shrink-0 w-4 h-4">
                    {item.icon}
                  </span>
                )}
                
                <span className="truncate font-semibold max-w-[60px] md:max-w-none">
                  {item.label}
                </span>
                
                {typeof item.count === 'number' && (
                  <span className={cn(
                    'ml-0.5 inline-flex items-center justify-center rounded-full font-bold flex-shrink-0',
                    'min-w-[1.25rem] h-5 px-1.5 text-[9px]', // Mobile mais compacto
                    'md:min-w-[1.5rem] md:h-6 md:px-2 md:text-[10px] md:ml-1', // Desktop
                    'bg-primary/25 text-primary border border-primary/40 shadow-sm'
                  )}>
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </Tab>
            ))}
            
            {/* Espaçamento extra no final para melhor scroll */}
            <div className="w-4 flex-shrink-0 md:hidden" />
          </Tab.List>
          
          {/* Indicador de posição do scroll */}
          <div className="flex justify-center mt-2 space-x-1 md:hidden">
            {validItems.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all duration-200',
                  selectedIndex === index 
                    ? 'bg-primary w-4' 
                    : 'bg-primary/30'
                )}
              />
            ))}
          </div>
        </div>

        <Tab.Panels className="mt-6">
          {validItems.map((item, index) => (
            <Tab.Panel
              key={item.id}
              className={cn(
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-xl',
                panelClassName
              )}
            >
              {/* Lazy loading com animação melhorada */}
              {!item.lazy || mountedTabs.has(item.id) ? (
                <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                  {item.content}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary"></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-primary/20"></div>
                  </div>
                  <div className="mt-4 text-center space-y-2">
                    <p className="text-sm font-medium">Carregando {item.label}</p>
                    <p className="text-xs text-muted-foreground/70">Aguarde um momento...</p>
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