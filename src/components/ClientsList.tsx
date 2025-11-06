import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Search, 
  Users, 
  Eye, 
  Edit2, 
  Trash2, 
  Plus,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  FileText
} from 'lucide-react';
import { useClients, Client } from '@/hooks/useClients';
import { ClientRegistration } from './ClientRegistration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ClientsList = () => {
  const { clients, isLoading, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClient = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient(id);
    }
  };

  const ClientDetailsModal = ({ client }: { client: Client | null }) => {
    if (!client) return null;

    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Detalhes do Cliente
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Informações Básicas</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>{client.company}</span>
                  </div>
                )}
              </div>
            </div>

            {client.document && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Documento</h4>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>{client.document_type.toUpperCase()}: {client.document}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {(client.address || client.city || client.state) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Endereço</h4>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="text-sm">
                    {client.address && <div>{client.address}</div>}
                    {(client.city || client.state) && (
                      <div>{client.city}{client.state && `, ${client.state}`}</div>
                    )}
                    {client.zip_code && <div>CEP: {client.zip_code}</div>}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Status e Datas</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Cadastrado em {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </div>
            </div>

            {client.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {client.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clientes Cadastrados
            </CardTitle>
            <Dialog open={showNewClientModal} onOpenChange={setShowNewClientModal}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                </DialogHeader>
                <ClientRegistration 
                  onSuccess={() => setShowNewClientModal(false)} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca.'
                  : 'Comece cadastrando seu primeiro cliente.'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowNewClientModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.company || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedClient(client)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <ClientDetailsModal client={selectedClient} />
                          </Dialog>
                          
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};