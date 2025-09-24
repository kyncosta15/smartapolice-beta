# Migração UI V2 - SmartApolice

## Overview
Migração incremental de acessibilidade usando Radix UI para overlays e React Aria para componentes de dados, mantendo o design atual sem regressões.

## Arquitetura

### Feature Flags
```typescript
// src/config/features.ts
FEATURE_FLAGS = {
  UI_V2: false,                    // Flag global (kill switch)
  UI_V2_FROTAS: false,            // Flag específica para Frotas
  UI_V2_SINISTROS: false,         // Flag específica para Sinistros  
  UI_V2_FORMS: false,             // Flag específica para Formulários
  UI_V2_TABLES: false,            // Flag específica para Tabelas
}
```

### Workspace UI
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── DialogRCorp.tsx      (Radix)
│   │   ├── DropdownRCorp.tsx    (Radix)
│   │   ├── PopoverRCorp.tsx     (Radix)
│   │   ├── TooltipRCorp.tsx     (Radix)
│   │   ├── TabsRCorp.tsx        (Radix)
│   │   ├── ComboboxRCorp.tsx    (React Aria)
│   │   ├── TableRCorp.tsx       (React Aria)
│   │   └── DatePickerRCorp.tsx  (React Aria)
│   ├── lib/utils.ts
│   └── index.ts
├── .storybook/
├── package.json
└── tsup.config.ts
```

## Fases de Implementação

### ✅ Fase 0 - Base & Auditoria (COMPLETA)
- [x] Dependências instaladas (Radix UI + React Aria)
- [x] Workspace packages/ui criado
- [x] Feature flags implementadas
- [x] Wrappers básicos criados
- [x] Storybook configurado

**Aceite**: Storybook compila, wrappers exportam assinatura mínima, nenhuma tela alterada.

### 🔄 Fase 1 - Overlays (Radix) - EM PROGRESSO
**Páginas alvo**:
- `/frotas` → dropdown "3 pontos" + modal detalhes  
- `/sinistros` → botão "Novo Ticket" → DialogRCorp

**Componentes**:
- [x] DialogRCorp
- [x] DropdownRCorp  
- [x] PopoverRCorp
- [x] TooltipRCorp
- [x] TabsRCorp

**Critérios**:
- Foco volta ao trigger
- ESC fecha modais
- aria-labelledby/aria-describedby corretos
- Lighthouse a11y ≥ 95

### ⏳ Fase 2 - Busca e Seleção (React Aria)
**Componentes**:
- [ ] ComboboxRCorp com virtualização
- [ ] Estados: loading, noResults, erro
- [ ] Data provider remoto (debounce 300ms)

**Páginas**:
- Novo Ticket → Combobox de veículo
- Search das tabelas (veículos/sinistros)

### ⏳ Fase 3 - Tabelas e DatePicker (React Aria)  
**Componentes**:
- [ ] TableRCorp (sorting acessível, paginação)
- [ ] DatePickerRCorp

**Páginas**:
- Lista de Sinistros → TableRCorp
- Lista de Veículos → TableRCorp
- Formulários → DatePickerRCorp

### ⏳ Fase 4 - Esteira/Timeline
**Funcionalidades**:
- TooltipRCorp para dicas em cada etapa
- Layout responsivo (estilo Nubank)
- Semântica: nav/ol com aria-current="step"

### ⏳ Fase 5 - Rollout & Limpeza
- Canário: 10% usuários internos
- Monitoramento logs/Sentry
- Remoção componentes antigos
- Documentação final

## Mapeamento de Componentes

### Overlays (Radix UI)
| Componente Atual | Novo Componente | Status | Páginas Impactadas |
|------------------|----------------|--------|-------------------|
| Dialog (shadcn) | DialogRCorp | ✅ | Modal detalhes veículo, Novo ticket |
| DropdownMenu | DropdownRCorp | ✅ | Menu "3 pontos" listas |
| Popover | PopoverRCorp | ✅ | Tooltips em gráficos |
| Tooltip | TooltipRCorp | ✅ | Dicas na esteira |
| Tabs | TabsRCorp | ✅ | Seções de formulários |

### Dados (React Aria)
| Componente Atual | Novo Componente | Status | Páginas Impactadas |
|------------------|----------------|--------|-------------------|
| ComboBox custom | ComboboxRCorp | 🔄 | Busca de veículos |
| Table custom | TableRCorp | ⏳ | Listas principais |
| DatePicker | DatePickerRCorp | ⏳ | Formulários |

## Testes & QA

### Storybook
- [ ] Histórias "happy path" para cada wrapper
- [ ] Addon a11y configurado
- [ ] Testes de keyboard navigation

### E2E (Cypress/Playwright)  
- [ ] Smoke: abrir modal novo ticket
- [ ] Smoke: dropdown 3 pontos funcional
- [ ] Smoke: combobox veículo seleciona item

### Visual Regression (Percy)
- [ ] Snapshots apenas componentes novos
- [ ] Comparação antes/depois por fase

## Critérios de Sucesso

### Técnicos
- [ ] 0 erros console
- [ ] 0 regressões navegação/teclado  
- [ ] Lighthouse A11y ≥ 95 nas páginas alteradas
- [ ] Métricas erro estáveis 48h após ativar

### UX
- [ ] Design consistente (gradientes/tipografia preservados)
- [ ] Tempo resposta ≤ atual
- [ ] Todos os fluxos críticos funcionais

## Rollback Plan
1. **Imediato**: `FEATURE_UI_V2=false` (kill switch global)
2. **Granular**: Desativar flags específicas por página
3. **Hotfix**: Reverter PR específico se necessário

## Próximos Passos
1. **Storybook stories** para componentes Fase 0
2. **Implementar Fase 1** em `/frotas` primeiro  
3. **QA completo** antes de ativar flags
4. **Documentar padrões** conforme evolução

---
**Última atualização**: 2025-09-24
**Status geral**: Fase 0 completa, Fase 1 em progresso