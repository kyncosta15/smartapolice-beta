import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Send, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ColaboradorSolicitacao = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nomeColaborador: '',
    cpfColaborador: '',
    telefone: '',
    tipoSolicitacao: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Solicitação enviada!",
      description: `Protocolo: SB${Date.now()}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SmartBenefícios - Portal do Colaborador</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Nova Solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                placeholder="Seu nome completo" 
                value={formData.nomeColaborador}
                onChange={(e) => setFormData(prev => ({...prev, nomeColaborador: e.target.value}))}
                required 
              />
              <Input 
                placeholder="WhatsApp" 
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({...prev, telefone: e.target.value}))}
                required 
              />
              <Select value={formData.tipoSolicitacao} onValueChange={(value) => setFormData(prev => ({...prev, tipoSolicitacao: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de solicitação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inclusao_dependente">Inclusão de Dependente</SelectItem>
                  <SelectItem value="segunda_via">2ª Via Carteirinha</SelectItem>
                  <SelectItem value="duvida">Dúvida</SelectItem>
                </SelectContent>
              </Select>
              <Textarea 
                placeholder="Observações" 
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({...prev, observacoes: e.target.value}))}
              />
              <Button type="submit" className="w-full">Enviar Solicitação</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};