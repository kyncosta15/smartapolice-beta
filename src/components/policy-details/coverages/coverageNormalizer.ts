
import { Coverage } from './types';

export const normalizeInitialCoverages = (initialCoverages: Coverage[] | string[]): Coverage[] => {
  return initialCoverages.map((coverage, index) => {
    if (typeof coverage === 'string') {
      return { 
        id: `temp-${index}`, 
        descricao: coverage,
        lmi: undefined
      };
    }
    return {
      ...coverage,
      id: coverage.id || `temp-${index}`
    };
  });
};
