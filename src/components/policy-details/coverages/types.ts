
export interface Coverage {
  id?: string;
  descricao: string;
  lmi?: number;
}

export interface CoverageHookReturn {
  coverages: Coverage[];
  setCoverages: React.Dispatch<React.SetStateAction<Coverage[]>>;
  isLoaded: boolean;
  loadCoveragesFromDB: () => Promise<void>;
  saveCoverage: (coverage: Coverage) => Promise<void>;
  deleteCoverage: (coverageId: string) => Promise<void>;
}
