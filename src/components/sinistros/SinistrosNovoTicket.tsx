import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { 
  Plus, 
  Upload, 
  X, 
  FileText, 
  Camera, 
  AlertTriangle,
  CheckCircle,
  Car,
  User,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';

interface SinistrosNovoTicketProps {
  vehicles: any[];
  policies: ParsedPolicyData[];
  onTicketCreated: (ticket: any) => void;
}

export function SinistrosNovoTicket({ vehicles, policies, onTicketCreated }: SinistrosNovoTicketProps) {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [formData, setFormData] = useState({
    tipo_evento: '',
    gravidade: '',
    data_ocorrencia: '',
    uf_ocorrencia: '',
    municipio_ocorrencia: '',
    condutor_nome: '',
    condutor_cpf: '',
    condutor_cnh: '',
    resumo_ocorrencia: '',
    tem_bo: false,
    tem_terceiros: false,
    valor_estimado: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processDocuments = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const mockExtractedData = {
        data_ocorrencia: '2025-01-15',
        uf_ocorrencia: 'SP',
        municipio_ocorrencia: 'São Paulo',
        condutor_nome: 'João Silva',
        condutor_cpf: '123.456.789-00',
        tipo_evento: 'COLISAO',
        gravidade: 'MEDIA',
        valor_estimado: '25000',
        confidence: 0.87,
        needs_review: false
      };
      
      setExtractedData(mockExtractedData);
      
      // Fill form with extracted data
      setFormData(prev => ({
        ...prev,
        ...mockExtractedData,
        valor_estimado: (parseFloat(mockExtractedData.valor_estimado) / 100).toString() // Convert from centavos
      }));
      
      setIsProcessing(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTicket = {
      id: Date.now().toString(),
      ticket_id: `TKT-${Date.now()}`,
      numero_sinistro: null,
      data_abertura: new Date().toISOString().split('T')[0],
      status: 'ABERTO',
      ...formData,
      veiculo: vehicles.find(v => v.id === selectedVehicle),
      apolice: policies.find(p => p.id === selectedPolicy),
      documentos: uploadedFiles.map(file => ({
        nome: file.name,
        tipo: file.type,
        tamanho: file.size
      })),
      extracted_data: extractedData
    };

    onTicketCreated(newTicket);
    
    // Reset form
    setFormData({
      tipo_evento: '',
      gravidade: '',
      data_ocorrencia: '',
      uf_ocorrencia: '',
      municipio_ocorrencia: '',
      condutor_nome: '',
      condutor_cpf: '',
      condutor_cnh: '',
      resumo_ocorrencia: '',
      tem_bo: false,
      tem_terceiros: false,
      valor_estimado: ''
    });
    setSelectedVehicle('');
    setSelectedPolicy('');
    setUploadedFiles([]);
    setExtractedData(null);
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const relatedPolicies = policies.filter(p => 
    selectedVehicleData && (
      p.vehicleDetails?.plate === selectedVehicleData.placa ||
      p.insuredName === selectedVehicleData.cliente?.nome
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Abertura de Novo Ticket/Sinistro</h2>
        <p className="text-muted-foreground">
          Preencha os dados do sinistro. Você pode anexar documentos para extração automática.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle and Policy Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Veículo Envolvido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="veiculo">Selecione o Veículo</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar por placa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVehicleData && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedVehicleData.placa}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedVehicleData.marca} {selectedVehicleData.modelo}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cliente: {selectedVehicleData.cliente?.nome}
                  </p>
                </div>
              )}

              {relatedPolicies.length > 0 && (
                <div>
                  <Label htmlFor="apolice">Apólice Relacionada</Label>
                  <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a apólice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {relatedPolicies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.policyNumber} - {policy.insurer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="documents">Anexar Documentos</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  BO, fotos, laudos, CRLV, etc.
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={processDocuments}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Processando...' : 'Extrair Dados com IA'}
                  </Button>
                </div>
              )}

              {extractedData && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Dados extraídos com {Math.round(extractedData.confidence * 100)}% de confiança
                    </span>
                  </div>
                  <p className="text-xs text-green-700">
                    Os campos abaixo foram preenchidos automaticamente. Revise antes de enviar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detalhes do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo_evento">Tipo de Evento</Label>
                <Select value={formData.tipo_evento} onValueChange={(value) => handleInputChange('tipo_evento', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLISAO">Colisão</SelectItem>
                    <SelectItem value="ROUBO">Roubo</SelectItem>
                    <SelectItem value="FURTO">Furto</SelectItem>
                    <SelectItem value="ALAGAMENTO">Alagamento</SelectItem>
                    <SelectItem value="INCENDIO">Incêndio</SelectItem>
                    <SelectItem value="VIDRO">Vidro</SelectItem>
                    <SelectItem value="TERCEIROS">Terceiros</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gravidade">Gravidade</Label>
                <Select value={formData.gravidade} onValueChange={(value) => handleInputChange('gravidade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
                <Input
                  id="valor_estimado"
                  type="number"
                  step="0.01"
                  value={formData.valor_estimado}
                  onChange={(e) => handleInputChange('valor_estimado', e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="data_ocorrencia">Data da Ocorrência</Label>
                <Input
                  id="data_ocorrencia"
                  type="date"
                  value={formData.data_ocorrencia}
                  onChange={(e) => handleInputChange('data_ocorrencia', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="uf_ocorrencia">UF</Label>
                <Input
                  id="uf_ocorrencia"
                  value={formData.uf_ocorrencia}
                  onChange={(e) => handleInputChange('uf_ocorrencia', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="municipio_ocorrencia">Município</Label>
                <Input
                  id="municipio_ocorrencia"
                  value={formData.municipio_ocorrencia}
                  onChange={(e) => handleInputChange('municipio_ocorrencia', e.target.value)}
                  placeholder="São Paulo"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Condutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="condutor_nome">Nome do Condutor</Label>
                <Input
                  id="condutor_nome"
                  value={formData.condutor_nome}
                  onChange={(e) => handleInputChange('condutor_nome', e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="condutor_cpf">CPF</Label>
                <Input
                  id="condutor_cpf"
                  value={formData.condutor_cpf}
                  onChange={(e) => handleInputChange('condutor_cpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <Label htmlFor="condutor_cnh">Nº CNH</Label>
                <Input
                  id="condutor_cnh"
                  value={formData.condutor_cnh}
                  onChange={(e) => handleInputChange('condutor_cnh', e.target.value)}
                  placeholder="CNH do condutor"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="resumo_ocorrencia">Resumo da Ocorrência</Label>
              <Textarea
                id="resumo_ocorrencia"
                value={formData.resumo_ocorrencia}
                onChange={(e) => handleInputChange('resumo_ocorrencia', e.target.value)}
                placeholder="Descreva como ocorreu o sinistro..."
                rows={4}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tem_bo"
                  checked={formData.tem_bo}
                  onCheckedChange={(checked) => handleInputChange('tem_bo', checked)}
                />
                <Label htmlFor="tem_bo">Há Boletim de Ocorrência</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tem_terceiros"
                  checked={formData.tem_terceiros}
                  onCheckedChange={(checked) => handleInputChange('tem_terceiros', checked)}
                />
                <Label htmlFor="tem_terceiros">Envolve Terceiros</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Salvar Rascunho
          </Button>
          <Button 
            type="submit" 
            disabled={!selectedVehicle || !formData.tipo_evento || !formData.data_ocorrencia}
          >
            <Plus className="h-4 w-4 mr-2" />
            Abrir Ticket/Sinistro
          </Button>
        </div>
      </form>
    </div>
  );
}