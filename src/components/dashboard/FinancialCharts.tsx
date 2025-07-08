
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';

interface FinancialChartsProps {
  financialData: Array<{ name: string; valor: number; cobertura: number }>;
}

export function FinancialCharts({ financialData }: FinancialChartsProps) {
  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center text-lg">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Top 5 - Apólices por Custo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value), {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }), 'Valor Mensal']} />
              <Bar dataKey="valor" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
