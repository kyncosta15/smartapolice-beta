import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Truck, 
  Shield, 
  Home, 
  Phone, 
  MapPin, 
  Clock,
  User,
  Car
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AssistenciaRequest {
  tipo: 'guincho' | 'vidro' | 'residencial';
  placa?: string;
  solicitante_nome: string;
  solicitante_telefone: string;
  endereco: string;
  descricao_problema: string;
  urgencia: 'baixa' | 'media' | 'alta';
}

interface AssistenciaDashboardProps {
  loading?: boolean;
}

export function AssistenciaDashboard({ loading = false }: AssistenciaDashboardProps) {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<'guincho' | 'vidro' | 'residencial' | null>(null);
  const [formData, setFormData] = useState<Partial<AssistenciaRequest>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const services = [
    {
      id: 'guincho',
      title: 'Guincho',
      description: 'Solicitação de guincho para reboque do veículo',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'vidro',
      title: 'Assistência de Vidro',
      description: 'Reparo ou substituição de vidros do veículo',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    },
    {
      id: 'residencial',
      title: 'Assistência Residencial',
      description: 'Serviços de assistência domiciliar',
      icon: Home,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200'
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceSelect = (serviceId: 'guincho' | 'vidro' | 'residencial') => {
    setSelectedService(serviceId);
    setFormData({ tipo: serviceId });
  };

  const handleSubmit = async () => {
    if (!formData.solicitante_nome || !formData.solicitante_telefone || !formData.endereco || !formData.descricao_problema) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would send the request to your backend
      console.log('Solicitação de assistência:', formData);
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de assistência foi registrada com sucesso. Entraremos em contato em breve.",
      });

      // Reset form
      setFormData({});
      setSelectedService(null);
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Não foi possível registrar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceForm = () => {
    if (!selectedService) return null;

    const service = services.find(s => s.id === selectedService);
    if (!service) return null;

    return (
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <service.icon className={`h-5 w-5 ${service.color}`} />
              Solicitar {service.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Solicitante Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="solicitante_nome">Nome do Solicitante *</Label>
                <Input
                  id="solicitante_nome"
                  value={formData.solicitante_nome || ''}
                  onChange={(e) => handleInputChange('solicitante_nome', e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="solicitante_telefone">Telefone *</Label>
                <Input
                  id="solicitante_telefone"
                  value={formData.solicitante_telefone || ''}
                  onChange={(e) => handleInputChange('solicitante_telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* Vehicle Info (for guincho and vidro) */}
            {(selectedService === 'guincho' || selectedService === 'vidro') && (
              <div>
                <Label htmlFor="placa">Placa do Veículo</Label>
                <Input
                  id="placa"
                  value={formData.placa || ''}
                  onChange={(e) => handleInputChange('placa', e.target.value)}
                  placeholder="ABC1234"
                />
              </div>
            )}

            {/* Address */}
            <div>
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco || ''}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                placeholder="Endereço completo onde será prestado o serviço"
              />
            </div>

            {/* Problem Description */}
            <div>
              <Label htmlFor="descricao_problema">Descrição do Problema *</Label>
              <Textarea
                id="descricao_problema"
                value={formData.descricao_problema || ''}
                onChange={(e) => handleInputChange('descricao_problema', e.target.value)}
                placeholder="Descreva detalhadamente o problema e o tipo de assistência necessária"
                rows={4}
              />
            </div>

            {/* Urgency */}
            <div>
              <Label htmlFor="urgencia">Nível de Urgência</Label>
              <Select value={formData.urgencia || 'media'} onValueChange={(value) => handleInputChange('urgencia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa - Não há pressa</SelectItem>
                  <SelectItem value="media">Média - Normal</SelectItem>
                  <SelectItem value="alta">Alta - Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedService(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">Assistência 24 Horas</h2>
        <p className="text-gray-600 dark:text-muted-foreground">
          Solicite assistência para guincho, vidros ou serviços residenciais
        </p>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.id} className={`cursor-pointer transition-all hover:shadow-lg ${service.bgColor} dark:bg-card dark:border-border`}>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-white dark:bg-background rounded-full flex items-center justify-center mb-4">
                  <Icon className={`h-8 w-8 ${service.color}`} />
                </div>
                <CardTitle className="text-lg dark:text-foreground">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 dark:text-muted-foreground mb-4">
                  {service.description}
                </p>
                <Button 
                  onClick={() => handleServiceSelect(service.id as any)}
                  className="w-full"
                  variant="outline"
                >
                  Solicitar
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
              Central de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">0800 123 4567</p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                Disponível 24 horas por dia, 7 dias por semana
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Tempo médio de resposta: 30 minutos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card dark:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-foreground">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Cobertura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium dark:text-foreground">Região Metropolitana</p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                Atendemos toda a região metropolitana e principais rodovias
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-muted-foreground">
                <Car className="h-4 w-4" />
                <span>Raio de atendimento: 100km</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {renderServiceForm()}
    </div>
  );
}