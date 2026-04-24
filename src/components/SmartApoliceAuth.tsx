import React, { useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import smartControlShield from '@/assets/smartcontrol-shield.png';

const features = [
  'Apólices e renovações',
  'Gestão de frotas e veículos',
  'Colaboradores e benefícios',
  'Documentos centralizados',
  'Dashboards e relatórios',
];

const SmartApoliceAuthContent = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      if (profile.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const showLoadingOverlay = !!user;
  const loadingMessage = !profile ? 'Carregando seu perfil...' : 'Redirecionando...';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[hsl(280,100%,55%)]/10 blur-3xl" />
      </div>

      {/* Back link - floating */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Link>

      {/* Split layout */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-border/60 bg-card/40 backdrop-blur-md shadow-2xl">
          {/* LEFT — Brand & features */}
          <div className="relative p-10 lg:p-12 flex flex-col justify-between bg-gradient-to-br from-card/80 to-card/40 border-b lg:border-b-0 lg:border-r border-border/60">
            {/* Brand row */}
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(280,100%,55%)]/20 flex items-center justify-center border border-border/60">
                  <img
                    src={smartControlShield}
                    alt="SmartControl"
                    className="h-8 w-8 object-contain"
                    loading="eager"
                  />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  <span className="text-foreground">Smart</span>
                  <span className="bg-gradient-to-r from-[hsl(190,100%,50%)] via-[hsl(230,100%,55%)] to-[hsl(280,100%,55%)] bg-clip-text text-transparent">
                    Control
                  </span>
                </h1>
              </div>

              {/* Eyebrow */}
              <p className="text-[11px] font-muli uppercase tracking-[0.22em] text-primary/80 mb-4">
                Gestão de Ativos Inteligente
              </p>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-[1.05] mb-5">
                Controle total
                <br />
                dos seus ativos.
              </h2>

              {/* Subhead */}
              <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-md">
                Gerencie apólices, frotas e colaboradores em um painel unificado.
              </p>

              {/* Features */}
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-foreground/85"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer / social proof */}
            <div className="hidden lg:flex items-center gap-3 mt-10 pt-6 border-t border-border/40">
              <div className="flex -space-x-2">
                {['JR', 'AM', 'FS'].map((initials, i) => (
                  <div
                    key={initials}
                    className={`w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-semibold text-white ${
                      i === 0
                        ? 'bg-[hsl(230,80%,55%)]'
                        : i === 1
                        ? 'bg-[hsl(280,70%,55%)]'
                        : 'bg-[hsl(180,70%,45%)]'
                    }`}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">+240 gestores</span> ativos hoje
              </p>
            </div>
          </div>

          {/* RIGHT — Auth form */}
          <div className="relative p-8 lg:p-12 flex flex-col justify-center bg-card/30">
            {/* Secure badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Ambiente seguro
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
              Acesse sua conta
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Entre com suas credenciais corporativas
            </p>

            {/* Existing AuthPage form (login/register tabs) */}
            <div className="-mx-2">
              <AuthPage />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-8 py-6 shadow-lg">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{loadingMessage}</p>
              <p className="text-xs text-muted-foreground mt-1">Aguarde um instante...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SmartApoliceAuth = () => {
  return <SmartApoliceAuthContent />;
};

export default SmartApoliceAuth;
