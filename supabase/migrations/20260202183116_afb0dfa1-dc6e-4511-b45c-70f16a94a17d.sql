UPDATE n8n_webhooks_config 
SET url = 'https://gruporcaldasofc.app.n8n.cloud/webhook/upload-planilha-oficial', 
    updated_at = now() 
WHERE id = 'planilha_frota';