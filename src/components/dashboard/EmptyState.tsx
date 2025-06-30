
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function EmptyState() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma apólice processada</h3>
        <p className="text-gray-500">Faça upload de PDFs para ver os gráficos e análises</p>
      </CardContent>
    </Card>
  );
}
