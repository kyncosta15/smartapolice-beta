import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Shield, ShieldCheck, Users, Heart, BarChart3, FileText, RefreshCw, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import smartapoliceShield from '@/assets/smartapolice-shield-transparent.png';
import smartbeneficiosPeopleHeart from '@/assets/smartbeneficios-transparent.png';

const SystemSelection = () => {
  const navigate = useNavigate();

  const handleSystemSelect = (system: 'smartapolice' | 'smartbeneficios') => {
    if (system === 'smartapolice') {
      navigate('/auth/smartapolice');
    } else {
      navigate('/auth/smartbeneficios');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-background dark:via-background dark:to-background/95 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
              Escolha seu sistema
            </h1>
            <p className="text-lg text-muted-foreground">
              Selecione a solução que melhor atende às suas necessidades
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* SmartApólice Card */}
            <div 
              className="group cursor-pointer"
              onClick={() => handleSystemSelect('smartapolice')}
            >
              <div className="bg-card rounded-2xl border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 p-8 h-full flex flex-col">
                {/* Icon Container */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center shadow-inner">
                      <img 
                        src={smartapoliceShield} 
                        alt="SmartApólice" 
                        className="h-16 w-16 object-contain group-hover:scale-110 transition-transform duration-300" 
                        loading="eager" 
                        fetchPriority="high" 
                      />
                    </div>
                    {/* Decorative ring */}
                    <div className="absolute -inset-2 rounded-full border-2 border-dashed border-blue-200/50 dark:border-primary/20 group-hover:border-primary/40 transition-colors duration-300" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-3">
                  <span className="text-foreground">Smart</span>
                  <span className="text-primary">Apólice</span>
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-center mb-6 leading-relaxed">
                  Gestão inteligente de seguros e apólices corporativas
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>Controle de apólices</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>Dashboard analítico</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>Relatórios automatizados</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>Gestão de renovações</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <Button 
                  variant="default" 
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Acessar SmartApólice
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* SmartBenefícios Card */}
            <div 
              className="group cursor-pointer"
              onClick={() => handleSystemSelect('smartbeneficios')}
            >
              <div className="bg-card rounded-2xl border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 p-8 h-full flex flex-col">
                {/* Icon Container */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/10 flex items-center justify-center shadow-inner">
                      <img 
                        src={smartbeneficiosPeopleHeart} 
                        alt="SmartBenefícios" 
                        className="h-16 w-16 object-contain group-hover:scale-110 transition-transform duration-300" 
                        loading="eager" 
                        fetchPriority="high" 
                      />
                    </div>
                    {/* Decorative ring */}
                    <div className="absolute -inset-2 rounded-full border-2 border-dashed border-emerald-200/50 dark:border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors duration-300" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-3">
                  <span className="text-foreground">Smart</span>
                  <span className="text-emerald-600 dark:text-emerald-500">Benefícios</span>
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-center mb-6 leading-relaxed">
                  Administração completa de benefícios corporativos
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>Gestão de benefícios</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>Controle de colaboradores</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>Relatórios de utilização</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>Integração RH</span>
                  </li>
                </ul>

                {/* CTA Button */}
                <Button 
                  variant="default" 
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Acessar SmartBenefícios
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">&copy; 2025 RCorp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default SystemSelection;
