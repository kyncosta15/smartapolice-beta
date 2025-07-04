
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Building } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ClassificationChartsProps {
  typeDistribution: Array<{ name: string; value: number }>;
  insurerDistribution: Array<{ name: string; value: number }>;
  categoryDistribution: Array<{ name: string; value: number }>;
  colors: string[];
}

export function ClassificationCharts({ typeDistribution, insurerDistribution, categoryDistribution, colors }: ClassificationChartsProps) {
  return (
    <div className="space-y-6">
      {/* Tipos de Seguro */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Tipos de Seguro
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Seguradoras */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <Building className="h-5 w-5 mr-2 text-green-600" />
            Seguradoras
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insurerDistribution} maxBarSize={60}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [value, 'Valor']} />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Categorias */}
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            Categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
