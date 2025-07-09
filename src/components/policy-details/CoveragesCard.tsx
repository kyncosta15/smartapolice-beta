
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const CoveragesCard = ({ coverages: initialCoverages, policyId, readOnly = false }: CoveragesCardProps) => {
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCoverage, setNewCoverage] = useState<Coverage>({ descricao: '', lmi: 0 });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

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

  const saveCoverage = async (coverage: Coverage) => {
    try {
      console.log('💾 Salvando cobertura:', coverage);
      
      if (coverage.id && !coverage.id.startsWith('temp-')) {
        // Atualizar cobertura existente
        const { error } = await supabase
          .from('coberturas')
          .update({
            descricao: coverage.descricao,
            lmi: coverage.lmi
          })
          .eq('id', coverage.id);

        if (error) throw error;
        console.log('✅ Cobertura atualizada com sucesso');
      } else {
        // Inserir nova cobertura
        const { data, error } = await supabase
          .from('coberturas')
          .insert({
            policy_id: policyId,
            descricao: coverage.descricao,
            lmi: coverage.lmi
          })
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Nova cobertura inserida:', data);
        
        // Atualizar o estado local com o ID real
        setCoverages(prev => prev.map(c => 
          c.id === coverage.id ? { ...coverage, id: data.id } : c
        ));
      }

      toast({
        title: "✅ Cobertura Salva",
        description: "As informações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao salvar cobertura:', error);
      toast({
        title: "❌ Erro ao Salvar",
        description: "Não foi possível salvar a cobertura",
        variant: "destructive",
      });
    }
  };

  const deleteCoverage = async (coverageId: string) => {
    try {
      console.log('🗑️ Deletando cobertura:', coverageId);
      
      if (!coverageId.startsWith('temp-')) {
        const { error } = await supabase
          .from('coberturas')
          .delete()
          .eq('id', coverageId);

        if (error) throw error;
      }

      setCoverages(prev => prev.filter(c => c.id !== coverageId));
      
      toast({
        title: "✅ Cobertura Removida",
        description: "A cobertura foi removida com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao deletar cobertura:', error);
      toast({
        title: "❌ Erro ao Remover",
        description: "Não foi possível remover a cobertura",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (coverage: Coverage) => {
    setEditingId(coverage.id || null);
  };

  const handleSave = async (coverage: Coverage) => {
    await saveCoverage(coverage);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    loadCoveragesFromDB(); // Recarregar dados originais
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewCoverage({ descricao: '', lmi: 0 });
  };

  const handleSaveNew = async () => {
    if (!newCoverage.descricao.trim()) {
      toast({
        title: "⚠️ Campo Obrigatório",
        description: "A descrição da cobertura é obrigatória",
        variant: "destructive",
      });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const coverageToAdd = { ...newCoverage, id: tempId };
    
    setCoverages(prev => [...prev, coverageToAdd]);
    await saveCoverage(coverageToAdd);
    
    setIsAddingNew(false);
    setNewCoverage({ descricao: '', lmi: 0 });
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewCoverage({ descricao: '', lmi: 0 });
  };

  const updateCoverage = (id: string, field: keyof Coverage, value: string | number) => {
    setCoverages(prev => prev.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
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
        <CardTitle className="flex items-center justify-between text-xl font-bold text-blue-900 font-sf-pro">
          <div className="flex items-center">
            <Shield className="h-6 w-6 mr-3 text-blue-600" />
            Coberturas
          </div>
          {!readOnly && (
            <Button
              onClick={handleAddNew}
              size="sm"
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {coverages.length > 0 || isAddingNew ? (
          <div className="space-y-3">
            {coverages.map((coverage) => (
              <div
                key={coverage.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-blue-100"
              >
                {editingId === coverage.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <Input
                        value={coverage.descricao}
                        onChange={(e) => updateCoverage(coverage.id!, 'descricao', e.target.value)}
                        placeholder="Descrição da cobertura"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-3 ml-8">
                      <span className="text-sm text-gray-600 min-w-0">LMI:</span>
                      <Input
                        type="number"
                        value={coverage.lmi || ''}
                        onChange={(e) => updateCoverage(coverage.id!, 'lmi', parseFloat(e.target.value) || 0)}
                        placeholder="Valor do LMI"
                        className="w-32"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(coverage)}
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={handleCancel}
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-x-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800 font-sf-pro leading-relaxed">
                          {coverage.descricao}
                        </span>
                        {typeof coverage.lmi === 'number' && coverage.lmi > 0 && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            LMI: {formatCurrency(coverage.lmi)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEdit(coverage)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteCoverage(coverage.id!)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isAddingNew && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200 border-dashed">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <Input
                      value={newCoverage.descricao}
                      onChange={(e) => setNewCoverage(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição da nova cobertura"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-3 ml-8">
                    <span className="text-sm text-gray-600 min-w-0">LMI:</span>
                    <Input
                      type="number"
                      value={newCoverage.lmi || ''}
                      onChange={(e) => setNewCoverage(prev => ({ ...prev, lmi: parseFloat(e.target.value) || 0 }))}
                      placeholder="Valor do LMI"
                      className="w-32"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveNew}
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleCancelNew}
                        size="sm"
                        variant="outline"
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-blue-300 mx-auto mb-3" />
            <p className="text-blue-600 font-medium">Coberturas não informadas</p>
            {!readOnly && (
              <Button
                onClick={handleAddNew}
                size="sm"
                variant="outline"
                className="mt-3 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Primeira Cobertura
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
