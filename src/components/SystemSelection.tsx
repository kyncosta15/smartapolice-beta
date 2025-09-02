import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Heart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const SystemSelection = () => {
  const navigate = useNavigate();

  const handleSystemSelect = (system: 'smartapolice' | 'smartbeneficios') => {
    if (system === 'smartapolice') {
      navigate('/auth/smartapolice');
    } else {
      navigate('/auth/smartbeneficios');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">RCorp</h1>
          <p className="text-sm text-muted-foreground">Soluções corporativas inteligentes</p>
        </div>
        <div className="w-16"></div> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Escolha seu sistema
            </h2>
            <p className="text-lg text-muted-foreground">
              Selecione a solução que melhor atende às suas necessidades
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* SmartApólice */}
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary hover:scale-105"
                  onClick={() => handleSystemSelect('smartapolice')}>
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-2xl">SmartApólice</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Gestão inteligente de seguros e apólices corporativas
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
                  <li>• Controle de apólices</li>
                  <li>• Dashboard analítico</li>
                  <li>• Relatórios automatizados</li>
                  <li>• Gestão de renovações</li>
                </ul>
                <Button className="w-full group-hover:bg-primary/90 transition-colors">
                  Acessar SmartApólice
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* SmartBenefícios */}
            <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary hover:scale-105"
                  onClick={() => handleSystemSelect('smartbeneficios')}>
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Heart className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-2xl">SmartBenefícios</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Administração completa de benefícios corporativos
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
                  <li>• Gestão de benefícios</li>
                  <li>• Controle de colaboradores</li>
                  <li>• Relatórios de utilização</li>
                  <li>• Integração RH</li>
                </ul>
                <Button className="w-full group-hover:bg-primary/90 transition-colors">
                  Acessar SmartBenefícios
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-muted-foreground">
        <p>&copy; 2024 RCorp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};