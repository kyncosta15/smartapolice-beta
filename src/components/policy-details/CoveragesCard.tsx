
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Coverage {
  id?: string;
  descricao: string;
  lmi?: number;
}

interface CoveragesCardProps {
  coverages: Coverage[] | string[];
  policyId: string;
  readOnly?: boolean;
}

export const CoveragesCard = ({ coverages: initialCoverages, policyId, readOnly = true }: CoveragesCardProps) => {
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar coberturas do banco de dados sempre que o componente for montado
  useEffect(() => {
    console.log('🔄 CoveragesCard montado - carregando dados do DB para policy:', policyId);
    loadCoveragesFromDB();
  }, [policyId]);

  const loadCoveragesFromDB = async () => {
    if (!policyId) {
      console.log('⚠️ PolicyId não fornecido, não é possível carregar coberturas');
      return;
    }

    try {
      console.log('🔍 Buscando coberturas no DB para policy:', policyId);
      
      const { data, error } = await supabase
        .from('coberturas')
        .select('*')
        .eq('policy_id', policyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao carregar coberturas:', error);
        throw error;
      }

      console.log('📚 Coberturas encontradas no DB:', data);

      if (data && data.length > 0) {
        // Usar dados do banco se existirem
        const dbCoverages = data.map(item => ({
          id: item.id,
          descricao: item.descricao || '',
          lmi: item.lmi || undefined
        }));
        
        console.log('✅ Usando coberturas do banco de dados:', dbCoverages);
        setCoverages(dbCoverages);
      } else {
        // Se não houver dados no banco, usar os dados iniciais se fornecidos
        console.log('📝 Nenhuma cobertura no DB, usando dados iniciais:', initialCoverages);
        const normalizedCoverages = (initialCoverages || []).map((coverage, index) => {
          if (typeof coverage === 'string') {
            return { id: `temp-${index}`, descricao: coverage };
          }
          return coverage;
        });
        setCoverages(normalizedCoverages);
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('❌ Erro ao carregar coberturas:', error);
      setIsLoaded(true);
    }
  };

  // Não renderizar até que os dados sejam carregados
  if (!isLoaded) {
    return (
      <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
        <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
          <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
            <Shield className="h-6 w-6 mr-3 text-blue-600" />
            Coberturas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-blue-300 mx-auto mb-3 animate-pulse" />
            <p className="text-blue-600 font-medium">Carregando coberturas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
          <Shield className="h-6 w-6 mr-3 text-blue-600" />
          Coberturas
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {coverages.length > 0 ? (
          <div className="space-y-3">
            {coverages.map((coverage) => (
              <div
                key={coverage.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-blue-100"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 font-sf-pro leading-relaxed">
                        {coverage.descricao}
                      </span>
                      {typeof coverage.lmi === 'number' && coverage.lmi > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">LMI:</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {formatCurrency(coverage.lmi)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-blue-300 mx-auto mb-3" />
            <p className="text-blue-600 font-medium">Coberturas não informadas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
