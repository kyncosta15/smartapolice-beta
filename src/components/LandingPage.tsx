import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left side - Content */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/10 via-[hsl(var(--off-white-dark))] to-secondary/10 flex flex-col relative z-10">
        <section className="isolate">
          <div className="mx-auto max-w-screen-md px-6 py-12 sm:py-16 text-center min-h-[75vh] flex flex-col justify-center">
            {/* Logo */}
            <div className="mx-auto mb-6">
              <picture>
                <source 
                  srcSet="/lovable-uploads/06559720-de1c-4fe7-b38e-fbe2407c1414-optimized.webp" 
                  type="image/webp"
                  sizes="80px"
                />
                <img 
                  src="/lovable-uploads/06559720-de1c-4fe7-b38e-fbe2407c1414.png" 
                  alt="RCorp — soluções corporativas inteligentes" 
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl shadow-sm mx-auto" 
                  width="80"
                  height="80"
                  loading="eager"
                  decoding="sync"
                />
              </picture>
            </div>
            
            {/* Tagline */}
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Soluções corporativas inteligentes
            </p>

            {/* Hero Title - Compact */}
            <h1 className="font-extrabold tracking-tight text-foreground mb-4" 
                style={{ 
                  textWrap: 'balance' as any,
                  fontSize: 'clamp(28px, 5vw, 44px)'
                }}>
              Transforme a gestão da sua empresa
            </h1>

            {/* Description - Single sentence */}
            <p className="mx-auto max-w-prose text-base sm:text-lg text-muted-foreground mb-6">
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
            </ul>

            {/* Single CTA */}
            <div className="flex justify-center mb-8">
              <Link to="/system-selection">
                <Button 
                  variant="gradient" 
                  size="lg" 
                  className="text-base font-medium px-6 py-3 min-h-[44px] group"
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
              <div className="flex items-center gap-1">
                <span className="font-medium text-primary">277+</span>
                <span>veículos gerenciados</span>
              </div>
            </div>

            {/* Footer */}
            <footer className="text-xs text-muted-foreground">
              <p>&copy; 2025 RCorp. Todos os direitos reservados.</p>
            </footer>
          </div>
        </section>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden md:block md:w-1/2 relative">
        <picture className="absolute inset-0 w-full h-full">
          <source 
            srcSet="/lovable-uploads/c45b3700-3cc2-43a7-aa42-8f99beb081e3-optimized.webp" 
            type="image/webp"
            sizes="50vw"
          />
          <img 
            src="/lovable-uploads/c45b3700-3cc2-43a7-aa42-8f99beb081e3.png"
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover"
            width="960"
            height="1080"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>

      {/* Mobile background image overlay */}
      <div className="md:hidden absolute top-0 right-0 w-1/3 h-1/3 opacity-20 z-0">
        <picture className="w-full h-full">
          <source 
            srcSet="/lovable-uploads/c45b3700-3cc2-43a7-aa42-8f99beb081e3-optimized.webp" 
            type="image/webp"
            sizes="33vw"
          />
          <img 
            src="/lovable-uploads/c45b3700-3cc2-43a7-aa42-8f99beb081e3.png"
            alt="Background overlay"
            className="w-full h-full object-contain"
            width="320"
            height="360"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>
    </div>
  );
};