import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const LoadingState = () => {
  return (
    <Card className="border border-border shadow-sm rounded-xl bg-card overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border pb-3 px-4 sm:px-6 pt-4">
        <CardTitle className="flex items-center text-base sm:text-lg font-semibold text-foreground">
          <Shield className="h-5 w-5 mr-2 text-primary" />
          Coberturas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground text-sm">Carregando coberturas...</p>
        </div>
      </CardContent>
    </Card>
  );
};
