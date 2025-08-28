
import { useState } from 'react';
import { DashboardContent } from '@/components/DashboardContent';

export default function Index() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <DashboardContent 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
    />
  );
}
