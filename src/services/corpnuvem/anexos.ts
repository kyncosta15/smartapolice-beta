import { corpClient } from "@/lib/corpClient";

interface BuscarAnexosParams {
  codfil: number;
  codigo: number;
}

interface BuscarDocumentoAnexosParams {
  codfil: number;
  nosnum: number;
}

interface DocumentoAnexo {
  nome: string;
  tipo: string;
  descricao: string;
  datahora: string;
  usuinc: string;
  url: string;
  indice_anexo: number;
}

interface DocumentoAnexosResponse {
  anexos: DocumentoAnexo[];
}

export async function getClienteAnexos(params: BuscarAnexosParams) {
  console.log('📎 [CorpNuvem Anexos] Buscando anexos do cliente:', params);
  
  try {
    const res = await corpClient.get("/cliente_anexos", { 
      params: { 
        codfil: params.codfil,
        codigo: params.codigo 
      } 
    });
    console.log('✅ [CorpNuvem Anexos] Anexos encontrados:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Anexos] Erro:', error?.response?.data);
    throw error;
  }
}

export async function getDocumentoAnexos(params: BuscarDocumentoAnexosParams): Promise<DocumentoAnexosResponse> {
  console.log('📎 [CorpNuvem Anexos] Buscando anexos do documento:', params);
  
  try {
    const res = await corpClient.get("/documento_anexos", { 
      params: { 
        codfil: params.codfil,
        nosnum: params.nosnum 
      } 
    });
    console.log('✅ [CorpNuvem Anexos] Anexos do documento encontrados:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ [CorpNuvem Anexos] Erro ao buscar anexos do documento:', error?.response?.data);
    throw error;
  }
}

// Detectar se é dispositivo móvel
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth <= 768);
}

export async function downloadDocumentoAnexo(url: string, fileName: string) {
  console.log('📥 [CorpNuvem Anexos] Baixando anexo de:', url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao baixar arquivo');
    
    const blob = await response.blob();
    
    // Criar blob com MIME type explícito para PDF
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    
    // Usar Web Share API APENAS em dispositivos móveis
    if (isMobileDevice() && navigator.share && navigator.canShare) {
      try {
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        // Verificar se pode compartilhar arquivos
        if (navigator.canShare({ files: [file] })) {
          console.log('📱 Usando Web Share API (mobile)');
          await navigator.share({
            title: fileName.replace('.pdf', ''),
            text: `Documento ${fileName}`,
            files: [file]
          });
          
          console.log('✅ [CorpNuvem Anexos] Compartilhado via Web Share API');
          return;
        }
      } catch (shareError: any) {
        // Usuário cancelou ou erro - continuar com fallback
        if (shareError.name === 'AbortError') {
          console.log('ℹ️ Usuário cancelou o compartilhamento');
          return;
        }
        console.log('⚠️ Web Share não disponível, usando fallback:', shareError);
      }
    }
    
    // Fallback: Download tradicional otimizado para mobile
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.setAttribute('download', fileName); // Força download
    link.style.display = 'none';
    link.target = '_self'; // Evita abrir em nova aba
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 100);
    
    console.log('✅ [CorpNuvem Anexos] Download realizado com sucesso');
  } catch (error: any) {
    console.error('❌ [CorpNuvem Anexos] Erro ao baixar anexo:', error);
    throw error;
  }
}
