import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SmartBeneficiosAuth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Link to="/system-selection" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">SmartBenefícios</h1>
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
              EM BREVE
            </span>
          </div>
        </div>
        <div className="w-16"></div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">SmartBenefícios</CardTitle>
            <p className="text-muted-foreground">Sistema em desenvolvimento</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-800 mb-2">Em breve!</h3>
                <p className="text-sm text-orange-700">
                  O SmartBenefícios está sendo desenvolvido e estará disponível em breve. 
                  Este sistema revolucionará a gestão de benefícios corporativos.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Funcionalidades previstas:</h4>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Gestão completa de benefícios</li>
                  <li>• Controle de colaboradores</li>
                  <li>• Relatórios de utilização</li>
                  <li>• Integração com sistemas de RH</li>
                  <li>• Dashboard analítico</li>
                  <li>• Notificações automáticas</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/system-selection">
                <Button className="w-full">
                  Voltar à seleção
                </Button>
              </Link>
              <Link to="/auth/smartapolice">
                <Button variant="outline" className="w-full">
                  Acessar SmartApólice
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-muted-foreground">
        <p>&copy; 2024 RCorp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};