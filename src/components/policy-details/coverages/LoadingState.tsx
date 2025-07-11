
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LoadingState = () => {
  return (
    <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
          <Shield className="h-6 w-6 mr-3 text-blue-600" />
          Coberturas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-blue-300 mx-auto mb-3 animate-pulse" />
          <p className="text-blue-600 font-medium">Carregando coberturas...</p>
        </div>
      </CardContent>
    </Card>
  );
};
