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
        {/* Header */}
        <header className="p-6 md:p-6 pt-8 md:pt-6 text-center">
          {/* Animated Logo above RCorp */}
          <div className="flex justify-center mb-6 md:mb-6">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 w-44 h-44 md:w-24 md:h-24 bg-primary/20 rounded-2xl animate-ping" style={{ animationDuration: '2s' }}></div>
              
              {/* Main container */}
              <div className="relative w-40 h-40 md:w-20 md:h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden">
                <img 
                  src="/lovable-uploads/06559720-de1c-4fe7-b38e-fbe2407c1414.png" 
                  alt="RCorp Logo" 
                  className="w-full h-full object-cover rounded-2xl" 
                  style={{ 
                    filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.4))'
                  }} 
                />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-1 relative overflow-hidden">
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
          <p className="text-xl text-muted-foreground">
            Soluções corporativas inteligentes
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Transforme a gestão da sua empresa
              </h2>
              <p className="text-lg text-muted-foreground">
                Acesse nossas soluções inteligentes para otimizar processos e maximizar resultados
              </p>
            </div>

            {/* CTA Button */}
            <div>
              <Link to="/system-selection">
                <Button variant="gradient" size="lg" className="text-lg px-8 py-4 group">
                  Entrar
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </main>

         {/* Footer */}
         <footer className="p-6 text-center text-muted-foreground">
           <p>&copy; 2025 RCorp. Todos os direitos reservados.</p>
         </footer>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden md:block md:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/c45b3700-3cc2-43a7-aa42-8f99beb081e3.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>

      {/* Mobile background image overlay */}
      <div className="md:hidden absolute top-0 right-0 w-1/3 h-1/3 opacity-20 z-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/lovable-uploads/c45b3700-3cc2-43a7-aa42-8f99beb081e3.png')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center'
          }}
        />
      </div>
    </div>
  );
};