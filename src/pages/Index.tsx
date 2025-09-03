import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, FileText, Shield, Users, BarChart3, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-primary">SmartBenefícios</h1>
            <p className="text-xl text-muted-foreground">
              Sistema Inteligente de Gestão de Benefícios
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')}
                className="bg-primary hover:bg-primary/90"
              >
                <Heart className="mr-2 h-5 w-5" />
                Acessar Sistema
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/solicitacao')}
              >
                <FileText className="mr-2 h-5 w-5" />
                Nova Solicitação
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Recursos Principais</h2>
          <p className="text-muted-foreground text-lg">
            Tudo o que você precisa para gerenciar benefícios corporativos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Gestão de Colaboradores</h3>
              <p className="text-muted-foreground text-sm">
                Controle completo de colaboradores e dependentes
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Controle de Apólices</h3>
              <p className="text-muted-foreground text-sm">
                Gerencie todas as apólices e benefícios em um só lugar
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Relatórios Inteligentes</h3>
              <p className="text-muted-foreground text-sm">
                Dashboards e relatórios com métricas importantes
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Solicitações Online</h3>
              <p className="text-muted-foreground text-sm">
                Colaboradores fazem solicitações de forma simples e rápida
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold mb-2">Sistema Seguro</h3>
              <p className="text-muted-foreground text-sm">
                Controle de acesso por perfis com máxima segurança
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold mb-2">Fácil de Usar</h3>
              <p className="text-muted-foreground text-sm">
                Interface intuitiva e responsiva para todos os dispositivos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 SmartBenefícios. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;