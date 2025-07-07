import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2, Search, Filter, FileText, Download } from 'lucide-react';
import { LocationFilter } from './LocationFilter';
import { PolicyEditModal } from './PolicyEditModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface PolicyViewerProps {
  policies: any[];
  onPolicySelect: (policy: any) => void;
  onPolicyEdit: (policy: any) => void;
  onPolicyDelete: (policyId: string) => void;
}

export function PolicyViewer({ policies, onPolicySelect, onPolicyEdit, onPolicyDelete }: PolicyViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUF, setFilterUF] = useState('all');
  const [filterInsurer, setFilterInsurer] = useState('all');
  const [locationFilters, setLocationFilters] = useState({ states: [], cities: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleDownload = async (policy: any) => {
    if (policy.file) {
      // Create a blob URL for the file and trigger download
      const url = URL.createObjectURL(policy.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${policy.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (policy.pdfPath) {
      // For Opera: Use multiple fallback strategies
      console.log('🔄 Iniciando download para Opera/browsers restritivos');
      
      try {
        // Estratégia 1: Tentar download direto via storage.download()
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
          const blobUrl = URL.createObjectURL(fileBlob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${policy.name || 'apolice'}.pdf`;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          
          console.log('✅ Download concluído com sucesso (método direto)');
          return;
        }
      } catch (directError) {
        console.warn('⚠️ Falha no download direto:', directError);
      }
      
      try {
        // Estratégia 2: Usar Edge Function como proxy
        console.log('📥 Tentativa 2: Download via Edge Function proxy');
        const { supabase } = await import('@/integrations/supabase/client');
        
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
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${policy.name || 'apolice'}.pdf`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        console.log('✅ Download concluído via proxy');
        return;
        
      } catch (proxyError) {
        console.warn('⚠️ Falha no proxy:', proxyError);
      }
      
      try {
        // Estratégia 3: Abrir em nova aba como último recurso
        console.log('📥 Tentativa 3: Abrir em nova aba');
        const { PolicyPersistenceService } = await import('@/services/policyPersistenceService');
        const downloadUrl = await PolicyPersistenceService.getPDFDownloadUrl(policy.pdfPath);
        
        if (downloadUrl) {
          console.log('✅ Abrindo em nova aba');
          window.open(downloadUrl, '_blank');
          return;
        }
      } catch (urlError) {
        console.error('❌ Falha ao gerar URL:', urlError);
      }
      
      // Se todas as estratégias falharam
      console.error('❌ Todas as estratégias de download falharam');
      alert(`Download bloqueado pelo navegador Opera.

Soluções recomendadas:
1. Use Chrome, Firefox ou Edge para downloads
2. Desative o bloqueador de anúncios do Opera temporariamente
3. Adicione *.supabase.co às exceções do Opera

O arquivo está salvo e disponível - o problema é apenas o bloqueio do navegador.`);
      
    } else {
      console.warn('Arquivo não disponível para download:', policy.name);
      alert('Arquivo não disponível para download');
    }
  };

  const handleEditClick = (policy: any) => {
    setEditingPolicy(policy);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedPolicy: any) => {
    onPolicyEdit(updatedPolicy);
    setIsEditModalOpen(false);
    setEditingPolicy(null);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingPolicy(null);
  };

  const uniqueInsurers = [...new Set(policies.map(policy => policy.insurer))].sort();

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insurer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || policy.type === filterType;
    
    const matchesUF = filterUF === 'all' || policy.uf === filterUF;
    
    const matchesInsurer = filterInsurer === 'all' || policy.insurer === filterInsurer;
    
    const matchesLocation = locationFilters.states.length === 0 && locationFilters.cities.length === 0 ||
                           locationFilters.states.some(state => policy.location?.state === state) ||
                           locationFilters.cities.some(city => policy.location?.city === city);
    
    return matchesSearch && matchesType && matchesUF && matchesInsurer && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">Vencida</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">Em Análise</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      auto: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50',
      vida: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-50',
      saude: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-50',
      patrimonial: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50',
      empresarial: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-50',
      acidentes_pessoais: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50'
    };
    
    const colorClass = typeColors[type] || 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-50';
    const label = {
      auto: 'Auto',
      vida: 'Vida',
      saude: 'Saúde',
      patrimonial: 'Patrimonial',
      empresarial: 'Empresarial',
      acidentes_pessoais: 'Acidentes Pessoais'
    }[type] || 'Outros';

    return <Badge className={`${colorClass} ${isMobile ? 'text-xs' : 'text-sm'}`}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
          <div className="flex flex-col gap-4">
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
              Minhas Apólices
            </CardTitle>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'space-y-3' : 'items-center space-x-2'}`}>
              <div className={`relative ${isMobile ? 'w-full' : 'flex-1 lg:w-80'}`}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, seguradora ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className={`${isMobile ? 'w-full' : 'w-40'}`}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="vida">Vida</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="patrimonial">Patrimonial</SelectItem>
                    <SelectItem value="empresarial">Empresarial</SelectItem>
                    <SelectItem value="acidentes_pessoais">Acidentes Pessoais</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterUF} onValueChange={setFilterUF}>
                  <SelectTrigger className={`${isMobile ? 'w-full' : 'w-32'}`}>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterInsurer} onValueChange={setFilterInsurer}>
                  <SelectTrigger className={`${isMobile ? 'w-full' : 'w-48'}`}>
                    <SelectValue placeholder="Seguradora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Seguradoras</SelectItem>
                    {uniqueInsurers.map((insurer) => (
                      <SelectItem key={insurer} value={insurer}>
                        {insurer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-1 ${isMobile ? 'w-full justify-center' : ''}`}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pt-0">
            <LocationFilter onFilterChange={setLocationFilters} />
          </CardContent>
        )}
      </Card>

      {/* Lista de Apólices */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300 h-full">
            <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900 mb-1 truncate`}>
                    {policy.name}
                  </h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-2 truncate`}>
                    {policy.policyNumber}
                  </p>
                  <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'items-center space-x-2'}`}>
                    {getStatusBadge(policy.status)}
                    {getTypeBadge(policy.type)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className={`space-y-${isMobile ? '2' : '3'}`}>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <div>
                  <p className="text-gray-500 font-medium">Seguradora</p>
                  <p className="font-medium text-gray-900 truncate">{policy.insurer}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Valor Mensal</p>
                  <p className="font-semibold text-green-600">
                    R$ {policy.monthlyAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Modelo do carro para seguros Auto */}
              {policy.type === 'auto' && policy.vehicleModel && (
                <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p className="text-gray-500 font-medium">Modelo do Veículo</p>
                  <p className="font-medium text-gray-900 truncate">{policy.vehicleModel}</p>
                </div>
              )}

              {/* Estado (UF) */}
              {policy.uf && (
                <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p className="text-gray-500 font-medium">Estado</p>
                  <p className="font-medium text-gray-900">{policy.uf}</p>
                </div>
              )}
              
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <div>
                  <p className="text-gray-500 font-medium">Início</p>
                  <p className="text-gray-900">{new Date(policy.startDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Vencimento</p>
                  <p className="text-gray-900">{new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className={`flex items-center justify-between pt-3 border-t border-gray-100 ${isMobile ? 'flex-col space-y-2' : ''}`}>
                <div className={`flex ${isMobile ? 'w-full justify-center' : 'space-x-1'}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicySelect(policy)}
                    className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(policy)}
                    className="hover:bg-green-50 hover:text-green-600 h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(policy)}
                    className="hover:bg-purple-50 hover:text-purple-600 h-8 w-8 p-0"
                    disabled={!policy.file && !policy.pdfPath}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicyDelete(policy.id)}
                    className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {policy.status === 'expiring' && (
                  <Badge className={`bg-orange-100 text-orange-700 ${isMobile ? 'text-xs w-full justify-center' : 'text-xs'}`}>
                    Ação necessária
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <Card className="bg-white border border-gray-200">
          <CardContent className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <div className="text-gray-400 mb-4">
              <FileText className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto`} />
            </div>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
              Nenhuma apólice encontrada
            </h3>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-500`}>
              Tente ajustar os filtros ou termos de busca
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <PolicyEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        policy={editingPolicy}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
