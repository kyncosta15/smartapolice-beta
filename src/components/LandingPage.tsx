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

          {/* Features Preview */}
          <div className="grid md:grid-cols-2 gap-8 mt-16">
            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">SmartApólice</h3>
                <p className="text-muted-foreground">
                  Gestão inteligente de seguros e apólices corporativas
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">SmartBenefícios</h3>
                <p className="text-muted-foreground">
                  Administração completa de benefícios corporativos
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-muted-foreground">
        <p>&copy; 2024 RCorp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};