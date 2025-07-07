
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Building } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PersonTypeDistributionProps {
  personTypeDistribution: {
    pessoaFisica: number;
    pessoaJuridica: number;
  };
}

export function PersonTypeDistribution({ personTypeDistribution }: PersonTypeDistributionProps) {
  const isMobile = useIsMobile();

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className={`border-b border-gray-100 ${isMobile ? 'p-3' : ''}`}>
        <CardTitle className={`flex items-center ${isMobile ? 'text-sm' : 'text-lg'}`}>
          <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2 text-orange-600`} />
          Vínculo
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'pt-3 p-3' : 'pt-6'} w-full overflow-hidden`}>
        <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          {/* Card Pessoa Física */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow w-full overflow-hidden">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`flex items-center ${isMobile ? 'justify-between' : 'justify-between'}`}>
                <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                  <div className={`${isMobile ? 'p-2' : 'p-3'} bg-blue-500 rounded-xl shadow-lg`}>
                    <Users className={`${isMobile ? 'h-5 w-5' : 'h-8 w-8'} text-white`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-blue-900`}>Pessoa Física</h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 font-medium`}>CPF</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-blue-700`}>
                    {personTypeDistribution.pessoaFisica}
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 font-medium`}>
                    {personTypeDistribution.pessoaFisica === 1 ? 'apólice' : 'apólices'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Pessoa Jurídica */}
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow w-full overflow-hidden">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`flex items-center ${isMobile ? 'justify-between' : 'justify-between'}`}>
                <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                  <div className={`${isMobile ? 'p-2' : 'p-3'} bg-purple-500 rounded-xl shadow-lg`}>
                    <Building className={`${isMobile ? 'h-5 w-5' : 'h-8 w-8'} text-white`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-sm' : 'text-xl'} font-bold text-purple-900`}>Pessoa Jurídica</h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-600 font-medium`}>CNPJ</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-purple-700`}>
                    {personTypeDistribution.pessoaJuridica}
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-600 font-medium`}>
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
