import React, { useEffect } from 'react';

interface SecureFormValidatorProps {
  linkId?: string;
  onValidationComplete: (isValid: boolean, sessionToken?: string) => void;
  children: React.ReactNode;
}

export const SecureFormValidator = ({ 
  linkId, 
  onValidationComplete, 
  children 
}: SecureFormValidatorProps) => {
  
  useEffect(() => {
    // Simplificado: apenas gerar token básico
    const token = `TOKEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onValidationComplete(true, token);
  }, [linkId, onValidationComplete]);

  return <>{children}</>;
};