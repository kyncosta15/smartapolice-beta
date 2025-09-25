import React, { useState } from 'react';
import { Link, Copy, Calendar, Share2, MessageSquare } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { usePublicFleetTokens } from '@/hooks/usePublicFleetTokens';
import { useToast } from '@/hooks/use-toast';

interface PublicLinkGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublicLinkGenerator({ open, onOpenChange }: PublicLinkGeneratorProps) {
  const { generatePublicLink, generating } = usePublicFleetTokens();
  const { toast } = useToast();
  const [generatedLink, setGeneratedLink] = useState<{
    link: string;
    whatsappMessage: string;
    token: string;
  } | null>(null);

  const handleGenerateLink = async () => {
    try {
      const result = await generatePublicLink(0); // Link permanente
      setGeneratedLink({
        link: result.link,
        whatsappMessage: result.whatsappMessage,
        token: result.token
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${type} copiado!`,
        description: 'Conteúdo copiado para a área de transferência',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar para a área de transferência',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setGeneratedLink(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Gerar Link Externo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedLink ? (
            <>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Link className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-blue-900">Link Permanente para Solicitações</h3>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>• O link permite que outros setores solicitem alterações na frota</p>
                        <p>• Não é necessário fazer login para preencher o formulário</p>
                        <p>• Todas as solicitações passam por aprovação antes de serem executadas</p>
                        <p>• Você pode enviar o link por WhatsApp, email ou outros meios</p>
                        <p>• <strong>Este link não expira e pode ser usado sempre</strong></p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerateLink} disabled={generating}>
                  {generating ? 'Gerando...' : 'Gerar Link Permanente'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Link Permanente Gerado!</h3>
                  <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                    <Link className="h-3 w-3" />
                    Link Permanente
                  </Badge>
                </div>

                {/* Link Público */}
                <div className="space-y-2">
                  <Label>Link Permanente</Label>
                  <div className="flex gap-2">
                    <Input value={generatedLink.link} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedLink.link, 'Link')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open(generatedLink.whatsappMessage, '_blank')}
                    className="gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(generatedLink.link, 'Link')}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Link
                  </Button>
                </div>

                {/* Informações do Token */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-sm text-green-700 space-y-1">
                      <div><strong>Token:</strong> {generatedLink.token}</div>
                      <div><strong>Status:</strong> Permanente - Não expira</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={() => setGeneratedLink(null)}>
                  Gerar Novo Link Permanente
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}