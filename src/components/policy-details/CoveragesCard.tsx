
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Coverage {
  descricao: string;
  lmi?: number;
}

interface CoveragesCardProps {
  coverages: Coverage[] | string[];
}

export const CoveragesCard = ({ coverages }: CoveragesCardProps) => {
  // Normalize coverages to handle both string array and object array formats
  const normalizedCoverages = coverages?.map(coverage => {
    if (typeof coverage === 'string') {
      return { descricao: coverage };
    }
    return coverage;
  }) || [];

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden h-fit">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
          <Shield className="h-6 w-6 mr-3 text-blue-600 flex-shrink-0" />
          Coberturas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {normalizedCoverages && normalizedCoverages.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {normalizedCoverages.map((coverage, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 flex items-start gap-3 hover:shadow-md transition-shadow"
              >
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800 font-sf-pro leading-relaxed">
                      {coverage.descricao}
                    </span>
                    {coverage.lmi && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-center">
                        LMI: {formatCurrency(coverage.lmi)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-blue-300 mx-auto mb-3" />
            <p className="text-blue-600 font-medium">
              Coberturas não informadas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
