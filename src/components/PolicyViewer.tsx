import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocationFilter } from './LocationFilter';
import { PolicyEditModal } from './PolicyEditModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

interface Policy {
  id: string;
  name: string;
  insurer: string;
  policyNumber: string;
  type: string;
  uf: string;
  pdfPath?: string;
  file?: Blob;
}

interface PolicyViewerProps {
  policies: Policy[];
  onPolicySelect: (policy: Policy) => void;
  onPolicyEdit: (policy: Policy) => void;
  onPolicyDelete: (policyId: string) => void;
}

export function PolicyViewer({
  policies,
  onPolicySelect,
  onPolicyEdit,
  onPolicyDelete,
}: PolicyViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUF, setFilterUF] = useState('all');
  const [filterInsurer, setFilterInsurer] = useState('all');
  const [locationFilters, setLocationFilters] = useState<{ states: string[]; cities: string[] }>({ states: [], cities: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleDownload = async (policy: Policy) => {
    if (!policy.pdfPath && !policy.file) {
      alert('Arquivo não disponível para download');
      return;
    }

    const isIOS = /iP(ad|hone|od)/.test(navigator.platform);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // 1️⃣ Safari iOS: abre direto em nova aba para que o usuário use o viewer nativo
    if (isIOS && isSafari && policy.pdfPath) {
      try {
        const { data: signedUrlData, error } = await supabase
          .storage
          .from('pdfs')
          .createSignedUrl(policy.pdfPath, 60, { download: true });
        if (error) throw error;
        window.open(signedUrlData.signedUrl, '_blank');
        return;
      } catch {
        // se falhar, cai no fluxo normal abaixo
      }
    }

    // 2️⃣ Blob + download attribute (para Chrome, Firefox, Edge)
    if (policy.file) {
      const blobUrl = URL.createObjectURL(policy.file);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${policy.name || 'apolice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
      return;
    }

    // 3️⃣ Supabase download via storage.download()
    if (policy.pdfPath) {
      try {
        const { data: fileBlob, error: downloadError } = await supabase
          .storage
          .from('pdfs')
          .download(policy.pdfPath);
        if (downloadError) throw downloadError;

        const blobUrl = URL.createObjectURL(fileBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${policy.name || 'apolice'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        return;
      } catch {
        // continua para o próximo fallback
      }
    }

    // 4️⃣ Edge Function proxy (com Content-Disposition: attachment)
    if (policy.pdfPath) {
      try {
        const res = await fetch(
          'https://seu-proxy.supabase.co/functions/v1/download-pdf',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfPath: policy.pdfPath }),
          }
        );
        if (!res.ok) throw new Error(`Proxy retornou ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${policy.name || 'apolice'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
        return;
      } catch {
        // próximo fallback
      }
    }

    // 5️⃣ Fallback final: abrir em nova aba para visualização e download manual
    if (policy.pdfPath) {
      try {
        const { data: signedUrlData, error } = await supabase
          .storage
          .from('pdfs')
          .createSignedUrl(policy.pdfPath, 300);
        if (error) throw error;
        window.open(signedUrlData.signedUrl, '_blank');
        return;
      } catch (err) {
        console.error('Todas as estratégias de download falharam:', err);
        alert('Não foi possível iniciar o download. Tente outro navegador.');
      }
    }
  };

  const handleEditClick = (p: Policy) => {
    setEditingPolicy(p);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updated: Policy) => {
    onPolicyEdit(updated);
    setIsEditModalOpen(false);
    setEditingPolicy(null);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingPolicy(null);
  };

  // filtros e listagem (mantive seu código original)…  
  const filtered = policies.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name.toLowerCase().includes(term) ||
        p.insurer.toLowerCase().includes(term) ||
        p.policyNumber.toLowerCase().includes(term)) &&
      (filterType === 'all' || p.type === filterType) &&
      (filterUF === 'all' || p.uf === filterUF) &&
      (filterInsurer === 'all' || p.insurer === filterInsurer)
    );
  });

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>
          {/* …seu header de busca e botões… */}
        </CardHeader>
        {showFilters && <CardContent className="pt-0"><LocationFilter onFilterChange={setLocationFilters} /></CardContent>}
      </Card>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
        {filtered.map(policy => (
          <Card key={policy.id} className="border">
            <CardContent>
              <h3 className="text-lg font-semibold">{policy.name}</h3>
              <p className="text-sm">{policy.insurer}</p>
              <div className="flex space-x-2 mt-4">
                <Button size="sm" onClick={() => handleDownload(policy)}>
                  <Download size={16} /> Baixar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onPolicySelect(policy)}>
                  <Eye size={16} /> Ver
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditClick(policy)}>
                  <Edit size={16} /> Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onPolicyDelete(policy.id)}>
                  <Trash2 size={16} /> Deletar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent>Nenhuma apólice encontrada.</CardContent>
          </Card>
        )}
      </div>

      <PolicyEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        policy={editingPolicy!}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
