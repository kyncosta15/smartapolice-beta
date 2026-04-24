import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import smartControlShield from '@/assets/smartcontrol-shield.png';
import { useAuth } from '@/contexts/AuthContext';

const SystemSelection = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();

  // Se já estiver logado, redireciona para o dashboard apropriado
  useEffect(() => {
    if (!isLoading && user) {
      if (profile?.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, isLoading, navigate]);

  const handleSystemSelect = () => {
    navigate('/auth/smartapolice');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="p-6 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="max-w-md w-full">
          {/* Heading */}
          <div className="text-center mb-12">
            <p className="text-[11px] font-muli uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">
              Painel de acesso
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-3 tracking-tight">
              Acesse sua conta
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Tudo o que você precisa para gerir os ativos da sua empresa em um só lugar.
            </p>
          </div>

          {/* SmartControl Card - minimalist */}
          <div
            className="group cursor-pointer"
            onClick={handleSystemSelect}
          >
            <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 p-8">
              {/* Brand row */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={smartControlShield}
                  alt="SmartControl"
                  className="h-12 w-12 object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight leading-none">
                    <span className="text-foreground">Smart</span>
                    <span className="bg-gradient-to-r from-[hsl(190,100%,50%)] via-[hsl(230,100%,55%)] to-[hsl(280,100%,55%)] bg-clip-text text-transparent">
                      Control
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Gestão de Ativos Inteligente
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/60 mb-6" />

              {/* Features List - minimal with check icons */}
              <ul className="space-y-3 mb-8">
                {[
                  'Apólices e renovações',
                  'Gestão de frotas e veículos',
                  'Colaboradores e benefícios',
                  'Documentos centralizados',
                  'Dashboards e relatórios',
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-foreground/80"
                  >
                    <Check className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2.5} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant="default"
                className="w-full h-11 text-sm font-medium bg-primary hover:bg-primary/90 transition-all duration-300"
              >
                Entrar no painel
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Helper text below card */}
            <p className="text-center text-xs text-muted-foreground mt-5">
              Acesso seguro · Suporte dedicado · Disponível 24/7
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center relative z-10">
        <p className="text-xs text-muted-foreground">&copy; 2025 RCorp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default SystemSelection;
