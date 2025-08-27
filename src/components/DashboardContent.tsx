import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Shield, Upload, FileText, Users, TrendingUp, AlertTriangle, Plus, Settings, LogOut, Bell } from 'lucide-react';
import { DashboardCards } from './DashboardCards';
import { MyPolicies } from './MyPolicies';
import { EnhancedPDFUpload } from './EnhancedPDFUpload';
import { WelcomeSection } from './WelcomeSection';
import { ContactSection } from './ContactSection';
import { OptimizedSettings } from './OptimizedSettings';
import { AdminDashboardNew } from './AdminDashboardNew';
import { NewPolicyModal } from './NewPolicyModal';
import { AlertsPanel } from './AlertsPanel';
import N8NDataTester from './N8NDataTester';

export const DashboardContent = () => {
  const { user, logout } = useAuth();
  const { policies, isLoading, hasPersistedData } = usePersistedPolicies();
  const { totalValue, monthlySpending, pendingRenewals } = useDashboardData(policies);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewPolicyModal, setShowNewPolicyModal] = useState(false);

  useEffect(() => {
    console.log('🎯 DashboardContent render:', { 
      user: user?.name, 
      policiesCount: policies.length,
      activeTab 
    });
  }, [user, policies.length, activeTab]);

  const handleLogout = async () => {
    try {
      console.log('👋 Iniciando logout...');
      await logout();
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <WelcomeSection user={user} />
            <DashboardCards 
              totalValue={totalValue}
              monthlySpending={monthlySpending}
              totalPolicies={policies.length}
              pendingRenewals={pendingRenewals}
            />
            
            {/* Seção de teste N8N - apenas em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6">
                <N8NDataTester />
              </div>
            )}
          </div>
        );
      
      case 'policies':
        return <MyPolicies />;
      
      case 'upload':
        return <EnhancedPDFUpload />;
      
      case 'admin':
        return user?.role === 'administrador' ? <AdminDashboardNew /> : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Acesso restrito para administradores</p>
          </div>
        );
      
      case 'contacts':
        return <ContactSection />;
      
      case 'settings':
        return <OptimizedSettings />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SmartApólice</h1>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded tracking-wider">
                  BETA
                </span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <AlertsPanel />
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {user?.role === 'administrador' ? 'Admin' : 'Cliente'}
                  </Badge>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center space-x-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="policies" 
                className="flex items-center space-x-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Minhas Apólices</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="upload" 
                className="flex items-center space-x-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>

              {user?.role === 'administrador' && (
                <TabsTrigger 
                  value="admin" 
                  className="flex items-center space-x-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="contacts" 
                className="flex items-center space-x-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Contatos</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="settings" 
                className="flex items-center space-x-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </TabsTrigger>
            </TabsList>

            {/* Content */}
            <div className="min-h-[calc(100vh-8rem)]">
              <TabsContent value={activeTab} className="mt-6 pb-8">
                {renderTabContent()}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowNewPolicyModal(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* New Policy Modal */}
      <NewPolicyModal 
        isOpen={showNewPolicyModal}
        onClose={() => setShowNewPolicyModal(false)}
      />
    </div>
  );
};
