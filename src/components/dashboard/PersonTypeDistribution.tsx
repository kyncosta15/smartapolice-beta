
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Building } from 'lucide-react';

interface PersonTypeDistributionProps {
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
}

export function PersonTypeDistribution({ personTypeDistribution }: PersonTypeDistributionProps) {
  return (
    <Card>
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center text-lg">
          <FileText className="h-5 w-5 mr-2 text-orange-600" />
          Vínculo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Card Pessoa Física */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">Pessoa Física</h3>
                    <p className="text-sm text-blue-600 font-medium">CPF</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-blue-700">
                    {personTypeDistribution.pessoaFisica}
                  </div>
                  <p className="text-sm text-blue-600 font-medium">
                    {personTypeDistribution.pessoaFisica === 1 ? 'apólice' : 'apólices'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Pessoa Jurídica */}
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                    <Building className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-900">Pessoa Jurídica</h3>
                    <p className="text-sm text-purple-600 font-medium">CNPJ</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-purple-700">
                    {personTypeDistribution.pessoaJuridica}
                  </div>
                  <p className="text-sm text-purple-600 font-medium">
                    {personTypeDistribution.pessoaJuridica === 1 ? 'apólice' : 'apólices'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
