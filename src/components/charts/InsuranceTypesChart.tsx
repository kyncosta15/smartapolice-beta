
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { typeData, renderCustomLabel } from './chartData';

export const InsuranceTypesChart = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Tipos de Seguro</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="60%"
                fill="#8884d8"
                dataKey="value"
                label={renderCustomLabel}
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Participação']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {typeData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600 text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-800">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
