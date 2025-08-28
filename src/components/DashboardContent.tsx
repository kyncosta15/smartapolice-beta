import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Users, Wrench, Plus, RefreshCw } from 'lucide-react';
import { EnhancedPDFUpload } from './EnhancedPDFUpload';
import { DashboardCards } from './DashboardCards';
import { ChartsSection } from './ChartsSection';
import { PolicyTable } from './PolicyTable';
import { NewPolicyModal } from './NewPolicyModal';
import { AdminDashboardNew } from './AdminDashboardNew';
import { useAuth } from '@/contexts/AuthContext';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DashboardContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardContent({ activeTab, onTabChange }: DashboardContentProps) {
  const { user } = useAuth();
  const [isNewPolicyModalOpen, setIsNewPolicyModalOpen] = useState(false);
  const { dashboardData, isRefreshing, lastUpdate, refreshDashboard } = useDashboardData();
  const { 
    policies, 
    isLoading: isPoliciesLoading, 
    addPolicy, 
    refreshPolicies 
  } = usePersistedPolicies();

  // Função para lidar com políticas extraídas (agora com arquivo)
  const handlePolicyExtracted = async (policy: ParsedPolicyData, file?: File) => {
    console.log(`🎯 DashboardContent: Política extraída recebida:`, {
      policyName: policy.name,
      hasFile: !!file,
      fileName: file?.name
    });

    try {
      // Adicionar política com o arquivo para persistência completa
      const success = await addPolicy(policy, file);
      
      if (success) {
        console.log(`✅ Política ${policy.name} adicionada e persistida com sucesso`);
        
        // Atualizar dashboard após adicione
        setTimeout(() => {
          refreshDashboard();
          refreshPolicies();
        }, 1000);
      } else {
        console.error(`❌ Falha ao adicionar política ${policy.name}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar política extraída:', error);
    }
  };

  // Carregar dados do dashboard ao montar o componente
  useEffect(() => {
    if (user) {
      refreshDashboard();
      refreshPolicies();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Faça login para acessar o dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie suas apólices e acompanhe métricas importantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setIsNewPolicyModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Apólice
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload de PDFs
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Minhas Apólices
          </TabsTrigger>
          {user.role === 'administrador' && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Administração
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardCards 
            totalPolicies={dashboardData.totalPolicies}
            monthlySpending={dashboardData.monthlySpending}
            pendingRenewals={dashboardData.pendingRenewals}
            totalValue={dashboardData.totalValue}
          />
          <ChartsSection />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <EnhancedPDFUpload onPolicyExtracted={handlePolicyExtracted} />
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <PolicyTable policies={policies} isLoading={isPoliciesLoading} />
        </TabsContent>

        {user.role === 'administrador' && (
          <TabsContent value="admin" className="space-y-6">
            <AdminDashboardNew policies={policies} allUsers={[]} />
          </TabsContent>
        )}
      </Tabs>

      <NewPolicyModal
        isOpen={isNewPolicyModalOpen}
        onClose={() => setIsNewPolicyModalOpen(false)}
        policy={null}
      />
    </div>
  );
}
