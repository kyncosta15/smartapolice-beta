import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

type Item = { name: string; count: number };

type Props = {
  title: string;
  icon?: React.ReactNode;
  data: Item[];
  maxSlices?: number;
  colorScale?: string[];
};

const palette = [
  "#4F46E5", // indigo-600
  "#06B6D4", // cyan-500  
  "#84CC16", // lime-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#22C55E", // green-500
  "#3B82F6", // blue-500
  "#F43F5E", // rose-500
  "#14B8A6", // teal-500
];

export default function PieCard({ 
  title, 
  icon, 
  data, 
  maxSlices = 8, 
  colorScale = palette 
}: Props) {
  const [showLegend, setShowLegend] = useState(false);

  const chartData = useMemo(() => {
    const sorted = [...data]
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);
    
    if (sorted.length <= maxSlices) {
      return sorted.map((item, index) => ({
        ...item,
        color: colorScale[index % colorScale.length]
      }));
    }
    
    const top = sorted.slice(0, maxSlices - 1);
    const rest = sorted.slice(maxSlices - 1);
    const outrosCount = rest.reduce((sum, item) => sum + item.count, 0);
    
    const result = [
      ...top.map((item, index) => ({
        ...item,
        color: colorScale[index % colorScale.length]
      })),
      {
        name: "Outros",
        count: outrosCount,
        color: colorScale[(maxSlices - 1) % colorScale.length]
      }
    ];
    
    return result;
  }, [data, maxSlices, colorScale]);

  const total = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.count, 0), 
    [chartData]
  );

  const CustomLegend = () => (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
      {chartData.map((entry, index) => {
        const percentage = total > 0 ? Math.round((entry.count / total) * 100) : 0;
        return (
          <div 
            key={`legend-${index}`} 
            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
            role="listitem"
            aria-label={`${entry.name}: ${entry.count} veículos, ${percentage}%`}
          >
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground leading-tight">
                {entry.name}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {entry.count} veículo{entry.count !== 1 ? 's' : ''} ({percentage}%)
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    
    const data = payload[0].payload;
    const percentage = total > 0 ? Math.round((data.count / total) * 100) : 0;
    
    return (
      <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
        <div className="font-medium text-foreground">{data.name}</div>
        <div className="text-sm text-muted-foreground">
          {data.count} veículo{data.count !== 1 ? 's' : ''} ({percentage}%)
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card className="rounded-xl border-border bg-card">
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl bg-background/60 dark:bg-background/40 backdrop-blur-xl border-border/50">
      <CardHeader className="pb-2 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="xl:hidden"
            onClick={() => setShowLegend(!showLegend)}
            aria-expanded={showLegend}
            aria-controls={`legend-${title.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {showLegend ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Esconder
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Ver legenda
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_180px] gap-4 items-start">
          {/* Chart Area */}
          <div className="chart-root h-64 w-full min-w-0 bg-card rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%" className="!bg-transparent">
              <PieChart aria-label={`Gráfico de ${title}`}>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  isAnimationActive={false}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip content={renderTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Desktop Legend - Always Visible */}
          <div className="hidden xl:block">
            <div className="text-xs font-medium text-muted-foreground mb-2">Legenda</div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20">
              {chartData.map((entry, index) => {
                const percentage = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                return (
                  <div 
                    key={`legend-${index}`} 
                    className="flex items-start gap-1.5 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                    role="listitem"
                    aria-label={`${entry.name}: ${entry.count} veículos, ${percentage}%`}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: entry.color }}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground leading-tight truncate">
                        {entry.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {entry.count} ({percentage}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile/Tablet Legend - Collapsible */}
          <div 
            className={`xl:hidden transition-all duration-200 ease-in-out ${
              showLegend ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
            id={`legend-${title.replace(/\s+/g, '-').toLowerCase()}`}
            role="list"
            aria-label={`Legenda do gráfico ${title}`}
          >
            <div className="text-sm font-medium text-muted-foreground mb-3">Legenda</div>
            <CustomLegend />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}