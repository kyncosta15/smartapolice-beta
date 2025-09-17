import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import smartapoliceShield from '@/assets/smartapolice-new-shield.png';
import smartbeneficiosPeopleHeart from '@/assets/smartbeneficios-people-heart.png';

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
      <header className="p-6">
        <Link to="/" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
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
            <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 hover:scale-105 relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 hover:from-primary/10 hover:to-primary/20"
                  onClick={() => handleSystemSelect('smartapolice')}>
              {/* Subtle animated background overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 shadow-lg group-hover:shadow-xl overflow-hidden">
                  <img src={smartapoliceShield} alt="SmartApólice Shield" className="h-20 w-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">SmartApólice</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 relative z-10">
                <p className="text-muted-foreground">
                  Gestão inteligente de seguros e apólices corporativas
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
                  <li>• Controle de apólices</li>
                  <li>• Dashboard analítico</li>
                  <li>• Relatórios automatizados</li>
                  <li>• Gestão de renovações</li>
                </ul>
                <Button variant="gradient" className="w-full transition-all duration-300 hover:shadow-lg">
                  Acessar SmartApólice
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* SmartBenefícios */}
            <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/30 hover:scale-105 relative overflow-hidden bg-gradient-to-br from-secondary/5 via-background to-secondary/10 hover:from-secondary/10 hover:to-secondary/20"
                  onClick={() => handleSystemSelect('smartbeneficios')}>
              {/* Subtle animated background overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-secondary/30 group-hover:to-secondary/20 transition-all duration-300 shadow-lg group-hover:shadow-xl overflow-hidden">
                  <img src={smartbeneficiosPeopleHeart} alt="SmartBenefícios People and Heart" className="h-20 w-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                </div>
                <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-secondary bg-clip-text text-transparent">SmartBenefícios</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 relative z-10">
                <p className="text-muted-foreground">
                  Administração completa de benefícios corporativos
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs mx-auto">
                  <li>• Gestão de benefícios</li>
                  <li>• Controle de colaboradores</li>
                  <li>• Relatórios de utilização</li>
                  <li>• Integração RH</li>
                </ul>
                <Button variant="gradient" className="w-full transition-all duration-300 hover:shadow-lg">
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
        <p>&copy; 2025 RCorp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};