
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle } from 'lucide-react';

interface CoveragesCardProps {
  coverages: string[];
}

export const CoveragesCard = ({ coverages }: CoveragesCardProps) => {
  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
          <Shield className="h-6 w-6 mr-3 text-blue-600" />
          Coberturas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {coverages && coverages.length > 0 ? (
          <div className="space-y-3">
            {coverages.map((coverage, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 flex items-start gap-3"
              >
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 font-sf-pro leading-relaxed">
                  {coverage}
                </span>
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
