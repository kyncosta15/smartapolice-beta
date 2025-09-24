import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, User, FileText, Upload, Send, Download } from 'lucide-react';
import { StatusHistoryPanelProps } from '@/types/status-stepper';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const StatusHistoryPanel: React.FC<StatusHistoryPanelProps> = ({
  isOpen,
  onClose,
  selectedStep,
  history,
  onChangeStatus,
  readOnly = false,
  currentStatus
}) => {
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const stepHistory = selectedStep 
    ? history.filter(event => event.to_status === selectedStep.key)
    : [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      toast({
        title: "Limite excedido",
        description: "Você pode anexar no máximo 5 arquivos",
        variant: "destructive"
      });
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedStep || !onChangeStatus) return;
    
    if (selectedStep.key === currentStatus && !note.trim() && files.length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Adicione uma observação ou anexo para registrar o evento",
        variant: "default"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onChangeStatus(selectedStep.key, note.trim() || undefined, files);
      setNote('');
      setFiles([]);
      toast({
        title: "Status atualizado",
        description: `Ticket movido para: ${selectedStep.label}`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canMoveToStatus = selectedStep && selectedStep.key !== currentStatus && !readOnly;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-lg z-50 overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">
                    {selectedStep?.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Histórico e ações do status
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-6">
                    {/* Timeline de Eventos */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Histórico de Eventos
                      </h3>
                      
                      {stepHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum evento registrado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {stepHistory.map((event, index) => (
                            <div
                              key={event.id}
                              className="relative pl-6 pb-4 border-l-2 border-muted last:border-l-0 last:pb-0"
                            >
                              <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {event.from_status ? 
                                      `De: ${event.from_status} → Para: ${event.to_status}` : 
                                      `Status: ${event.to_status}`
                                    }
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                                  </span>
                                </div>
                                
                                {event.user_name && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    {event.user_name}
                                  </div>
                                )}
                                
                                {event.note && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <FileText className="w-3 h-3 mt-0.5 text-muted-foreground" />
                                    <p className="flex-1">{event.note}</p>
                                  </div>
                                )}
                                
                                {event.attachments && event.attachments.length > 0 && (
                                  <div className="space-y-1">
                                    {event.attachments.map((attachment, attachIndex) => (
                                      <div
                                        key={attachIndex}
                                        className="flex items-center gap-2 text-xs bg-muted p-2 rounded"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span className="flex-1 truncate">{attachment.name}</span>
                                        <span className="text-muted-foreground">
                                          {(attachment.size / 1024).toFixed(1)}KB
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    {!readOnly && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">
                            {canMoveToStatus ? 
                              `Mover para: ${selectedStep?.label}` : 
                              'Adicionar Observação'
                            }
                          </h3>
                          
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Adicione uma observação sobre este status..."
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              rows={3}
                            />
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Anexos (máx. 5 arquivos)
                              </label>
                              <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="w-full"
                                disabled={files.length >= 5}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Selecionar Arquivos
                              </Button>
                              
                              {files.length > 0 && (
                                <div className="space-y-2">
                                  {files.map((file, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                    >
                                      <span className="truncate">{file.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <Button
                              onClick={handleSubmit}
                              disabled={isSubmitting || (!note.trim() && files.length === 0)}
                              className="w-full"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {isSubmitting ? 'Processando...' : 
                               canMoveToStatus ? 'Mover Status' : 'Adicionar Observação'}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};