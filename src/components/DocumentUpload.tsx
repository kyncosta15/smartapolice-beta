import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Progress component não disponível - remover import
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

interface DocumentUploadProps {
  onFilesChange: (files: Array<{ name: string; url: string; size: number }>) => void;
  empresaId: string;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
}

export default function DocumentUpload({ 
  onFilesChange, 
  empresaId,
  maxFiles = 5,
  maxSizeInMB = 10,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
}: DocumentUploadProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: DocumentFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0,
    }));

    // Verificar limite de arquivos
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: 'Limite de arquivos excedido',
        description: `Você pode enviar no máximo ${maxFiles} arquivos`,
        variant: 'destructive',
      });
      return;
    }

    // Verificar tamanho dos arquivos
    const oversizedFiles = newFiles.filter(f => f.file.size > maxSizeInMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'Arquivo muito grande',
        description: `Arquivos devem ter no máximo ${maxSizeInMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    // Iniciar upload dos novos arquivos
    newFiles.forEach(uploadFile);
  }, [files, maxFiles, maxSizeInMB, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    disabled: files.length >= maxFiles,
  });

  const uploadFile = async (documentFile: DocumentFile) => {
    try {
      // Atualizar status para uploading
      setFiles(prev => prev.map(f => 
        f.id === documentFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const fileName = `${empresaId}/${Date.now()}-${documentFile.file.name}`;
      
      // Upload para o bucket client-documents
      const { data, error } = await supabase.storage
        .from('client-documents')
        .upload(fileName, documentFile.file);

      if (error) throw error;

      // Obter URL pública (mesmo sendo bucket privado, precisamos da URL para referência)
      const { data: { publicUrl } } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName);

      // Atualizar status para success
      setFiles(prev => prev.map(f => 
        f.id === documentFile.id 
          ? { ...f, status: 'success', progress: 100, url: publicUrl }
          : f
      ));

      // Notificar parent component sobre a mudança
      updateParent();

    } catch (error: any) {
      console.error('Upload error:', error);
      
      setFiles(prev => prev.map(f => 
        f.id === documentFile.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));

      toast({
        title: 'Erro no upload',
        description: `Falha ao enviar ${documentFile.file.name}`,
        variant: 'destructive',
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    updateParent();
  };

  const updateParent = () => {
    const successfulFiles = files
      .filter(f => f.status === 'success' && f.url)
      .map(f => ({
        name: f.file.name,
        url: f.url!,
        size: f.file.size,
      }));
    
    onFilesChange(successfulFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: DocumentFile['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'uploading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
              }
              ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            
            {files.length >= maxFiles ? (
              <p className="text-muted-foreground">
                Limite de {maxFiles} arquivos atingido
              </p>
            ) : isDragActive ? (
              <p className="text-primary font-medium">
                Solte os arquivos aqui...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-sm text-muted-foreground">
                  Máximo {maxFiles} arquivos, até {maxSizeInMB}MB cada
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: {acceptedTypes.join(', ')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">
            Documentos ({files.length}/{maxFiles})
          </h4>
          
          {files.map((file) => (
            <Card key={file.id} className={`${getStatusColor(file.status)} border`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(file.status)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.file.size)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {file.status === 'uploading' ? 'Enviando...' : 
                           file.status === 'success' ? 'Enviado' :
                           file.status === 'error' ? 'Erro' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {file.status === 'error' && file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                    disabled={file.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}