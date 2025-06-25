
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
      {/* Charts arranged vertically - one per row for better readability */}
      <div className="w-full">
        <CostEvolutionChart />
      </div>

      <div className="w-full">
        <InsurerDistributionChart />
      </div>

      <div className="w-full">
        <InsuranceTypesChart />
      </div>

      <div className="w-full">
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
