import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col relative overflow-hidden">
      {/* Background image on the right with low opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url('/lovable-uploads/c45b3700-3cc2-43a7-aa42-8f99beb081e3.png')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center right'
        }}
      />
      
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Header */}
      <header className="p-6 text-center">
        {/* Animated Logo above RCorp */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer glow ring */}
            <div className="absolute inset-0 w-24 h-24 bg-primary/20 rounded-2xl animate-ping" style={{ animationDuration: '2s' }}></div>
            
            {/* Main container */}
            <div className="relative w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden">
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
        
        <h1 className="text-4xl md:text-6xl font-bold text-primary mb-2 relative overflow-hidden">
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
        <div className="max-w-4xl w-full text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Transforme a gestão da sua empresa
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
    </div>
  );
};