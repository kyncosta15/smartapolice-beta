import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, ArrowRight, FileText, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import smartControlShield from "@/assets/smartcontrol-shield.png";

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left side - Content */}
      <div className="w-full md:w-1/2 bg-floral-white dark:bg-background flex flex-col relative z-10">
        <section className="isolate">
          <div className="mx-auto max-w-screen-md px-6 py-12 sm:py-16 text-center min-h-[75vh] flex flex-col justify-center">
            {/* Brand Lockup */}
            <div className="mx-auto mb-10 flex flex-col items-center">
              <img
                src={smartControlShield}
                alt="SmartControl"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-3 drop-shadow-lg"
                width="80"
                height="80"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />

              {/* H1 Brand Name - Smart (white/foreground) + Control (blue gradient) */}
              <h1
                className="font-condor font-bold tracking-tight leading-[0.95] mb-3"
                style={{
                  fontSize: "clamp(36px, 5.2vw, 68px)",
                }}
                aria-label="SmartControl"
              >
                <span className="text-foreground dark:text-white">Smart</span>
                <span className="bg-gradient-to-r from-[hsl(190,100%,50%)] via-[hsl(230,100%,55%)] to-[hsl(280,100%,55%)] bg-clip-text text-transparent drop-shadow-[0_0_25px_hsl(220,100%,55%/0.5)]" style={{ WebkitTextStroke: '0.5px hsl(220,100%,55%/0.2)' }}>
                  Control
                </span>
              </h1>

              {/* Tagline - Secondary hierarchy (smaller, refined) */}
              <p
                className="font-muli font-medium tracking-tight mb-3 text-muted-foreground dark:text-slate-300"
                style={{ fontSize: "clamp(15px, 1.5vw, 18px)", lineHeight: "1.3" }}
              >
                Gestão de Ativos Inteligente
              </p>

              {/* Powered by - Tertiary hierarchy */}
              <p className="text-[10px] sm:text-[11px] font-muli uppercase tracking-[0.18em] text-muted-foreground/60">
                powered by <span className="font-semibold text-foreground/70 normal-case tracking-normal">RCorp</span> · soluções corporativas inteligentes
              </p>
            </div>

            {/* H2 PRIMARY HEADLINE - Largest, dominant */}
            <h2
              className="font-muli font-bold tracking-tight text-foreground dark:text-foreground mb-5 leading-[1.05]"
              style={{
                textWrap: "balance" as any,
                fontSize: "clamp(36px, 5.5vw, 64px)",
              }}
            >
              Transforme a gestão da sua empresa
            </h2>

            {/* Description - Supporting text */}
            <p
              className="mx-auto max-w-prose font-muli text-muted-foreground mb-6"
              style={{ fontSize: "clamp(15px, 1.5vw, 18px)", lineHeight: "1.5" }}
            >
              Otimize processos, centralize documentos e acompanhe tudo em um único painel.
            </p>

            {/* Value Props - Only 2 */}
            <ul className="mx-auto flex flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-8">
              <li className="rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 border border-border/50">
                Reduza custos
              </li>
              <li className="rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 border border-border/50">
                Centralize documentos
              </li>
              <li className="rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 border border-border/50">
                Gerencie seus ativos
              </li>
            </ul>

            {/* Single CTA */}
            <div className="flex justify-center mb-8">
              <Link to="/system-selection" className="group/glow relative">
                {/* Outer glow border container - intensified for light mode */}
                <div className="absolute -inset-[3px] rounded-lg bg-gradient-to-r from-prussian-blue/70 via-prussian-blue/90 to-prussian-blue/70 opacity-0 group-hover/glow:opacity-100 blur-[6px] transition-opacity duration-500" />
                <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-prussian-blue/50 via-prussian-blue/80 to-prussian-blue/50 opacity-0 group-hover/glow:opacity-100 transition-opacity duration-300 overflow-hidden">
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/glow:translate-x-full transition-transform duration-1000 ease-in-out" />
                </div>
                <Button
                  variant="gradient"
                  size="lg"
                  className="relative text-base font-medium px-6 py-3 min-h-[44px] group"
                  aria-label="Entrar no painel da RCorp"
                >
                  Entrar no painel
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Trust Bar - Smaller */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-primary opacity-70" />
                <span>Sistema seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-primary opacity-70" />
                <span>Fácil de usar</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-primary opacity-70" />
                <span>Gerencie suas apólices</span>
              </div>
            </div>

            {/* Footer */}
            <footer className="text-xs text-muted-foreground space-y-1">
              <p>&copy; 2025 RCorp. Todos os direitos reservados.</p>
              <p>
                <a
                  href="/status"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  <Activity className="h-3 w-3" />
                  Status do sistema
                </a>
              </p>
            </footer>
          </div>
        </section>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden md:block md:w-1/2 relative">
        <img
          src="/lovable-uploads/rcorp-background-new.png"
          alt="RCorp Logo"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </div>
    </div>
  );
};
