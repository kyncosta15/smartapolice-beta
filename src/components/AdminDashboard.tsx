
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Shield, FileText, TrendingUp, Eye, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { renderValueAsString } from '@/utils/renderValue';

interface AdminDashboardProps {
  allUsers: any[];
  allPolicies: any[];
  onUserUpdate: (user: any) => void;
  onUserDelete: (userId: string) => void;
  onPolicyUpdate: (policy: any) => void;
  onPolicyDelete: (policyId: string) => void;
}

export function AdminDashboard({ 
  allUsers, 
  allPolicies, 
  onUserUpdate, 
  onUserDelete,
  onPolicyUpdate,
  onPolicyDelete 
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleDeletePolicy = (policy: any) => {
    if (window.confirm(`Tem certeza que deseja excluir a apólice ${policy.name}?`)) {
      onPolicyDelete(policy.id);
      toast({
        title: "Apólice Excluída",
        description: `A apólice ${policy.name} foi removida com sucesso`,
      });
    }
  };

  const handleDeleteUser = (user: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      onUserDelete(user.id);
      toast({
        title: "Usuário Excluído",
        description: `O usuário ${user.name} foi removido com sucesso`,
      });
    }
  };

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPolicies = allPolicies.filter(policy => 
    policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.insurer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie usuários e apólices do sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{allUsers.length}</div>
            <p className="text-xs text-blue-600 mt-1">Usuários cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Total Apólices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{allPolicies.length}</div>
            <p className="text-xs text-green-600 mt-1">Apólices no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Apólices Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {allPolicies.filter(p => p.status === 'active').length}
            </div>
            <p className="text-xs text-purple-600 mt-1">Em vigência</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              R$ {allPolicies.reduce((sum, p) => sum + (p.premium || 0), 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-orange-600 mt-1">Prêmios totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar usuários ou apólices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <Badge className="mt-1" variant="secondary">{user.role}</Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Apólices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Apólices ({filteredPolicies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredPolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{policy.name}</h4>
                    <p className="text-sm text-gray-600">{renderValueAsString(policy.insurer)}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                        {policy.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        R$ {policy.premium?.toLocaleString('pt-BR') || '0'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeletePolicy(policy)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
