import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Upload, 
  X, 
  FileText, 
  Car,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Share2,
  Eye,
  Download
} from 'lucide-react';

interface SinistrosMovimentacoesProps {
  vehicles: any[];
  onMovimentacaoCreated: (movimentacao: any) => void;
}

export function SinistrosMovimentacoes({ vehicles, onMovimentacaoCreated }: SinistrosMovimentacoesProps) {
  const [isNewMovimentacaoOpen, setIsNewMovimentacaoOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: '',
    placa_entrada: '',
    placa_saida: '',
    contrato_id: '',
    observacoes: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<{nf: File[], crlv: File[]}>({nf: [], crlv: []});

  // Mock data for demonstration
  const mockMovimentacoes = [
    {
      id: '1',
      tipo: 'ENTRADA',
      veiculo: { placa: 'ABC1D23', marca: 'FIAT', modelo: 'ARGO' },
      contrato_id: 'OBRA-778',
      data_movimentacao: '2025-01-15',
      status_autenticacao: 'AUTENTICADO',
      responsavel: 'João Silva',
      crlv_vencimento: '2025-06-15'
    },
    {
      id: '2',
      tipo: 'SUBSTITUICAO',
      veiculo_saida: { placa: 'XYZ9W87', marca: 'VOLKSWAGEN', modelo: 'SAVEIRO' },
      veiculo_entrada: { placa: 'DEF5G78', marca: 'FORD', modelo: 'RANGER' },
      contrato_id: 'OBRA-779',
      data_movimentacao: '2025-01-14',
      status_autenticacao: 'PENDENTE',
      responsavel: 'Maria Santos',
      token_link: 'https://app.com/auth/mov123'
    }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: 'nf' | 'crlv') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => ({ ...prev, [type]: [...prev[type], ...files] }));
  };

  const removeFile = (type: 'nf' | 'crlv', index: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const generateAuthLink = (movimentacaoId: string) => {
    const token = Math.random().toString(36).substr(2, 9);
    const link = `https://app.rcaldas.com.br/auth/movimentacao/${movimentacaoId}?token=${token}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(link);
    
    // In a real app, this would send via WhatsApp API
    alert(`Link copiado! Envie via WhatsApp para autenticação:\n\n${link}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newMovimentacao = {
      id: Date.now().toString(),
      ...formData,
      data_movimentacao: new Date().toISOString().split('T')[0],
      status_autenticacao: 'PENDENTE',
      token: Math.random().toString(36).substr(2, 9),
      documentos: {
        nf: uploadedFiles.nf.map(f => ({ nome: f.name, tamanho: f.size })),
        crlv: uploadedFiles.crlv.map(f => ({ nome: f.name, tamanho: f.size }))
      }
    };

    onMovimentacaoCreated(newMovimentacao);
    
    // Reset form
    setFormData({
      tipo: '',
      placa_entrada: '',
      placa_saida: '',
      contrato_id: '',
      observacoes: ''
    });
    setUploadedFiles({nf: [], crlv: []});
    setIsNewMovimentacaoOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'AUTENTICADO': 'bg-green-500',
      'PENDENTE': 'bg-yellow-500',
      'NEGADO': 'bg-red-500',
      'EXPIRADO': 'bg-gray-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'AUTENTICADO': 'Autenticado',
      'PENDENTE': 'Pendente',
      'NEGADO': 'Negado',
      'EXPIRADO': 'Expirado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      'ENTRADA': 'Entrada',
      'SAIDA': 'Saída',
      'INCLUSAO': 'Inclusão',
      'SUBSTITUICAO': 'Substituição'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Movimentações da Frota</h2>
          <p className="text-muted-foreground">
            Registre entrada, saída e substituição de veículos com autenticação por link
          </p>
        </div>
        
        <Dialog open={isNewMovimentacaoOpen} onOpenChange={setIsNewMovimentacaoOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nova Movimentação</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Movimentação */}
              <div>
                <Label htmlFor="tipo">Tipo de Movimentação</Label>
                <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada na Frota</SelectItem>
                    <SelectItem value="SAIDA">Saída da Frota</SelectItem>
                    <SelectItem value="INCLUSAO">Inclusão em Contrato</SelectItem>
                    <SelectItem value="SUBSTITUICAO">Substituição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.tipo === 'ENTRADA' || formData.tipo === 'INCLUSAO' || formData.tipo === 'SUBSTITUICAO') && (
                  <div>
                    <Label htmlFor="placa_entrada">Veículo de Entrada</Label>
                    <Select value={formData.placa_entrada} onValueChange={(value) => handleInputChange('placa_entrada', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.placa}>
                            {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(formData.tipo === 'SAIDA' || formData.tipo === 'SUBSTITUICAO') && (
                  <div>
                    <Label htmlFor="placa_saida">Veículo de Saída</Label>
                    <Select value={formData.placa_saida} onValueChange={(value) => handleInputChange('placa_saida', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.placa}>
                            {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Contract/Project */}
              <div>
                <Label htmlFor="contrato_id">Contrato/Obra</Label>
                <Input
                  id="contrato_id"
                  value={formData.contrato_id}
                  onChange={(e) => handleInputChange('contrato_id', e.target.value)}
                  placeholder="OBRA-778, CONTRATO-123, etc."
                />
              </div>

              {/* Document Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Nota Fiscal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload('nf')}
                      multiple
                    />
                    {uploadedFiles.nf.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile('nf', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">CRLV</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload('crlv')}
                      multiple
                    />
                    {uploadedFiles.crlv.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile('crlv', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Observations */}
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre a movimentação..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsNewMovimentacaoOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.tipo}>
                  Registrar Movimentação
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Movimentações Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Histórico de Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Veículo(s)</TableHead>
                <TableHead>Contrato/Obra</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status Auth.</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>CRLV Venc.</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMovimentacoes.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {getTipoLabel(mov.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {mov.tipo === 'SUBSTITUICAO' ? (
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-red-600">Saída:</span> {mov.veiculo_saida?.placa}
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600">Entrada:</span> {mov.veiculo_entrada?.placa}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{mov.veiculo?.placa}</p>
                        <p className="text-sm text-muted-foreground">
                          {mov.veiculo?.marca} {mov.veiculo?.modelo}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{mov.contrato_id}</TableCell>
                  <TableCell>{mov.data_movimentacao}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(mov.status_autenticacao)} text-white`}>
                      {getStatusLabel(mov.status_autenticacao)}
                    </Badge>
                  </TableCell>
                  <TableCell>{mov.responsavel}</TableCell>
                  <TableCell>
                    {mov.crlv_vencimento && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{mov.crlv_vencimento}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {mov.status_autenticacao === 'PENDENTE' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateAuthLink(mov.id)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Authentication Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Sobre a Autenticação por Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium">Gerar Link</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema gera link único com token de segurança
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium">Enviar WhatsApp</h4>
                <p className="text-sm text-muted-foreground">
                  Responsável recebe link via WhatsApp para autenticar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium">Confirmar</h4>
                <p className="text-sm text-muted-foreground">
                  Assinatura eletrônica com CPF e confirmação
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Segurança e Auditoria</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Todos os links têm validade de 7 dias e são registrados com IP, User-Agent e timestamp. 
                  A trilha de auditoria é mantida para conformidade com LGPD.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}