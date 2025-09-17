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
          <div className="mx-auto max-w-screen-md px-6 py-12 sm:py-16 text-center min-h-[75vh]">
            {/* Logo */}
            <div className="mx-auto mb-8">
              <div className="relative inline-block">
                <picture>
                  <source 
                    srcSet="/lovable-uploads/06559720-de1c-4fe7-b38e-fbe2407c1414-optimized.webp" 
                    type="image/webp"
                    sizes="(max-width: 768px) 80px, 96px"
                  />
                  <img 
                    src="/lovable-uploads/06559720-de1c-4fe7-b38e-fbe2407c1414.png" 
                    alt="RCorp — soluções corporativas inteligentes" 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-sm mx-auto" 
                    width="96"
                    height="96"
                    loading="eager"
                    decoding="sync"
                  />
                </picture>
              </div>
            </div>
            
            {/* Brand */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 relative overflow-hidden">
                <span className="relative inline-block">
                  RCorp
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent" 
                       style={{ 
                         animation: 'shimmer 2.5s ease-in-out infinite'
                       }}>
                  </div>
                </span>
              </h1>
              <p className="text-base text-muted-foreground">
                Soluções corporativas inteligentes
              </p>
            </div>

            {/* Hero Title */}
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4" 
                style={{ textWrap: 'balance' as any }}>
              Transforme a gestão da sua empresa
            </h2>

            {/* Description */}
            <p className="mx-auto mt-4 max-w-prose text-base sm:text-lg text-muted-foreground mb-6">
              Acesse soluções inteligentes para otimizar processos e maximizar resultados
            </p>

            {/* Value Props */}
            <ul className="mx-auto mt-5 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-8">
              <li className="rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 border border-border/50">
                Reduza custos
              </li>
              <li className="rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 border border-border/50">
                Centralize documentos
              </li>
              <li className="rounded-full bg-background/80 backdrop-blur-sm px-3 py-1 border border-border/50">
                Monitore sinistros
              </li>
            </ul>

            {/* CTAs */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link to="/system-selection">
                <Button 
                  variant="gradient" 
                  size="lg" 
                  className="text-base font-medium px-6 py-3 min-h-[44px] group w-full sm:w-auto"
                >
                  Entrar no painel
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base font-medium px-4 py-3 min-h-[44px] w-full sm:w-auto"
                asChild
              >
                <Link to="/system-selection">
                  Ver soluções
                </Link>
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="mt-10 text-center">
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Sistema seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Fácil de usar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-primary">277+</span>
                  <span>veículos gerenciados</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-10 text-xs text-muted-foreground">
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