
import { InsurerDistributionChart } from './charts/InsurerDistributionChart';
import { InsuranceTypesChart } from './charts/InsuranceTypesChart';
import { CostEvolutionChart } from './charts/CostEvolutionChart';
import { ExpirationTimelineChart } from './charts/ExpirationTimelineChart';
import { ComparativeAnalysisChart } from './charts/ComparativeAnalysisChart';

interface ChartsSectionProps {
  detailed?: boolean;
}

export const ChartsSection = ({ detailed = false }: ChartsSectionProps) => {
  return (
    <div className="w-full space-y-6">
      {/* First Row - Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsurerDistributionChart />
        <InsuranceTypesChart />
      </div>

      {/* Second Row - Two charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostEvolutionChart />
        <ExpirationTimelineChart />
      </div>

      {detailed && (
        <div className="w-full">
          <ComparativeAnalysisChart />
        </div>
      )}
    </div>
  );
};
