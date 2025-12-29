import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, FileText, Building2, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SmartBeneficiosEmbed() {
  const navigate = useNavigate();

  const features = [
    { icon: Heart, title: 'Gestão de Benefícios', description: 'Controle completo dos benefícios corporativos' },
    { icon: Users, title: 'Controle de Colaboradores', description: 'Gerenciamento de vidas e dependentes' },
    { icon: FileText, title: 'Relatórios de Utilização', description: 'Acompanhamento detalhado de uso' },
    { icon: Building2, title: 'Integração RH', description: 'Conexão com sistemas de RH' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 dark:border-emerald-800/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-2xl">
              <span className="text-foreground">Smart</span>
              <span className="text-emerald-600 dark:text-emerald-400">Benefícios</span>
            </CardTitle>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
              <Clock className="h-3 w-3" />
              EM BREVE
            </span>
          </div>
          <CardDescription className="text-base">
            Administração completa de benefícios corporativos
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-background/50 rounded-full text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            Sistema em desenvolvimento - Disponível em breve!
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <Card key={index} className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={() => navigate('/smartbeneficios')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Acessar SmartBenefícios MVP
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/colaborador')}
            >
              Portal do Colaborador
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}