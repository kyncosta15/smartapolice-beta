import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  RefreshCw,
  Upload,
  Download,
  Bell,
  Settings,
  Eye,
  X
} from 'lucide-react';

interface SinistrosCRLVProps {
  vehicles: any[];
  onCRLVUpdated: (crlv: any) => void;
}

export function SinistrosCRLV({ vehicles, onCRLVUpdated }: SinistrosCRLVProps) {
  const [isAPIConsultaOpen, setIsAPIConsultaOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isConsulting, setIsConsulting] = useState(false);
  const [searchPlaca, setSearchPlaca] = useState('');

  // Mock CRLV data
  const mockCRLVData = [
    {
      id: '1',
      placa: 'ABC1D23',
      veiculo: { marca: 'FIAT', modelo: 'ARGO', ano: 2022 },
      situacao: 'REGULAR',
      vencimento: '2025-06-15',
      fonte: 'CRLV_API',
      data_consulta: '2025-01-15',
      arquivo_url: '/uploads/crlv-abc1d23.pdf',
      alertas_configurados: true,
      dias_para_vencimento: 156
    },
    {
      id: '2',
      placa: 'DEF5G78',
      veiculo: { marca: 'FORD', modelo: 'RANGER', ano: 2021 },
      situacao: 'VENCIDO',
      vencimento: '2025-01-10',
      fonte: 'UPLOAD',
      data_consulta: null,
      arquivo_url: '/uploads/crlv-def5g78.pdf',
      alertas_configurados: false,
      dias_para_vencimento: -5
    },
    {
      id: '3',
      placa: 'GHI9J01',
      veiculo: { marca: 'VOLKSWAGEN', modelo: 'SAVEIRO', ano: 2020 },
      situacao: 'PENDENTE',
      vencimento: '2025-02-28',
      fonte: 'CRLV_API',
      data_consulta: '2025-01-14',
      arquivo_url: null,
      alertas_configurados: true,
      dias_para_vencimento: 44
    }
  ];

  const filteredCRLV = mockCRLVData;

  const getSituacaoColor = (situacao: string) => {
    const colors = {
      'REGULAR': 'bg-green-500',
      'VENCIDO': 'bg-red-500',
      'PENDENTE': 'bg-yellow-500',
      'EM_PROCESSO': 'bg-blue-500'
    };
    return colors[situacao as keyof typeof colors] || 'bg-gray-500';
  };

  const getSituacaoLabel = (situacao: string) => {
    const labels = {
      'REGULAR': 'Regular',
      'VENCIDO': 'Vencido',
      'PENDENTE': 'Pendente',
      'EM_PROCESSO': 'Em Processo'
    };
    return labels[situacao as keyof typeof labels] || situacao;
  };

  const getAlertaStatus = (diasParaVencimento: number) => {
    if (diasParaVencimento < 0) return { color: 'text-red-600', label: 'VENCIDO' };
    if (diasParaVencimento <= 7) return { color: 'text-red-600', label: 'CRÍTICO' };
    if (diasParaVencimento <= 30) return { color: 'text-yellow-600', label: 'ATENÇÃO' };
    return { color: 'text-green-600', label: 'OK' };
  };

  const consultarCRLVAPI = async (placa: string) => {
    setIsConsulting(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        placa,
        renavam: '12345678901',
        situacao: 'REGULAR',
        vencimento: '2025-08-15',
        fonte: 'CRLV_API',
        data_consulta: new Date().toISOString().split('T')[0]
      };
      
      onCRLVUpdated(mockResult);
      setIsConsulting(false);
      setIsAPIConsultaOpen(false);
    }, 2000);
  };

  const configurarAlertas = (crlvId: string) => {
    // Mock alert configuration
    alert(`Alertas configurados para o CRLV ID: ${crlvId}\n\nNotificações serão enviadas em:\n- 30 dias antes do vencimento\n- 15 dias antes do vencimento\n- 7 dias antes do vencimento\n- No dia do vencimento`);
  };

  const uploadCRLV = (file: File, placa: string) => {
    // Mock file upload
    const mockUpload = {
      placa,
      arquivo_url: `/uploads/crlv-${placa.toLowerCase()}.pdf`,
      fonte: 'UPLOAD',
      data_upload: new Date().toISOString().split('T')[0]
    };
    
    onCRLVUpdated(mockUpload);
    setIsUploadModalOpen(false);
    setSelectedVehicle(null);
  };

  // Calculate summary stats
  const totalCRLV = filteredCRLV.length;
  const vencidos = filteredCRLV.filter(c => c.dias_para_vencimento < 0).length;
  const vencendoEm30Dias = filteredCRLV.filter(c => c.dias_para_vencimento >= 0 && c.dias_para_vencimento <= 30).length;
  const regulares = filteredCRLV.filter(c => c.situacao === 'REGULAR' && c.dias_para_vencimento > 30).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestão de CRLV</h2>
          <p className="text-muted-foreground">
            Consulta, upload e monitoramento de vencimentos do CRLV
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAPIConsultaOpen} onOpenChange={setIsAPIConsultaOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Consultar API
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Consultar CRLV via API</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="placa-consulta">Placa do Veículo</Label>
                  <Input
                    id="placa-consulta"
                    placeholder="ABC1D23"
                    value={searchPlaca}
                    onChange={(e) => setSearchPlaca(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setIsAPIConsultaOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => consultarCRLVAPI(searchPlaca)}
                    disabled={!searchPlaca || isConsulting}
                  >
                    {isConsulting ? 'Consultando...' : 'Consultar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload CRLV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de CRLV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="veiculo-upload">Selecione o Veículo</Label>
                  <Select onValueChange={(value) => setSelectedVehicle(vehicles.find(v => v.id === value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o veículo..." />
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
                
                {selectedVehicle && (
                  <div>
                    <Label htmlFor="arquivo-crlv">Arquivo CRLV</Label>
                    <Input
                      id="arquivo-crlv"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadCRLV(file, selectedVehicle.placa);
                      }}
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total CRLVs</span>
            </div>
            <p className="text-2xl font-bold mt-2">{totalCRLV}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Regulares</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">{regulares}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Vencendo (30d)</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{vencendoEm30Dias}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Vencidos</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{vencidos}</p>
          </CardContent>
        </Card>
      </div>

      {/* CRLV Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Status dos CRLVs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Dias para Venc.</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Alertas</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCRLV.map((crlv) => {
                const alertaStatus = getAlertaStatus(crlv.dias_para_vencimento);
                
                return (
                  <TableRow key={crlv.id}>
                    <TableCell className="font-medium">{crlv.placa}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {crlv.veiculo.marca} {crlv.veiculo.modelo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {crlv.veiculo.ano}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getSituacaoColor(crlv.situacao)} text-white`}>
                        {getSituacaoLabel(crlv.situacao)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{crlv.vencimento}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${alertaStatus.color}`}>
                        {crlv.dias_para_vencimento < 0 
                          ? `${Math.abs(crlv.dias_para_vencimento)}d atraso`
                          : `${crlv.dias_para_vencimento}d`
                        }
                      </span>
                      <div>
                        <Badge variant="outline" className={`text-xs ${alertaStatus.color}`}>
                          {alertaStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {crlv.fonte === 'CRLV_API' ? 'API' : 'Upload'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {crlv.alertas_configurados ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <Bell className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {crlv.arquivo_url && (
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => configurarAlertas(crlv.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => consultarCRLVAPI(crlv.placa)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Integração com API do CRLV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Funcionalidades da API</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Consulta automática de situação do CRLV</li>
                <li>• Verificação de vencimento em tempo real</li>
                <li>• Histórico de consultas e atualizações</li>
                <li>• Alertas automáticos por e-mail e WhatsApp</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Configuração de Alertas</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 30 dias antes do vencimento</li>
                <li>• 15 dias antes do vencimento</li>
                <li>• 7 dias antes do vencimento</li>
                <li>• No dia do vencimento</li>
                <li>• Notificação de vencimento ultrapassado</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Trilha de Auditoria</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Todas as consultas, uploads e atualizações de CRLV são registradas com timestamp, 
                  usuário responsável e fonte dos dados para fins de auditoria e conformidade.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}