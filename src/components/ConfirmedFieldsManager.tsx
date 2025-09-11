import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, CheckCircle, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConfirmedField {
  id: string;
  field_name: string;
  field_value: string;
  confirmed_at: string;
  confirmed_by: string;
}

interface ConfirmedFieldsManagerProps {
  policyId: string;
  currentData: Record<string, any>;
  onFieldConfirmationChange?: (fieldName: string, isConfirmed: boolean) => void;
}

/**
 * GERENCIADOR DE CAMPOS CONFIRMADOS
 * 
 * Permite ao usuário:
 * - Ver quais campos estão confirmados (protegidos contra alteração automática)
 * - Confirmar campos importantes para protegê-los
 * - Desconfirmar campos se necessário
 * - Ver histórico de confirmações
 */
export function ConfirmedFieldsManager({ 
  policyId, 
  currentData, 
  onFieldConfirmationChange 
}: ConfirmedFieldsManagerProps) {
  const [confirmedFields, setConfirmedFields] = useState<ConfirmedField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Campos que podem ser confirmados
  const confirmableFields = [
    { key: 'seguradora', label: 'Seguradora', critical: true },
    { key: 'numero_apolice', label: 'Número da Apólice', critical: true },
    { key: 'segurado', label: 'Segurado', critical: true },
    { key: 'valor_premio', label: 'Prêmio Anual', critical: true },
    { key: 'placa', label: 'Placa do Veículo', critical: true },
    { key: 'modelo_veiculo', label: 'Modelo do Veículo', critical: false },
    { key: 'franquia', label: 'Franquia', critical: false },
    { key: 'inicio_vigencia', label: 'Início da Vigência', critical: false },
    { key: 'fim_vigencia', label: 'Fim da Vigência', critical: false },
  ];

  useEffect(() => {
    loadConfirmedFields();
  }, [policyId]);

  const loadConfirmedFields = async () => {
    if (!policyId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('policy_confirmed_fields')
        .select('*')
        .eq('policy_id', policyId);

      if (error) throw error;

      setConfirmedFields(data || []);
    } catch (error) {
      console.error('Erro ao carregar campos confirmados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os campos confirmados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmField = async (fieldName: string, fieldValue: any) => {
    if (!fieldValue || fieldValue === '') {
      toast({
        title: "Aviso",
        description: "Não é possível confirmar um campo vazio",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('policy_confirmed_fields')
        .insert({
          policy_id: policyId,
          field_name: fieldName,
          field_value: String(fieldValue)
        });

      if (error) throw error;

      toast({
        title: "Campo Confirmado",
        description: `O campo ${getFieldLabel(fieldName)} foi confirmado e não será alterado automaticamente`,
      });

      await loadConfirmedFields();
      onFieldConfirmationChange?.(fieldName, true);

    } catch (error: any) {
      console.error('Erro ao confirmar campo:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: "Campo já confirmado",
          description: `O campo ${getFieldLabel(fieldName)} já está confirmado`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível confirmar o campo",
          variant: "destructive",
        });
      }
    }
  };

  const unconfirmField = async (fieldName: string) => {
    try {
      const { error } = await supabase
        .from('policy_confirmed_fields')
        .delete()
        .eq('policy_id', policyId)
        .eq('field_name', fieldName);

      if (error) throw error;

      toast({
        title: "Campo Desconfirmado",
        description: `O campo ${getFieldLabel(fieldName)} pode ser alterado automaticamente novamente`,
      });

      await loadConfirmedFields();
      onFieldConfirmationChange?.(fieldName, false);

    } catch (error) {
      console.error('Erro ao desconfirmar campo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconfirmar o campo",
        variant: "destructive",
      });
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    return confirmableFields.find(f => f.key === fieldName)?.label || fieldName;
  };

  const isFieldConfirmed = (fieldName: string): boolean => {
    return confirmedFields.some(f => f.field_name === fieldName);
  };

  const getFieldValue = (fieldName: string): any => {
    return currentData[fieldName];
  };

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'Não informado';
    if (typeof value === 'number') return value.toLocaleString('pt-BR');
    return String(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Campos Confirmados
        </CardTitle>
        <CardDescription>
          Campos confirmados são protegidos contra alterações automáticas. 
          Confirme campos importantes para evitar que sejam sobrescritos.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Campos Críticos */}
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Campos Críticos
          </h4>
          
          <div className="grid gap-3">
            {confirmableFields
              .filter(field => field.critical)
              .map(field => {
                const isConfirmed = isFieldConfirmed(field.key);
                const currentValue = getFieldValue(field.key);

                return (
                  <div 
                    key={field.key} 
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      isConfirmed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{field.label}</span>
                        {isConfirmed && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Confirmado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatFieldValue(currentValue)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unconfirmField(field.key)}
                          disabled={isLoading}
                        >
                          <Unlock className="h-4 w-4 mr-1" />
                          Desconfirmar
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => confirmField(field.key, currentValue)}
                          disabled={isLoading || !currentValue}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <Separator />

        {/* Outros Campos */}
        <div>
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">
            Outros Campos
          </h4>
          
          <div className="grid gap-2">
            {confirmableFields
              .filter(field => !field.critical)
              .map(field => {
                const isConfirmed = isFieldConfirmed(field.key);
                const currentValue = getFieldValue(field.key);

                return (
                  <div 
                    key={field.key} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isConfirmed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                      
                      <div>
                        <span className="text-sm font-medium">{field.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatFieldValue(currentValue)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => 
                        isConfirmed 
                          ? unconfirmField(field.key) 
                          : confirmField(field.key, currentValue)
                      }
                      disabled={isLoading || (!isConfirmed && !currentValue)}
                    >
                      {isConfirmed ? (
                        <>
                          <Unlock className="h-3 w-3 mr-1" />
                          Desconfirmar
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Resumo */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>{confirmedFields.length}</strong> campos confirmados de <strong>{confirmableFields.length}</strong> disponíveis
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Campos confirmados são preservados mesmo quando novos dados são extraídos dos PDFs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}