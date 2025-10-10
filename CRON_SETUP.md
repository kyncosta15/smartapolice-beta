# Configuração do Cron Job para Envio Automático de Relatórios

Este documento explica como configurar o agendamento automático de envio de relatórios via pg_cron no Supabase.

## Pré-requisitos

1. ✅ Secret `RESEND_API_KEY` configurado no Supabase
2. ✅ Edge function `send-scheduled-reports` implantada
3. ✅ Tabelas `report_schedules` e `report_sends` criadas
4. ✅ Conta Resend com domínio verificado

## Configuração do Cron Job

### 1. Habilitar Extensões

Execute no SQL Editor do Supabase:

```sql
-- Habilitar pg_cron para agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Habilitar pg_net para fazer HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Criar Cron Job

O cron job irá executar **diariamente às 09:00** (horário do servidor) para verificar e enviar relatórios:

```sql
-- Agendar execução diária às 09:00
SELECT cron.schedule(
  'send-daily-reports',           -- Nome do job
  '0 9 * * *',                    -- Cron expression (09:00 todos os dias)
  $$
  SELECT net.http_post(
    url := 'https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/send-scheduled-reports',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SEU_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**IMPORTANTE:** Substitua `SEU_SERVICE_ROLE_KEY` pela service role key do seu projeto Supabase (encontrada em Settings > API).

### 3. Verificar Cron Jobs Ativos

```sql
-- Listar todos os cron jobs
SELECT * FROM cron.job;
```

### 4. Desabilitar/Remover Cron Job (se necessário)

```sql
-- Desabilitar temporariamente
SELECT cron.unschedule('send-daily-reports');

-- Ou remover permanentemente
SELECT cron.unschedule('send-daily-reports');
```

## Cron Expressions Comuns

Ajuste a frequência conforme necessário:

```bash
# A cada hora
'0 * * * *'

# Diariamente às 09:00
'0 9 * * *'

# Todo dia 1º do mês às 09:00
'0 9 1 * *'

# Segunda a Sexta às 09:00
'0 9 * * 1-5'

# A cada 6 horas
'0 */6 * * *'
```

## Como Funciona

1. **Agendamento no Sistema**: Admin cadastra relatórios em `/admin/email-settings`
2. **Cron Job Diário**: Roda às 09:00 e chama a edge function
3. **Edge Function**: 
   - Busca agendamentos com `proximo_envio <= hoje`
   - Coleta dados da empresa (veículos, apólices, sinistros)
   - Gera HTML do relatório
   - Envia via Resend
   - Registra no log (`report_sends`)
   - Atualiza `proximo_envio` baseado na frequência

## Testando o Sistema

### Teste Manual (sem esperar o cron)

No terminal do Lovable ou via SQL:

```javascript
// Chamar diretamente a edge function
const { data, error } = await supabase.functions.invoke('send-scheduled-reports');
console.log('Resultado:', data);
```

Ou use o botão "Testar Envio" na interface de `/admin/email-settings`.

### Verificar Logs

```sql
-- Ver últimos 10 envios
SELECT 
  rs.*,
  e.nome as empresa_nome,
  rsch.frequencia_dias
FROM report_sends rs
JOIN empresas e ON rs.empresa_id = e.id
JOIN report_schedules rsch ON rs.schedule_id = rsch.id
ORDER BY rs.sent_at DESC
LIMIT 10;

-- Ver agendamentos pendentes
SELECT 
  rs.*,
  e.nome as empresa_nome
FROM report_schedules rs
JOIN empresas e ON rs.empresa_id = e.id
WHERE rs.ativo = true
  AND (rs.proximo_envio IS NULL OR rs.proximo_envio <= NOW())
ORDER BY rs.created_at DESC;
```

## Troubleshooting

### Cron não está executando

1. Verifique se as extensões estão habilitadas:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

2. Verifique se o job está ativo:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-daily-reports';
```

3. Verifique logs do cron:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-reports')
ORDER BY start_time DESC 
LIMIT 10;
```

### Emails não estão sendo enviados

1. Verifique o secret RESEND_API_KEY no Supabase
2. Verifique se o domínio está verificado no Resend
3. Cheque os logs na tabela `report_sends`:
```sql
SELECT * FROM report_sends 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

4. Verifique logs da edge function no Supabase Dashboard

### Relatórios duplicados

Se houver envios duplicados, verifique se não há múltiplos cron jobs:
```sql
SELECT * FROM cron.job WHERE jobname LIKE '%report%';
```

## Acesso à Interface de Gerenciamento

- **URL**: `/admin/email-settings`
- **Acesso**: Apenas `admin@rcaldas.com.br`
- **Funcionalidades**:
  - Criar agendamentos (por empresa)
  - Configurar frequência (30 ou 60 dias)
  - Definir dia do mês para envio
  - Ver histórico de envios
  - Testar envio manual
  - Ativar/desativar agendamentos

## Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Service role key protegida (não exposta no frontend)
- ✅ Validação de email do admin
- ✅ Logs de auditoria em `report_sends`
- ✅ Policies específicas por role

## Manutenção

### Limpar logs antigos (opcional)

Execute mensalmente para manter a tabela limpa:

```sql
-- Deletar logs com mais de 90 dias
DELETE FROM report_sends 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Links Úteis

- [Documentação pg_cron](https://github.com/citusdata/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)
- [Crontab.guru - Testar expressões cron](https://crontab.guru/)
