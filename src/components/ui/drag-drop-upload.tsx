import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
  uploadProgress: number;
  uploaded: boolean;
  error?: string;
  url?: string;
}

interface DragDropUploadProps {
  onFilesChange: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number;
  bucketName?: string;
  acceptedTypes?: string[];
  disabled?: boolean;
  publicMode?: boolean;
  publicPath?: string;
}

export function DragDropUpload({
  onFilesChange,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  bucketName = 'fleet-documents',
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false,
  publicMode = false,
  publicPath = 'public'
}: DragDropUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileIdCounter = useRef(0);

  const uploadFile = useCallback(async (fileWithPreview: FileWithPreview): Promise<FileWithPreview> => {
    // Para modo público, não verificar autenticação
    if (!publicMode && !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Criar path único para o arquivo
      const fileExt = fileWithPreview.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      // Para modo público, usar publicPath; senão usar user.id
      const filePath = publicMode 
        ? `${publicPath}/${fileName}` 
        : `${user?.id}/${fileName}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileWithPreview.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }

      console.log('✅ Upload realizado:', filePath);

      // Obter URL do arquivo
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        ...fileWithPreview,
        uploadProgress: 100,
        uploaded: true,
        url: urlData.publicUrl,
        error: undefined,
      };
    } catch (error: any) {
      console.error('💥 Erro no uploadFile:', error);
      return {
        ...fileWithPreview,
        uploadProgress: 0,
        uploaded: false,
        error: error.message,
      };
    }
  }, [user?.id, bucketName, publicMode, publicPath]);

  const processFiles = useCallback(async (acceptedFiles: File[]) => {
    console.log('🔄 Processando arquivos:', { 
      quantidade: acceptedFiles.length, 
      publicMode, 
      bucketName 
    });

    // Para modo público, não verificar autenticação
    if (!publicMode && !user?.id) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para fazer upload de arquivos',
        variant: 'destructive',
      });
      return;
    }

    // Verificar limites
    if (files.length + acceptedFiles.length > maxFiles) {
      toast({
        title: 'Muitos arquivos',
        description: `Máximo ${maxFiles} arquivos permitidos`,
        variant: 'destructive',
      });
      return;
    }

    // Criar objetos FileWithPreview
    const newFilesWithPreview: FileWithPreview[] = acceptedFiles.map(file => ({
      file,
      id: `file-${++fileIdCounter.current}`,
      uploadProgress: 0,
      uploaded: false,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    const updatedFiles = [...files, ...newFilesWithPreview];
    setFiles(updatedFiles);
    setUploading(true);

    try {
      // Upload dos arquivos em paralelo
      const uploadPromises = newFilesWithPreview.map(async (fileWithPreview) => {
        // Atualizar progresso para 50% (simulando inicio do upload)
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === fileWithPreview.id 
              ? { ...f, uploadProgress: 50 }
              : f
          )
        );

        const result = await uploadFile(fileWithPreview);
        
        // Atualizar estado do arquivo
        setFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === fileWithPreview.id ? result : f
          )
        );

        return result;
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: 'Upload concluído',
        description: `${newFilesWithPreview.length} arquivo(s) enviado(s) com sucesso`,
      });
      
      console.log('✅ Upload concluído!', {
        totalFiles: newFilesWithPreview.length,
        uploadedFiles: updatedFiles.filter(f => f.uploaded),
        allFiles: updatedFiles
      });
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: 'Alguns arquivos não puderam ser enviados',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [files, maxFiles, user?.id, toast, uploadFile, publicMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(rejection => {
          rejection.errors.forEach(error => {
            toast({
              title: 'Arquivo rejeitado',
              description: `${rejection.file.name}: ${error.message}`,
              variant: 'destructive',
            });
          });
        });
      }
      
      if (acceptedFiles.length > 0) {
        processFiles(acceptedFiles);
      }
    },
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    disabled: disabled || uploading,
    multiple: true,
  });

  const removeFile = useCallback((fileId: string) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(f => f.id !== fileId);
      onFilesChange(updatedFiles);
      return updatedFiles;
    });
  }, [onFilesChange]);

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Notificar parent component sobre mudanças nos arquivos
  React.useEffect(() => {
    onFilesChange(files);
  }, [files, onFilesChange]);

  // Mostrar lista de arquivos no componente de upload
  const hasUploadedFiles = files.some(f => f.uploaded);

  return (
    <div className="space-y-4">
      {/* Área de Drop */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Upload className={`h-8 w-8 transition-colors ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {uploading 
                ? 'Enviando arquivos...'
                : isDragActive 
                  ? 'Solte os arquivos aqui'
                  : 'Arraste arquivos aqui ou clique para selecionar'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedTypes.includes('application/pdf') ? 'PDF, ' : ''}
              {acceptedTypes.some(t => t.startsWith('image/')) ? 'JPG, PNG, WebP' : ''}
              {' '}- Máximo {formatFileSize(maxSize)} por arquivo
            </p>
          </div>

          {files.length > 0 && (
            <Badge variant="outline" className="mt-2">
              {files.filter(f => f.uploaded).length}/{files.length} arquivos enviados
            </Badge>
          )}
        </div>
      </div>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            Arquivos {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileWithPreview) => (
              <div 
                key={fileWithPreview.id} 
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
              >
                {/* Preview ou Ícone */}
                <div className="flex-shrink-0">
                  {fileWithPreview.preview ? (
                    <img 
                      src={fileWithPreview.preview} 
                      alt="Preview" 
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    getFileIcon(fileWithPreview.file)
                  )}
                </div>

                {/* Informações do Arquivo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {fileWithPreview.file.name}
                    </p>
                    {fileWithPreview.uploaded ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : fileWithPreview.error ? (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(fileWithPreview.file.size)}
                    </span>
                    
                    {fileWithPreview.uploaded && (
                      <span className="text-xs text-green-600">
                        Enviado
                      </span>
                    )}
                    
                    {!fileWithPreview.uploaded && !fileWithPreview.error && (
                      <div className="flex-1 max-w-24">
                        <Progress value={fileWithPreview.uploadProgress} className="h-1" />
                      </div>
                    )}
                  </div>

                  {fileWithPreview.error && (
                    <p className="text-xs text-destructive mt-1">
                      {fileWithPreview.error}
                    </p>
                  )}
                </div>

                {/* Botão Remover */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileWithPreview.id)}
                  disabled={uploading}
                  className="p-1 h-8 w-8 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumo dos uploads bem-sucedidos */}
      {hasUploadedFiles && !uploading && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">
              {files.filter(f => f.uploaded).length} arquivo(s) enviado(s) com sucesso
            </span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Total: {formatFileSize(files.filter(f => f.uploaded).reduce((total, f) => total + f.file.size, 0))}
          </div>
        </div>
      )}
    </div>
  );
}