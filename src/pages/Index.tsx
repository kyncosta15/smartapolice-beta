
import { useState } from 'react';
import { DashboardContent } from '@/components/DashboardContent';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardContent 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
    </div>
  );
}
