---
name: Fleet Change Requests Admin Code
description: Optional ADM#2026 admin bypass code on fleet change request form auto-approves the request to 'aprovado' status without admin intervention
type: feature
---
O formulário de Solicitação de Alteração de Frota (`FleetRequestModal`) tem um campo opcional "Código de liberação admin". Comportamento:

- Sem código → fluxo padrão: `status = 'aberto'`, webhook N8N é disparado, aguarda aprovação manual do admin via `FleetRequestApprovalActions`.
- Com código `ADM#2026` (constante `FLEET_ADMIN_BYPASS_CODE` em `src/types/fleet-requests.ts`) → `status = 'aprovado'` direto, webhook N8N **não** é disparado, payload recebe `auto_aprovado_via_codigo: true` e `auto_aprovado_em` (timestamp ISO).
- Com código incorreto → erro lançado, solicitação não é criada.

A validação acontece client-side em `useFleetRequests.submitRequest`. O bypass aplica a TODOS os tipos de solicitação (inclusão, exclusão, atualização, etc.). Mesmo padrão usado em `Fleet Status Approval Workflow` (mem://features/fleet-status-approval-workflow).
