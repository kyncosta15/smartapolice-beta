
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User } from 'lucide-react';
import { extractFieldValue } from '@/utils/extractFieldValue';

interface ResponsiblePersonCardProps {
  policy: any;
}

export const ResponsiblePersonCard = ({ policy }: ResponsiblePersonCardProps) => {
  // CORREÇÃO: Usar extractFieldValue para extrair nome do responsável de forma segura
  const responsavelNome = extractFieldValue(policy.responsavel_nome) || 
                         extractFieldValue(policy.segurado?.nome) ||
                         extractFieldValue(policy.insured?.name) ||
                         'Não definido';

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-slate-900 font-sf-pro">
          <Shield className="h-6 w-6 mr-3 text-slate-600" />
          Responsável
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <User className="h-10 w-10 text-white" />
        </div>
        <p className="text-xl font-bold text-slate-900 font-sf-pro">
          {responsavelNome}
        </p>
      </CardContent>
    </Card>
  );
};
