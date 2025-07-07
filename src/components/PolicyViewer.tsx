
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2, Search, Filter, FileText, Download, Building2, Calendar, DollarSign } from 'lucide-react';
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
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-medium">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 font-medium">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 font-medium">Vencida</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 font-medium">Em Análise</Badge>;
      default:
        return <Badge variant="secondary" className="font-medium">Desconhecido</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      auto: 'bg-blue-50 text-blue-700 border-blue-200',
      vida: 'bg-purple-50 text-purple-700 border-purple-200',
      saude: 'bg-green-50 text-green-700 border-green-200',
      patrimonial: 'bg-orange-50 text-orange-700 border-orange-200',
      empresarial: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      acidentes_pessoais: 'bg-pink-50 text-pink-700 border-pink-200'
    };
    
    const colorClass = typeColors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
    const label = {
      auto: 'Auto',
      vida: 'Vida',
      saude: 'Saúde',
      patrimonial: 'Patrimonial',
      empresarial: 'Empresarial',
      acidentes_pessoais: 'Acidentes Pessoais'
    }[type] || 'Outros';

    return <Badge className={`${colorClass} font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{label}</Badge>;
  };

  // Function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>
          <div className="flex flex-col gap-4">
            <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 font-sf-pro`}>
              Minhas Apólices
            </CardTitle>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'space-y-3' : 'items-center space-x-3'}`}>
              <div className={`relative ${isMobile ? 'w-full' : 'flex-1 lg:w-80'}`}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, seguradora ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-100 font-sf-pro"
                />
              </div>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className={`${isMobile ? 'w-full' : 'w-40'} border-gray-200 font-sf-pro`}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="font-sf-pro">
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
                  className={`flex items-center space-x-2 border-gray-200 hover:bg-gray-50 font-sf-pro ${isMobile ? 'w-full justify-center' : ''}`}
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
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'} gap-6`}>
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="group bg-white border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden h-full flex flex-col">
            {/* Header com gradiente */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 font-medium font-sf-pro truncate`} title={policy.insurer}>
                      {truncateText(policy.insurer, 25)}
                    </p>
                  </div>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-2 font-sf-pro leading-tight line-clamp-2`} title={policy.name}>
                    {policy.name}
                  </h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-3 font-mono font-sf-pro truncate`} title={policy.policyNumber}>
                    {truncateText(policy.policyNumber, 20)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(policy.status)}
                    {getTypeBadge(policy.type)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 flex-1 flex flex-col">
              {/* Valor em destaque */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 flex-shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-700 font-medium font-sf-pro`}>Valor Mensal</p>
                </div>
                <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-green-700 font-sf-pro`}>
                  R$ {policy.monthlyAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Informações adicionais */}
              <div className="space-y-3 flex-1">
                {/* Modelo do carro para seguros Auto */}
                {policy.type === 'auto' && policy.vehicleModel && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 font-medium font-sf-pro`}>Veículo</p>
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900 font-sf-pro truncate`} title={policy.vehicleModel}>
                        {truncateText(policy.vehicleModel, 30)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Estado (UF) */}
                {policy.uf && (
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-purple-500 rounded-full flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 font-medium font-sf-pro`}>Estado</p>
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900 font-sf-pro`}>{policy.uf}</p>
                    </div>
                  </div>
                )}
                
                {/* Vigência */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 font-medium font-sf-pro`}>Vigência</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 font-sf-pro`}>
                      {new Date(policy.startDate).toLocaleDateString('pt-BR')} - {new Date(policy.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className={`flex items-center justify-between pt-4 border-t border-gray-100 flex-shrink-0 ${isMobile ? 'flex-col space-y-3' : ''}`}>
                <div className={`flex ${isMobile ? 'w-full justify-center space-x-3' : 'space-x-2'}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicySelect(policy)}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 font-sf-pro"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {!isMobile && 'Ver'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(policy)}
                    className="hover:bg-green-50 hover:text-green-600 transition-colors duration-200 font-sf-pro"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {!isMobile && 'Editar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(policy)}
                    className="hover:bg-purple-50 hover:text-purple-600 transition-colors duration-200 font-sf-pro"
                    disabled={!policy.file && !policy.pdfPath}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {!isMobile && 'Baixar'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicyDelete(policy.id)}
                    className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200 font-sf-pro"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {!isMobile && 'Excluir'}
                  </Button>
                </div>
                
                {policy.status === 'expiring' && (
                  <Badge className={`bg-amber-100 text-amber-800 font-medium font-sf-pro ${isMobile ? 'text-xs w-full justify-center' : 'text-xs'}`}>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></div>
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
