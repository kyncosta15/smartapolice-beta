-- Corrigir o vínculo da empresa do usuário para normalizar o sistema
UPDATE users 
SET company = 'RCaldas' 
WHERE email = 'rcaldas@rcaldas.com.br' AND company = 'ESCAVE BAHIA ENGENHARIA E SANEAMENTO LTDA';