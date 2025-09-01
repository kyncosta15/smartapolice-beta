
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

  // Garantir que os valores são números seguros
  const safePessoaFisica = typeof personTypeDistribution.pessoaFisica === 'number' 
    ? personTypeDistribution.pessoaFisica 
    : 0;
  
  const safePessoaJuridica = typeof personTypeDistribution.pessoaJuridica === 'number' 
    ? personTypeDistribution.pessoaJuridica 
    : 0;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className={`border-b border-gray-100 ${isMobile ? 'p-2 pb-1' : 'p-4'}`}>
        <CardTitle className={`flex items-center ${isMobile ? 'text-xs' : 'text-lg'}`}>
          <FileText className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'} mr-2 text-orange-600`} />
          Vínculo
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'p-2 pt-1' : 'pt-6'} w-full overflow-hidden`}>
        <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
          {/* Card Pessoa Física */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow w-full overflow-hidden">
            <CardContent className={`${isMobile ? 'p-2' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                  <div className={`${isMobile ? 'p-1' : 'p-3'} bg-blue-500 rounded-xl shadow-lg`}>
                    <Users className={`${isMobile ? 'h-3 w-3' : 'h-8 w-8'} text-white`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-xs' : 'text-xl'} font-bold text-blue-900`}>
                      {isMobile ? 'P. Física' : 'Pessoa Física'}
                    </h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 font-medium`}>CPF</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isMobile ? 'text-lg' : 'text-4xl'} font-bold text-blue-700`}>
                    {safePessoaFisica}
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 font-medium`}>
                    {safePessoaFisica === 1 ? 'apólice' : 'apólices'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Pessoa Jurídica */}
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow w-full overflow-hidden">
            <CardContent className={`${isMobile ? 'p-2' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                  <div className={`${isMobile ? 'p-1' : 'p-3'} bg-purple-500 rounded-xl shadow-lg`}>
                    <Building className={`${isMobile ? 'h-3 w-3' : 'h-8 w-8'} text-white`} />
                  </div>
                  <div>
                    <h3 className={`${isMobile ? 'text-xs' : 'text-xl'} font-bold text-purple-900`}>
                      {isMobile ? 'P. Jurídica' : 'Pessoa Jurídica'}
                    </h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-600 font-medium`}>CNPJ</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${isMobile ? 'text-lg' : 'text-4xl'} font-bold text-purple-700`}>
                    {safePessoaJuridica}
                  </div>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-600 font-medium`}>
                    {safePessoaJuridica === 1 ? 'apólice' : 'apólices'}
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
