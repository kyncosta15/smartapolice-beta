import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col">
      {/* Header */}
      <header className="p-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-primary mb-2">
          RCorp
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
              <Button size="lg" className="text-lg px-8 py-4 group">
                Entrar
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Tech Animation */}
          <div className="relative mt-16 h-64 flex items-center justify-center">
            {/* Animated tech circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border border-primary/20 rounded-full animate-pulse"></div>
              <div className="absolute w-48 h-48 border border-primary/10 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
              <div className="absolute w-64 h-64 border border-primary/5 rounded-full animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }}></div>
            </div>
            
            {/* Floating tech elements */}
            <div className="relative z-10 grid grid-cols-3 gap-8 opacity-60">
              <div className="flex flex-col items-center space-y-2 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary/30 rounded"></div>
                </div>
                <div className="h-1 w-8 bg-gradient-to-r from-primary/20 to-transparent rounded"></div>
              </div>
              
              <div className="flex flex-col items-center space-y-2 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary/30 rounded-full"></div>
                </div>
                <div className="h-1 w-8 bg-gradient-to-r from-primary/20 to-transparent rounded"></div>
              </div>
              
              <div className="flex flex-col items-center space-y-2 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary/30 rounded-sm transform rotate-45"></div>
                </div>
                <div className="h-1 w-8 bg-gradient-to-r from-primary/20 to-transparent rounded"></div>
              </div>
            </div>
            
            {/* Central tech icon with animated shield */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-20 h-20 bg-primary/20 rounded-xl animate-ping" style={{ animationDuration: '2s' }}></div>
                
                {/* Main container */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white animate-pulse drop-shadow-lg" style={{ 
                    filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, bounce 3s ease-in-out infinite'
                  }} />
                </div>
                
                {/* Rotating border */}
                <div className="absolute inset-0 w-16 h-16 border-2 border-primary/30 rounded-xl animate-spin" style={{ animationDuration: '4s' }}></div>
              </div>
            </div>
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