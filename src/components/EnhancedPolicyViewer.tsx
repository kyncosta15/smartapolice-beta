import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, Edit, Trash2, Search, Filter, Download, TrendingUp, AlertTriangle, Car, Heart, Activity, Home, Building2, ShieldAlert, Ship, Shield, Anchor } from 'lucide-react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';
import { PolicyEditModal } from './PolicyEditModal';
import { renderValueAsString } from '@/utils/renderValue';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPolicyViewerProps {
  policies: ParsedPolicyData[];
  onPolicySelect: (policy: ParsedPolicyData) => void;
  onPolicyEdit: (policy: ParsedPolicyData) => void;
  onPolicyDelete: (policyId: string) => void;
  onPolicyDownload?: (policyId: string, policyName: string) => void;
  viewMode?: 'client' | 'admin';
}

export function EnhancedPolicyViewer({ 
  policies, 
  onPolicySelect, 
  onPolicyEdit, 
  onPolicyDelete,
  onPolicyDownload,
  viewMode = 'client'
}: EnhancedPolicyViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterInsurer, setFilterInsurer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClaimRate, setFilterClaimRate] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ParsedPolicyData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { filteredPolicies, optimizationData } = useMemo(() => {
    let filtered = policies.filter(policy => {
      const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           policy.insurer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || policy.type === filterType;
      const matchesInsurer = filterInsurer === 'all' || policy.insurer === filterInsurer;
      const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;
      
      let matchesClaimRate = true;
      if (filterClaimRate !== 'all' && policy.claimRate) {
        switch (filterClaimRate) {
          case 'low':
            matchesClaimRate = policy.claimRate < 5;
            break;
          case 'medium':
            matchesClaimRate = policy.claimRate >= 5 && policy.claimRate <= 15;
            break;
          case 'high':
            matchesClaimRate = policy.claimRate > 15;
            break;
        }
      }
      
      return matchesSearch && matchesType && matchesInsurer && matchesStatus && matchesClaimRate;
    });

    // Gerar dados de otimização
    const optimization = generateOptimizationData(filtered);

    return { filteredPolicies: filtered, optimizationData: optimization };
  }, [policies, searchTerm, filterType, filterInsurer, filterStatus, filterClaimRate]);

  const uniqueInsurers = [...new Set(policies.map(p => p.insurer))];

  const handleDownload = async (policy: ParsedPolicyData) => {
    // Helper function para usar Web Share API (iOS/Safari nativo)
    const shareOrDownload = async (blob: Blob, filename: string) => {
      // Criar blob com MIME type explícito para PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      
      // Verificar se Web Share API está disponível e suporta files (iOS)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });
          
          // Verificar se pode compartilhar arquivos
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: policy.name || 'Apólice',
              text: `Apólice ${policy.policyNumber || ''}`,
              files: [file]
            });
            
            toast({
              title: "✅ Download iniciado",
              description: "O arquivo foi salvo com sucesso!",
            });
            
            console.log('✅ Compartilhado via Web Share API (iOS)');
            return true;
          }
        } catch (shareError) {
          // Usuário cancelou ou erro - continuar com método fallback
          console.log('⚠️ Web Share cancelado ou não disponível:', shareError);
        }
      }
      
      // Fallback: método tradicional de download
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      link.target = '_self';
      
      // Adicionar temporariamente ao DOM
      document.body.appendChild(link);
      
      // Trigger click imediato (importante para iOS)
      link.click();
      
      // Cleanup após delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      return false;
    };

    if (policy.file) {
      // Para arquivos locais (recém extraídos)
      await shareOrDownload(policy.file, `${policy.name}.pdf`);
    } else if (policy.pdfPath && policy.pdfPath !== 'Não informado' && policy.pdfPath.trim() !== '') {
      // Para apólices persistidas com pdfPath válido - usar múltiplas estratégias
      console.log('🔄 Iniciando download para apólice persistida:', policy.pdfPath);
      
      try {
        // Estratégia 1: Download direto via storage.download()
        console.log('📥 Tentativa 1: Download direto via storage');
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from('pdfs')
          .download(policy.pdfPath);
          
        if (downloadError) {
          console.warn('⚠️ Download direto falhou:', downloadError);
          throw downloadError;
        }
        
        if (fileBlob) {
          console.log('✅ Arquivo obtido via download direto');
          await shareOrDownload(fileBlob, `${policy.name || 'apolice'}.pdf`);
          console.log('✅ Download concluído com sucesso (método direto)');
          return;
        }
      } catch (directError) {
        console.warn('⚠️ Falha no download direto:', directError);
      }
      
      try {
        // Estratégia 2: Edge Function proxy
        console.log('📥 Tentativa 2: Download via Edge Function proxy');
        
        const response = await fetch(`https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/download-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pdfPath: policy.pdfPath })
        });
        
        if (!response.ok) {
          throw new Error(`Edge Function error: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('✅ Arquivo obtido via Edge Function proxy');
        await shareOrDownload(blob, `${policy.name || 'apolice'}.pdf`);
        console.log('✅ Download concluído via proxy');
        return;
        
      } catch (proxyError) {
        console.warn('⚠️ Falha no proxy:', proxyError);
      }
      
      try {
        // Estratégia 3: URL assinada + fetch para forçar download em mobile
        console.log('📥 Tentativa 3: URL assinada com download forçado');
        const { PolicyPersistenceService } = await import('@/services/policyPersistenceService');
        const downloadUrl = await PolicyPersistenceService.getPDFDownloadUrl(policy.pdfPath);
        
        if (downloadUrl) {
          // Fetch o arquivo e forçar download
          const response = await fetch(downloadUrl);
          const blob = await response.blob();
          
          await shareOrDownload(blob, `${policy.name || 'apolice'}.pdf`);
          console.log('✅ Download concluído via URL assinada');
          return;
        }
      } catch (urlError) {
        console.error('❌ Falha ao gerar URL:', urlError);
      }
      
      // Se todas as estratégias falharam
      console.error('❌ Todas as estratégias de download falharam');
      toast({
        title: "❌ Erro no download",
        description: "Não foi possível fazer o download do arquivo. Tente novamente.",
        variant: "destructive",
      });
      
    } else if (policy.nosnum && policy.codfil) {
      // Fallback: Tentar baixar da API CorpNuvem usando nosnum e codfil
      console.log('📥 Tentando baixar da API CorpNuvem:', { 
        nosnum: policy.nosnum, 
        codfil: policy.codfil 
      });
      
      try {
        const { getDocumentoAnexos, downloadDocumentoAnexo } = await import('@/services/corpnuvem/anexos');
        
        toast({
          title: "Baixando apólice",
          description: "Por favor, aguarde...",
        });
        
        const response = await getDocumentoAnexos({
          codfil: policy.codfil,
          nosnum: policy.nosnum
        });
        
        if (response?.anexos && response.anexos.length > 0) {
          // Buscar o primeiro PDF disponível
          const pdfAnexo = response.anexos.find(anexo => 
            anexo.tipo?.toLowerCase().includes('pdf')
          );
          
          console.log('📄 PDF encontrado na API:', pdfAnexo);
          
          if (pdfAnexo) {
            await downloadDocumentoAnexo(
              pdfAnexo.url, 
              `${policy.name}.pdf`
            );
            
            toast({
              title: "Download concluído",
              description: "Apólice baixada com sucesso",
            });
            return;
          } else {
            throw new Error('Nenhum PDF encontrado nos anexos');
          }
        } else {
          throw new Error('Nenhum anexo encontrado');
        }
      } catch (error) {
        console.error('❌ Erro ao baixar da API CorpNuvem:', error);
        toast({
          title: "❌ Erro no download",
          description: "Não foi possível baixar a apólice da API.",
          variant: "destructive",
        });
      }
    } else {
      console.warn('Arquivo não disponível para download:', policy.name);
      toast({
        title: "⚠️ Arquivo não disponível",
        description: "O arquivo não está disponível para download. Entre em contato com o suporte.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (policy: ParsedPolicyData) => {
    // Calcular o status real baseado na data de vencimento
    const getRealStatus = (policy: ParsedPolicyData): string => {
      const expirationDate = policy.expirationDate || policy.endDate;
      
      if (!expirationDate) {
        return 'vigente';
      }
      
      const now = new Date();
      const expDate = new Date(expirationDate);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < -30) {
        return 'nao_renovada';
      } else if (diffDays < 0) {
        return 'vencida';
      } else if (diffDays <= 30) {
        return 'vencendo';
      } else {
        return 'vigente';
      }
    };
    
    const realStatus = getRealStatus(policy);
    
    switch (realStatus) {
      case 'vigente':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Vigente</Badge>;
      case 'vencendo':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200">Vencendo</Badge>;
      case 'vencida':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Vencida</Badge>;
      case 'nao_renovada':
        return <Badge className="bg-gray-50 text-gray-600 border-gray-200">Não Renovada</Badge>;
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Vencida</Badge>;
      default:
        return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Vigente</Badge>;
    }
  };

  const getOptimizationBadge = (policy: ParsedPolicyData) => {
    const avgCost = policies.reduce((sum, p) => sum + p.monthlyAmount, 0) / policies.length;
    
    if (policy.monthlyAmount > avgCost * 1.5) {
      return <Badge className="bg-red-50 text-red-600 border-red-200">Acima</Badge>;
    }
    
    if (policy.claimRate && policy.claimRate < 5) {
      return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Subutilizado</Badge>;
    }
    
    // Verificar duplicação
    const duplicates = policies.filter(p => p.type === policy.type && p.id !== policy.id);
    if (duplicates.length > 0) {
      return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">Duplicado</Badge>;
    }
    
    return null;
  };

  // Funções de multiseleção
  const togglePolicySelection = (policyId: string) => {
    setSelectedPolicies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(policyId)) {
        newSet.delete(policyId);
      } else {
        newSet.add(policyId);
      }
      return newSet;
    });
  };

  const toggleAllPolicies = () => {
    if (selectedPolicies.size === filteredPolicies.length) {
      setSelectedPolicies(new Set());
    } else {
      setSelectedPolicies(new Set(filteredPolicies.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPolicies.size === 0) return;

    const confirmDelete = confirm(`Deseja realmente excluir ${selectedPolicies.size} apólice(s) selecionada(s)?`);
    if (!confirmDelete) return;

    toast({
      title: "⏳ Excluindo apólices",
      description: `Excluindo ${selectedPolicies.size} apólice(s)...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const policyId of selectedPolicies) {
      try {
        await onPolicyDelete(policyId);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Erro ao deletar apólice ${policyId}:`, error);
      }
    }

    setSelectedPolicies(new Set());

    if (errorCount === 0) {
      toast({
        title: "✅ Exclusão concluída",
        description: `${successCount} apólice(s) excluída(s) com sucesso!`,
      });
    } else {
      toast({
        title: "⚠️ Exclusão parcial",
        description: `${successCount} apólice(s) excluída(s), ${errorCount} falhou(ram)`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de ações em massa */}
      {selectedPolicies.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="font-medium text-blue-900">
                  {selectedPolicies.size} apólice(s) selecionada(s)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPolicies(new Set())}
                  className="border-blue-300 hover:bg-blue-100"
                >
                  Limpar seleção
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir selecionadas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={filteredPolicies.length > 0 && selectedPolicies.size === filteredPolicies.length}
                  onCheckedChange={toggleAllPolicies}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium cursor-pointer"
                >
                  Selecionar todas
                </label>
              </div>
              <CardTitle>Filtros e Busca</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, seguradora ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="vida">Vida</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="patrimonial">Patrimonial</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="acidentes_pessoais">Acidentes Pessoais</SelectItem>
                </SelectContent>
            </Select>

            <Select value={filterInsurer} onValueChange={setFilterInsurer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seguradora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Seguradoras</SelectItem>
                {uniqueInsurers.map(insurer => (
                  <SelectItem key={insurer} value={insurer}>{insurer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expiring">Vencendo</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterClaimRate} onValueChange={setFilterClaimRate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sinistralidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Faixas</SelectItem>
                  <SelectItem value="low">Baixa (&lt;5%)</SelectItem>
                  <SelectItem value="medium">Média (5-15%)</SelectItem>
                  <SelectItem value="high">Alta (&gt;15%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados de Otimização */}
      {viewMode === 'admin' && optimizationData.potentialSavings > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              💰 Oportunidades de Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(optimizationData.potentialSavings)}
                </p>
                <p className="text-sm text-green-600">Economia Potencial Anual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {optimizationData.highCostPolicies}
                </p>
                <p className="text-sm text-orange-600">Apólices Acima da Média</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {optimizationData.underutilizedPolicies}
                </p>
                <p className="text-sm text-blue-600">Subutilizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Apólices */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPolicies.map((policy) => (
          <Card 
            key={policy.id} 
            className={`hover:shadow-lg transition-all ${
              selectedPolicies.has(policy.id) 
                ? 'ring-2 ring-blue-500 bg-blue-50/20' 
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    id={`policy-${policy.id}`}
                    checked={selectedPolicies.has(policy.id)}
                    onCheckedChange={() => togglePolicySelection(policy.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                    <p className="text-sm text-gray-500">{policy.policyNumber}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(policy)}
                  {viewMode === 'admin' && getOptimizationBadge(policy)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Seguradora</p>
                  <p className="font-medium">{renderValueAsString(policy.insurer)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tipo</p>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(policy.type)}
                    <p className="font-medium">{getTypeLabel(policy.type)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Valor Mensal</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(policy.monthlyAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cobertura</p>
                  <p className="font-medium">
                    {policy.totalCoverage ? formatCurrency(policy.totalCoverage) : 'N/A'}
                  </p>
                </div>
              </div>

              {policy.claimRate && (
                <div className="text-sm">
                  <p className="text-gray-500">Sinistralidade</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{policy.claimRate}%</p>
                    {policy.claimRate > 15 && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicySelect(policy)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingPolicy(policy);
                      setIsEditModalOpen(true);
                    }}
                    className="hover:bg-green-50 hover:text-green-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(policy)}
                    className="hover:bg-purple-50 hover:text-purple-600"
                    disabled={!policy.file && !policy.pdfPath}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicyDelete(policy.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Nenhuma apólice encontrada com os filtros aplicados</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <PolicyEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPolicy(null);
        }}
        policy={editingPolicy}
        onSave={(updatedPolicy) => {
          onPolicyEdit(updatedPolicy);
          setIsEditModalOpen(false);
          setEditingPolicy(null);
        }}
      />
    </div>
  );
}

function getTypeLabel(type: string) {
  const types = {
    auto: 'Auto',
    automovel: 'Auto',
    vida: 'Vida', 
    saude: 'Saúde',
    patrimonial: 'Patrimonial',
    residencial: 'Residencial',
    empresarial: 'Empresarial',
    acidentes_pessoais: 'Acidentes Pessoais',
    nautico: 'Náutico'
  };
  return types[type.toLowerCase()] || type;
}

function getTypeIcon(type: string) {
  const iconClass = 'h-4 w-4';
  const normalizedType = type.toLowerCase();
  
  switch (normalizedType) {
    case 'auto':
    case 'automovel':
      return <Car className={`${iconClass} text-blue-600`} />;
    case 'vida':
      return <Heart className={`${iconClass} text-red-600`} />;
    case 'saude':
      return <Activity className={`${iconClass} text-green-600`} />;
    case 'residencial':
    case 'patrimonial':
      return <Home className={`${iconClass} text-orange-600`} />;
    case 'empresarial':
      return <Building2 className={`${iconClass} text-purple-600`} />;
    case 'acidentes_pessoais':
      return <ShieldAlert className={`${iconClass} text-yellow-600`} />;
    case 'nautico':
      return <Anchor className={`${iconClass} text-cyan-600`} />;
    default:
      return <Shield className={`${iconClass} text-gray-600`} />;
  }
}

function generateOptimizationData(policies: ParsedPolicyData[]) {
  const avgMonthlyCost = policies.reduce((sum, p) => sum + p.monthlyAmount, 0) / policies.length;
  
  const highCostPolicies = policies.filter(p => p.monthlyAmount > avgMonthlyCost * 1.5).length;
  const underutilizedPolicies = policies.filter(p => p.claimRate && p.claimRate < 5).length;
  
  // Calcular economia potencial baseada em benchmarks
  const potentialSavings = policies.reduce((total, policy) => {
    let savings = 0;
    
    // Alto custo - 20% de economia potencial
    if (policy.monthlyAmount > avgMonthlyCost * 1.5) {
      savings += policy.monthlyAmount * 0.2 * 12;
    }
    
    // Subutilizado - 15% de economia potencial
    if (policy.claimRate && policy.claimRate < 5) {
      savings += policy.monthlyAmount * 0.15 * 12;
    }
    
    return total + savings;
  }, 0);

  return {
    potentialSavings: Math.round(potentialSavings),
    highCostPolicies,
    underutilizedPolicies
  };
}
