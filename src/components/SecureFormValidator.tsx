import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

interface SecurityCheck {
  id: string;
  description: string;
  status: 'checking' | 'passed' | 'failed' | 'warning';
  details?: string;
}

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
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([
    {
      id: 'rate_limit',
      description: 'Verificação de limite de submissões',
      status: 'checking'
    },
    {
      id: 'link_validation',
      description: 'Validação do link de acesso',
      status: 'checking'
    },
    {
      id: 'session_token',
      description: 'Geração de token de segurança',
      status: 'checking'
    },
    {
      id: 'browser_validation',
      description: 'Validação do navegador',
      status: 'checking'
    }
  ]);
  
  const [isValidated, setIsValidated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    performSecurityValidation();
  }, [linkId]);

  const performSecurityValidation = async () => {
    const updatedChecks = [...securityChecks];

    try {
      // 1. Rate Limiting Check
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');

      const { data: recentSubmissions, error: rateError } = await supabase
        .from('submission_rate_limits')
        .select('*')
        .eq('ip_address', ipAddress)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (rateError) {
        updatedChecks[0] = { ...updatedChecks[0], status: 'warning', details: 'Não foi possível verificar rate limit' };
      } else if (recentSubmissions && recentSubmissions.length >= 5) {
        updatedChecks[0] = { ...updatedChecks[0], status: 'failed', details: 'Muitas tentativas. Tente novamente em 1 hora.' };
        setSecurityChecks(updatedChecks);
        onValidationComplete(false);
        return;
      } else {
        updatedChecks[0] = { ...updatedChecks[0], status: 'passed' };
      }

      // 2. Link Validation
      if (linkId) {
        const { data: linkData, error: linkError } = await supabase
          .from('colaborador_links')
          .select('*')
          .eq('id', linkId)
          .single();

        if (linkError || !linkData) {
          updatedChecks[1] = { ...updatedChecks[1], status: 'failed', details: 'Link inválido ou expirado' };
          setSecurityChecks(updatedChecks);
          onValidationComplete(false);
          return;
        }

        if (!linkData.ativo) {
          updatedChecks[1] = { ...updatedChecks[1], status: 'failed', details: 'Link foi desativado' };
          setSecurityChecks(updatedChecks);
          onValidationComplete(false);
          return;
        }

        if (linkData.expira_em && new Date(linkData.expira_em) < new Date()) {
          updatedChecks[1] = { ...updatedChecks[1], status: 'failed', details: 'Link expirado' };
          setSecurityChecks(updatedChecks);
          onValidationComplete(false);
          return;
        }

        updatedChecks[1] = { ...updatedChecks[1], status: 'passed' };
      } else {
        updatedChecks[1] = { ...updatedChecks[1], status: 'passed' };
      }

      // 3. Session Token Generation
      try {
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('public-start', {
          body: {
            employee_id: linkId,
            ip_address: ipAddress,
            user_agent: navigator.userAgent
          }
        });

        if (tokenError) throw tokenError;

        setSessionToken(tokenData.token);
        updatedChecks[2] = { ...updatedChecks[2], status: 'passed' };
      } catch (error) {
        updatedChecks[2] = { ...updatedChecks[2], status: 'failed', details: 'Erro ao gerar token de segurança' };
        setSecurityChecks(updatedChecks);
        onValidationComplete(false);
        return;
      }

      // 4. Browser Validation
      const userAgent = navigator.userAgent;
      const isValidBrowser = userAgent && 
        !userAgent.includes('bot') && 
        !userAgent.includes('crawler') && 
        window.navigator.cookieEnabled;

      if (!isValidBrowser) {
        updatedChecks[3] = { ...updatedChecks[3], status: 'warning', details: 'Navegador com configurações restritivas' };
      } else {
        updatedChecks[3] = { ...updatedChecks[3], status: 'passed' };
      }

      setSecurityChecks(updatedChecks);
      
      // All critical checks passed
      const hasCriticalFailures = updatedChecks.some(check => check.status === 'failed');
      if (!hasCriticalFailures) {
        setIsValidated(true);
        onValidationComplete(true, sessionToken);
      } else {
        onValidationComplete(false);
      }

    } catch (error) {
      console.error('Erro na validação de segurança:', error);
      setSecurityChecks(updatedChecks.map(check => ({ 
        ...check, 
        status: 'failed' as const, 
        details: 'Erro interno de validação' 
      })));
      onValidationComplete(false);
    }
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'checking':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'checking':
        return 'text-blue-600';
      case 'passed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
    }
  };

  if (!isValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Verificação de Segurança</h2>
                <p className="text-sm text-muted-foreground">
                  Validando acesso ao formulário...
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {securityChecks.map((check) => (
                <div key={check.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                      {check.description}
                    </p>
                    {check.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {check.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Sistema de Segurança Ativo</p>
                  <p className="text-blue-700 mt-1">
                    Este formulário possui validações de segurança para proteger seus dados
                    contra spam e acessos não autorizados.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};