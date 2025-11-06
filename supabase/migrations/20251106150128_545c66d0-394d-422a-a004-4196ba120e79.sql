-- Corrigir função para ter search_path seguro
CREATE OR REPLACE FUNCTION update_user_cpf_vinculos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;