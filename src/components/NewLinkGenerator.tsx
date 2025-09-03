// Novo componente para gerar links de solicitação

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Link as LinkIcon, 
  Copy, 
  MessageCircle,
  Calendar,
  User,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LinkData {
  link: string;
  whatsappMessage: string;
  expiresAt: string;
}

export const NewLinkGenerator: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [validityDays, setValidityDays] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<LinkData | null>(null);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleGenerateLink = async () => {
    if (!cpf.trim()) {
      toast.error('Digite o CPF do colaborador');
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-link', {
        body: {
          employeeCpf: cpf.replace(/\D/g, ''), // Remove formatação
          validityDays
        }
      });

      if (error) throw error;

      if (data.ok) {
        setGeneratedLink(data.data);
        toast.success('Link gerado com sucesso!');
      } else {
        throw new Error(data.error?.message || 'Erro ao gerar link');
      }
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado!`);
  };

  const openWhatsApp = () => {
    if (!generatedLink) return;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(generatedLink.whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Formulário para gerar link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Gerar Link de Solicitação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF do Colaborador *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                maxLength={14}
              />
            </div>
            
            <div>
              <Label htmlFor="validity">Validade (dias)</Label>
              <Input
                id="validity"
                type="number"
                min={1}
                max={30}
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerateLink}
            disabled={isGenerating || !cpf.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando Link...
              </div>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                Gerar Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado do link gerado */}
      {generatedLink && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Link Gerado com Sucesso!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Calendar className="h-4 w-4" />
              <span>
                Expira em: {new Date(generatedLink.expiresAt).toLocaleString('pt-BR')}
              </span>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-800">Link da Solicitação:</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={generatedLink.link}
                  readOnly
                  className="bg-white border-green-300"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedLink.link, 'Link')}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-800">Mensagem para WhatsApp:</Label>
              <div className="mt-1">
                <Textarea
                  value={generatedLink.whatsappMessage}
                  readOnly
                  rows={3}
                  className="bg-white border-green-300"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedLink.whatsappMessage, 'Mensagem')}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Mensagem
                  </Button>
                  <Button
                    size="sm"
                    onClick={openWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Abrir WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 text-lg">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <p>1. Digite o CPF do colaborador que precisa fazer uma solicitação</p>
          <p>2. Defina a validade do link (recomendado: 7 dias)</p>
          <p>3. Clique em "Gerar Link" para criar um link personalizado</p>
          <p>4. Envie o link ou mensagem para o colaborador via WhatsApp</p>
          <p>5. O colaborador preencherá o formulário e receberá um protocolo</p>
        </CardContent>
      </Card>
    </div>
  );
};