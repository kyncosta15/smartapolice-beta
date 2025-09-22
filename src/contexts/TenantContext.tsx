import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface TenantContextType {
  activeEmpresaId: string | null;
  activeEmpresaName: string | null;
  setActiveEmpresa: (empresaId: string) => void;
  memberships: any[];
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { memberships, activeEmpresa, setDefaultEmpresa, loading } = useUserProfile();
  const [activeEmpresaName, setActiveEmpresaName] = useState<string | null>(null);

  useEffect(() => {
    if (activeEmpresa && memberships.length > 0) {
      const empresaData = memberships.find(m => m.empresa_id === activeEmpresa);
      setActiveEmpresaName(empresaData?.empresa?.nome || null);
    }
  }, [activeEmpresa, memberships]);

  const handleSetActiveEmpresa = async (empresaId: string) => {
    await setDefaultEmpresa(empresaId);
  };

  return (
    <TenantContext.Provider
      value={{
        activeEmpresaId: activeEmpresa,
        activeEmpresaName,
        setActiveEmpresa: handleSetActiveEmpresa,
        memberships,
        loading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}