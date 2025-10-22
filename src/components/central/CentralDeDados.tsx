import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CentralDeDados() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    setLoading(true);
    try {
      // TODO: Implementar chamada para /em_calculo
      // const response = await getNegociosEmCalculo({ searchTerm });
      
      toast({
        title: 'Importação em desenvolvimento',
        description: 'Funcionalidade será implementada em breve.',
      });
      
      // Mock data para teste
      setData({
        status: 'em_desenvolvimento',
        message: 'Funcionalidade em implementação',
        filters: { searchTerm }
      });
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Não foi possível importar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Dados</h1>
        <p className="text-muted-foreground mt-2">
          Importação e gerenciamento de dados externos
        </p>
      </div>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle>Importar Negócios em Cálculo</CardTitle>
          <CardDescription>
            Busque e importe negócios da RCORP que estão em fase de cálculo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ, protocolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              />
            </div>
            <Button onClick={handleImport} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Importando...' : 'Importar'}
            </Button>
          </div>

          {/* Preview/Result */}
          {data && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Resultado:</div>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[400px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">📦 Funcionalidades Planejadas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Importação de negócios em cálculo da RCORP</li>
            <li>• Filtros por data e texto</li>
            <li>• Sincronização automática de dados</li>
            <li>• Histórico de importações</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
