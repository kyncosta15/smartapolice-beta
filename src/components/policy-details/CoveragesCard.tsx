
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CoverageItem } from './coverages/CoverageItem';
import { AddCoverageForm } from './coverages/AddCoverageForm';
import { EmptyCoveragesState } from './coverages/EmptyCoveragesState';
import { LoadingState } from './coverages/LoadingState';
import { useCoveragesData } from './coverages/useCoveragesData';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCoverage, setNewCoverage] = useState<Coverage>({ descricao: '', lmi: 0 });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  console.log('🔍 CoveragesCard: Recebendo dados:', {
    initialCoveragesCount: Array.isArray(initialCoverages) ? initialCoverages.length : 0,
    initialCoveragesType: Array.isArray(initialCoverages) ? 'array' : typeof initialCoverages,
    policyId,
    readOnly
  });

  const {
    coverages,
    setCoverages,
    isLoaded,
    loadCoveragesFromDB,
    saveCoverage,
    deleteCoverage
  } = useCoveragesData(initialCoverages, policyId);

  console.log('📊 CoveragesCard: Estado atual das coberturas:', {
    coverageCount: coverages.length,
    isLoaded,
    sampleCoverage: coverages.length > 0 ? {
      id: coverages[0].id,
      descricao: typeof coverages[0].descricao === 'string' ? coverages[0].descricao : 'objeto complexo',
      lmi: coverages[0].lmi
    } : null
  });

  if (!isLoaded) {
    return <LoadingState />;
  }

  const handleEdit = (coverage: Coverage) => {
    setEditingId(coverage.id || null);
  };

  const handleSave = async (coverage: Coverage) => {
    await saveCoverage(coverage);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    loadCoveragesFromDB();
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
    
    // Adicionar ao estado local primeiro
    setCoverages(prev => [...prev, coverageToAdd]);
    
    // Salvar no banco de dados
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

  const updateNewCoverage = (field: keyof Coverage, value: string | number) => {
    setNewCoverage(prev => ({ ...prev, [field]: value }));
  };

  // Verificar se temos coberturas para exibir
  const hasCoverages = coverages && coverages.length > 0;

  console.log('🎯 CoveragesCard: Renderizando com:', {
    hasCoverages,
    coveragesCount: coverages.length,
    isAddingNew,
    shouldShowContent: hasCoverages || isAddingNew
  });

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
        {hasCoverages || isAddingNew ? (
          <div className="space-y-3">
            {hasCoverages && coverages.map((coverage) => (
              <CoverageItem
                key={coverage.id}
                coverage={coverage}
                isEditing={editingId === coverage.id}
                readOnly={readOnly}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={deleteCoverage}
                onUpdate={updateCoverage}
              />
            ))}

            {isAddingNew && (
              <AddCoverageForm
                newCoverage={newCoverage}
                onSave={handleSaveNew}
                onCancel={handleCancelNew}
                onUpdate={updateNewCoverage}
              />
            )}
          </div>
        ) : (
          <EmptyCoveragesState readOnly={readOnly} onAddNew={handleAddNew} />
        )}
      </CardContent>
    </Card>
  );
};
