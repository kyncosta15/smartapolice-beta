import React, { useEffect, useState } from 'react';
import { InteractiveTour } from './InteractiveTour';
import { useAuth } from '@/contexts/AuthContext';

export function TourManager() {
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Verificar se o usuário já viu o tour
    const tourKey = `tour_completed_${user.id}`;
    const hasSeenTour = localStorage.getItem(tourKey);

    if (!hasSeenTour) {
      // Aguardar um pouco para a interface carregar
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleTourComplete = () => {
    if (user) {
      const tourKey = `tour_completed_${user.id}`;
      localStorage.setItem(tourKey, 'true');
    }
    setShowTour(false);
  };

  return (
    <InteractiveTour
      isActive={showTour}
      onClose={handleTourComplete}
    />
  );
}