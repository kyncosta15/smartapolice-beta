
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar o corpo do email
      const emailBody = `
Nova mensagem de contato do site:

Nome: ${formData.name}
Telefone: ${formData.phone}
Email: ${formData.email}
Assunto: ${formData.subject}

Mensagem:
${formData.message}

---
Enviado em: ${new Date().toLocaleString('pt-BR')}
      `.trim();

      // Criar o link mailto
      const mailtoLink = `mailto:smartapolice@rcaldas.com.br?subject=${encodeURIComponent(`Contato do site - ${formData.subject}`)}&body=${encodeURIComponent(emailBody)}`;
      
      // Abrir o cliente de email
      window.location.href = mailtoLink;

      toast({
        title: "Email preparado",
        description: "Seu cliente de email será aberto para enviar a mensagem.",
      });

      // Limpar o formulário
      setFormData({
        name: '',
        phone: '',
        email: '',
        subject: '',
        message: ''
      });

    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar o formulário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">
            Entre em Contato
          </CardTitle>
          <p className="text-blue-700 mt-2">
            Estamos aqui para ajudar você com suas necessidades de seguro
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informações de Contato */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>
                <p className="text-gray-600">diretoria@rcaldas.com.br</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('mailto:diretoria@rcaldas.com.br')}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Telefone</h3>
                <p className="text-gray-600">(71) 98204-7208</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('tel:+5571982047208')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar Agora
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Empresa</h3>
                <p className="text-gray-600 font-medium">RCaldas</p>
                <p className="text-sm text-gray-500">Soluções em seguros e consultoria</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Horário de Atendimento</h3>
                <p className="text-gray-600">Segunda à Sexta: 8h às 17:30h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Contato */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Fale Conosco
            </CardTitle>
            <p className="text-gray-600">
              Envie sua mensagem e retornaremos em breve
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assunto
                </label>
                <select 
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um assunto</option>
                  <option value="Cotação de Seguro">Cotação de Seguro</option>
                  <option value="Dúvidas sobre Apólices">Dúvidas sobre Apólices</option>
                  <option value="Suporte Técnico">Suporte Técnico</option>
                  <option value="Reclamações">Reclamações</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem *
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full"
                  placeholder="Descreva sua necessidade ou dúvida..."
                  required
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Atendimento Especializado
            </h3>
            <p className="text-blue-700 mb-4">
              Nossa equipe está preparada para oferecer as melhores soluções em seguros para você e sua empresa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">Consultoria Gratuita</h4>
                <p className="text-blue-600">Análise completa das suas necessidades</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">Suporte 24h</h4>
                <p className="text-blue-600">Atendimento de emergência</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800">Melhores Preços</h4>
                <p className="text-blue-600">Cotações com as principais seguradoras</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
