import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2, Search, FileText, Download, Building2, Calendar, DollarSign, SlidersHorizontal } from 'lucide-react';
import { LocationFilter } from './LocationFilter';
import { PolicyEditModal } from './PolicyEditModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleDownload = async (policy: any) => {
    // 1) Forçar download no Safari via signed URL
    if (policy.pdfPath) {
      // dentro do bloco isSafari
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
  try {
    const { data, error } = await supabase
      .storage
      .from('pdfs')
      .createSignedUrl(policy.pdfPath, 60, { download: true });
    if (error) throw error;

    // 1) carrega o PDF como blob
    const resp = await fetch(data.signedUrl);
    const blob = await resp.blob();

    // 2) dispara download sem navegar
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${policy.name || 'apolice'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    return; // fim do fluxo Safari
  } catch (err) {
    console.warn('Falha download forçado Safari:', err);
  }
}

    // 2) Download normal via blob
    if (policy.file) {
      const url = URL.createObjectURL(policy.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${policy.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } else if (policy.pdfPath) {
      console.log('🔄 Iniciando download com fallback');

      // Estratégia 1: storage.download()
      try {
        const { data: fileBlob, error: downloadError } = await supabase
          .storage
          .from('pdfs')
          .download(policy.pdfPath);
        if (downloadError) throw downloadError;
        const blobUrl = URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${policy.name || 'apolice'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      } catch (directError) {
        console.warn('⚠️ Falha no download direto:', directError);
      }

      // Estratégia 2: Edge Function proxy
      try {
        const response = await fetch(`https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/download-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfPath: policy.pdfPath }),
        });
        if (!response.ok) throw new Error(`Edge proxy error ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${policy.name || 'apolice'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      } catch (proxyError) {
        console.warn('⚠️ Falha no proxy:', proxyError);
      }

      // Estratégia 3: Abrir em nova aba
      try {
        const { PolicyPersistenceService } = await import('@/services/policyPersistenceService');
        const downloadUrl = await PolicyPersistenceService.getPDFDownloadUrl(policy.pdfPath);
        if (downloadUrl) {
          window.open(downloadUrl, '_blank');
          return;
        }
      } catch (urlError) {
        console.error('❌ Falha ao gerar URL:', urlError);
      }

      console.error('❌ Todas as estratégias de download falharam');
      alert('Download bloqueado. Tente outro navegador ou ajuste configurações.');
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

  const uniqueInsurers = [...new Set(policies.map(p => p.insurer))].sort();

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.insurer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || policy.type === filterType;
    const matchesUF = filterUF === 'all' || policy.uf === filterUF;
    const matchesInsurer = filterInsurer === 'all' || policy.insurer === filterInsurer;
    const matchesLocation =
      (locationFilters.states.length === 0 && locationFilters.cities.length === 0) ||
      locationFilters.states.some(s => policy.location?.state === s) ||
      locationFilters.cities.some(c => policy.location?.city === c);
    return matchesSearch && matchesType && matchesUF && matchesInsurer && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Ativa</Badge>;
      case 'expiring': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Vencendo</Badge>;
      case 'expired': return <Badge className="bg-red-50 text-red-700 border-red-200">Vencida</Badge>;
      case 'under_review': return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Em Análise</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const map: Record<string,string> = {
      auto: 'Auto', vida: 'Vida', saude: 'Saúde', patrimonial: 'Patrimonial', empresarial: 'Empresarial', acidentes_pessoais: 'Acidentes Pessoais'
    };
    return <Badge className="font-medium">{map[type] || 'Outros'}</Badge>;
  };

  const truncateText = (text: string, maxLength: number) =>
    text?.length > maxLength ? text.slice(0, maxLength) + '...' : text;

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>[…]</CardHeader>
        {showFilters && <CardContent className="pt-0"><LocationFilter onFilterChange={setLocationFilters} /></CardContent>}
      </Card>
      {/* Lista de Apólices */}
      <div className={isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}>[…]</div>
      {filteredPolicies.length === 0 && <Card><CardContent>[…]Nenhuma apólice encontrada[…] </CardContent></Card>}
      <PolicyEditModal isOpen={isEditModalOpen} onClose={handleCloseEdit} policy={editingPolicy} onSave={handleSaveEdit} />
    </div>
  );
}
