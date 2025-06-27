
export interface InsurerConfig {
  name: string;
  keywords: string[];
  patterns: {
    policyNumber: RegExp;
    annualPremium: RegExp;
    monthlyPremium: RegExp;
    startDate: RegExp;
    endDate: RegExp;
    insuredName?: RegExp;
    vehicleBrand?: RegExp;
    vehicleModel?: RegExp;
    brokerSection?: RegExp;
  };
  defaultCategory: string;
  defaultCoverage: string;
}
