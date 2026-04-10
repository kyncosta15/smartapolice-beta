import { Shield, FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function SeguroGarantiaPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Seguro Garantia</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas apólices de seguro garantia — licitações, contratos e judiciais.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Apólices Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Clock className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Vencendo em 30 dias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle2 className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">R$ 0</p>
              <p className="text-xs text-muted-foreground">Importância Segurada</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Apólices de Seguro Garantia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Shield className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Nenhuma apólice cadastrada</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              As apólices de seguro garantia aparecerão aqui quando forem cadastradas no sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
