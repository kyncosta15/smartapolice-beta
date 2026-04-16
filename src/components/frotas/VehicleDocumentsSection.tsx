import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Upload, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DragDropUpload } from '@/components/ui/drag-drop-upload';
import { MigrateDocumentsButton } from './MigrateDocumentsButton';

interface VehicleDocument {
  id: string;
  tipo: string;
  nome_arquivo: string;
  url: string;
  tamanho_arquivo?: number;
  tipo_mime?: string;
  created_at: string;
  origem: string;
}

interface VehicleDocumentsSectionProps {
  vehicleId: string;
  mode?: 'view' | 'edit';
  vehiclePlaca?: string;
  vehicleChassi?: string;
}

export function VehicleDocumentsSection({ 
  vehicleId, 
  mode = 'view', 
  vehiclePlaca, 
  vehicleChassi 
}: VehicleDocumentsSectionProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingLinkedDocs, setSearchingLinkedDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isFetchingRef = useRef(false);

  const getDocumentType = useCallback((fileName: string): string => {
    const lowerFileName = fileName.toLowerCase();
    
    // Mapear baseado no nome do arquivo para tipos permitidos pela constraint
    if (lowerFileName.includes('nf') || lowerFileName.includes('nota') || lowerFileName.includes('fiscal')) {
      return 'nf';
    }
    if (lowerFileName.includes('crlv') || lowerFileName.includes('documento') || lowerFileName.includes('veiculo')) {
      return 'crlv';
    }
    if (lowerFileName.includes('termo') && lowerFileName.includes('responsabilidade')) {
      return 'termo_responsabilidade';
    }
    if (lowerFileName.includes('termo') && lowerFileName.includes('devolucao')) {
      return 'termo_devolucao';
    }
    if (lowerFileName.includes('contrato')) {
      return 'contrato';
    }
    
    // Para todos os outros casos, usar 'outro'
    return 'outro';
  }, []);

  const getDocumentTypeLabel = useCallback((tipo: string): string => {
    const labelMap: Record<string, string> = {
      nf: 'Nota Fiscal',
      crlv: 'CRLV',
      termo_responsabilidade: 'Termo de Responsabilidade',
      termo_devolucao: 'Termo de Devolução',
      contrato: 'Contrato',
      outro: 'Outro Documento',
    };
    return labelMap[tipo] || 'Documento';
  }, []);

  const fetchDocuments = useCallback(async () => {
    if (!vehicleId || vehicleId.trim() === '') {
      setDocuments([]);
      setLoading(false);
      setSearchingLinkedDocs(false);
      return;
    }
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setSearchingLinkedDocs(false);

    // Safety timeout: nunca deixar o estado loading travado
    const safetyTimer = setTimeout(() => {
      console.warn('⚠️ fetchDocuments: timeout de 8s atingido, liberando loading');
      setLoading(false);
      setSearchingLinkedDocs(false);
      isFetchingRef.current = false;
    }, 8000);

    try {
      // 1) PRIORIDADE: Documentos diretamente vinculados ao veículo (rápido)
      const { data: frotaDocs, error: frotaError } = await supabase
        .from('frota_documentos')
        .select('*')
        .eq('veiculo_id', vehicleId)
        .order('created_at', { ascending: false });

      if (frotaError) {
        console.error('Erro ao buscar documentos da frota:', frotaError);
      }

      // Renderiza imediatamente os documentos diretos — não bloqueia esperando a 2a query
      const baseDocs = (frotaDocs || []).map((doc: any) => ({
        ...doc,
        origem: doc.origem || 'upload',
      }));
      setDocuments(baseDocs);
      setLoading(false);
      clearTimeout(safetyTimer);

      // 2) SECUNDÁRIO: documentos de solicitações executadas (em background, best-effort)
      const placa = (vehiclePlaca ?? '').toString().trim();
      const chassi = (vehicleChassi ?? '').toString().trim();

      if (!placa && !chassi) {
        return;
      }

      setSearchingLinkedDocs(true);

      try {
        const requestLookups: Promise<any>[] = [];

        if (placa) {
          requestLookups.push(
            supabase
              .from('fleet_change_requests')
              .select('id')
              .eq('status', 'executado')
              .eq('placa', placa)
          );
        }

        if (chassi) {
          requestLookups.push(
            supabase
              .from('fleet_change_requests')
              .select('id')
              .eq('status', 'executado')
              .eq('chassi', chassi)
          );
        }

        const requestResponses = await Promise.all(requestLookups);
        const requestErrors = requestResponses
          .map((response) => response.error)
          .filter(Boolean);

        if (requestErrors.length > 0) {
          throw requestErrors[0];
        }

        const requestIds = Array.from(
          new Set(
            requestResponses.flatMap((response) =>
              (response.data || []).map((request: { id: string }) => request.id)
            )
          )
        );

        if (requestIds.length === 0) return;

        const { data: docsData, error: docsError } = await supabase
          .from('fleet_request_documents')
          .select('*')
          .in('request_id', requestIds)
          .order('created_at', { ascending: false });

        if (docsError || !docsData || docsData.length === 0) return;

        const externalDocs = docsData.map((doc: any) => ({
          id: doc.id,
          origem: 'external',
          tipo: getDocumentType(doc.file_name),
          url: doc.file_url,
          nome_arquivo: doc.file_name,
          tamanho_arquivo: doc.file_size,
          tipo_mime: doc.mime_type,
          created_at: doc.created_at,
        }));

        // Mescla sem duplicar
        setDocuments((prev) => {
          const merged = [...prev, ...externalDocs];
          return merged.filter(
            (doc, index, arr) =>
              arr.findIndex(
                (d) => d.nome_arquivo === doc.nome_arquivo && d.tamanho_arquivo === doc.tamanho_arquivo
              ) === index
          );
        });
      } catch (linkedErr) {
        console.warn('Falha ao buscar documentos vinculados (ignorado):', linkedErr);
      } finally {
        setSearchingLinkedDocs(false);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar documentos:', error);
      setDocuments([]);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [vehicleId, vehiclePlaca, vehicleChassi, getDocumentType]);

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, vehiclePlaca, vehicleChassi]);

  const handleFilesUploaded = useCallback(async (files: Array<{ file: File; id: string; url?: string; uploaded?: boolean; error?: string }>) => {
    if (!vehicleId || files.length === 0) return;

    setUploading(true);
    let savedCount = 0;
    const errors: string[] = [];
    
    // Aguardar um pouco para garantir que o DragDropUpload terminou o processamento
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Filtrar apenas arquivos que foram realmente enviados com sucesso
    const successfulFiles = files.filter(f => f.url && f.uploaded !== false && !f.error);
    const failedFiles = files.filter(f => !f.url || f.error);
    
    console.log('🔍 Arquivos para processar:', { 
      total: files.length, 
      successful: successfulFiles.length, 
      failed: failedFiles.length 
    });
    
    try {
      // Processar apenas arquivos que foram enviados com sucesso para o storage
      for (const fileItem of successfulFiles) {
        try {
          const documentData = {
            veiculo_id: vehicleId,
            tipo: getDocumentType(fileItem.file.name),
            nome_arquivo: fileItem.file.name,
            url: fileItem.url!,
            tamanho_arquivo: fileItem.file.size,
            tipo_mime: fileItem.file.type,
            origem: 'upload' as const,
          };

          const { error } = await supabase
            .from('frota_documentos')
            .insert([documentData]);

          if (error) {
            console.error('Erro ao salvar documento:', fileItem.file.name, error);
            errors.push(`${fileItem.file.name}: ${error.message}`);
          } else {
            savedCount++;
          }
        } catch (fileError: any) {
          console.error('Erro ao processar arquivo:', fileItem.file.name, fileError);
          errors.push(`${fileItem.file.name}: Erro ao processar arquivo`);
        }
      }

      // Apenas mostrar toast se realmente houve tentativa de salvar arquivos
      if (successfulFiles.length > 0) {
        // Mostrar resultado baseado no que foi salvo
        if (savedCount > 0 && errors.length === 0) {
          toast.success(`${savedCount} documento(s) adicionado(s) com sucesso!`);
        } else if (savedCount > 0 && errors.length > 0) {
          toast.success(`${savedCount} documento(s) salvos. ${errors.length} falharam.`);
          // Mostrar detalhes dos erros em um toast separado
          setTimeout(() => {
            toast.error(`Erros: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
          }, 1000);
        } else if (errors.length > 0) {
          toast.error(`Não foi possível salvar os documentos: ${errors.slice(0, 2).join(', ')}`);
        }
      }
      
      if (savedCount > 0) {
        // Recarregar lista apenas se houver documentos salvos
        setTimeout(() => {
          fetchDocuments();
        }, 500);
      }
    } catch (error) {
      console.error('Erro geral ao salvar documentos:', error);
      toast.error('Erro ao salvar documentos no sistema');
    } finally {
      setUploading(false);
    }
  }, [vehicleId, getDocumentType, fetchDocuments]);

  const getStatusBadge = useCallback((origem: string) => {
    const config = {
      upload: { color: 'bg-blue-100 text-blue-800', label: 'Upload Direto' },
      import: { color: 'bg-green-100 text-green-800', label: 'Importado' },
      external: { color: 'bg-purple-100 text-purple-800', label: 'Link Externo' },
    };
    
    const statusConfig = config[origem as keyof typeof config] || config.upload;
    
    return (
      <Badge className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    );
  }, []);

  const formatFileSize = useCallback((bytes?: number): string => {
    if (!bytes) return 'Tamanho desconhecido';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }, []);

  const handleDownload = useCallback((doc: VehicleDocument) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = doc.nome_arquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleDelete = useCallback(async (docId: string) => {
    try {
      const { error } = await supabase
        .from('frota_documentos')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      toast.success('Documento removido com sucesso!');
      fetchDocuments();
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      toast.error('Erro ao remover documento');
    }
  }, [fetchDocuments]);

  const externalDocs = useMemo(() => 
    documents.filter(doc => doc.origem === 'external'), 
    [documents]
  );

  const localDocs = useMemo(() => 
    documents.filter(doc => doc.origem !== 'external'), 
    [documents]
  );

  const showLinkedLoadingState = !loading && documents.length === 0 && searchingLinkedDocs;

  if (loading && documents.length === 0) {
    return (
      <Card className="p-3 md:p-6">
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Carregando documentos...
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-3 md:p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              Documentos do Veículo
            </CardTitle>
            
            {mode === 'edit' && (vehiclePlaca || vehicleChassi) && (
              <MigrateDocumentsButton
                vehicleId={vehicleId}
                vehiclePlaca={vehiclePlaca}
                vehicleChassi={vehicleChassi}
                onMigrated={fetchDocuments}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          
          {/* Upload de novos documentos */}
          {mode === 'edit' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">Upload de Documentos</h4>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                Adicione documentos relacionados a este veículo. Suportamos: PDF, DOC, DOCX, XLS, XLSX e imagens.
              </p>
              <DragDropUpload
                onFilesChange={handleFilesUploaded}
                bucketName="frotas_docs"
                maxFiles={10}
                maxSize={20 * 1024 * 1024} // 20MB
                acceptedTypes={[
                  'application/pdf',
                  'image/jpeg',
                  'image/jpg', 
                  'image/png',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ]}
                disabled={uploading}
                publicMode={true}
              />
            </div>
          )}

          {/* Lista de documentos */}
          <div className="space-y-3">
              {documents.length === 0 ? (
                showLinkedLoadingState ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/40">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                    <p className="text-sm">Buscando documentos vinculados...</p>
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      Os arquivos importados estão sendo localizados em segundo plano
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm">Nenhum documento encontrado</p>
                    {mode === 'edit' && (
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        Use a área de upload acima para adicionar documentos
                      </p>
                    )}
                  </div>
                )
              ) : (
                <div>
                  {/* Seção de documentos externos */}
                  {externalDocs.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-200">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <h4 className="text-sm font-medium text-purple-900">Documentos do Link Externo</h4>
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                          {externalDocs.length} arquivo(s)
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {externalDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-purple-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium truncate">{doc.nome_arquivo}</p>
                                  {getStatusBadge(doc.origem)}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-purple-600">
                                  <span>{getDocumentTypeLabel(doc.tipo)}</span>
                                  <span>{formatFileSize(doc.tamanho_arquivo)}</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(doc.created_at), { 
                                      addSuffix: true, 
                                      locale: ptBR 
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="gap-1 text-purple-700 hover:text-purple-800 hover:bg-purple-100"
                              >
                                <Download className="h-4 w-4" />
                                Baixar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seção de documentos locais */}
                  {localDocs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <h4 className="text-sm font-medium text-blue-900">Documentos Locais</h4>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          {localDocs.length} arquivo(s)
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {localDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium truncate">{doc.nome_arquivo}</p>
                                  {getStatusBadge(doc.origem)}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-blue-600">
                                  <span>{getDocumentTypeLabel(doc.tipo)}</span>
                                  <span>{formatFileSize(doc.tamanho_arquivo)}</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(doc.created_at), { 
                                      addSuffix: true, 
                                      locale: ptBR 
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="gap-1 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                              >
                                <Download className="h-4 w-4" />
                                Baixar
                              </Button>
                              {mode === 'edit' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(doc.id)}
                                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}