import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, LogOut, UserCheck } from 'lucide-react';

const INACTIVITY_TIMEOUT = 30 * 1000; // 30 segundos
const COUNTDOWN_DURATION = 30; // 30 segundos para responder

interface SessionTimeoutGuardProps {
  children: React.ReactNode;
}

export const SessionTimeoutGuard: React.FC<SessionTimeoutGuardProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    setShowModal(false);
    await signOut();
  }, [signOut, clearTimers]);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_DURATION);
    setShowModal(true);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogout]);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    
    // Se o modal já está aberto, não reseta
    if (showModal) return;
    
    clearTimers();
    
    inactivityTimerRef.current = setTimeout(() => {
      startCountdown();
    }, INACTIVITY_TIMEOUT);
  }, [user, showModal, clearTimers, startCountdown]);

  const handleStayLoggedIn = useCallback(() => {
    clearTimers();
    setShowModal(false);
    setCountdown(COUNTDOWN_DURATION);
    resetInactivityTimer();
  }, [clearTimers, resetInactivityTimer]);

  // Setup activity listeners
  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [user, resetInactivityTimer, clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      <AlertDialog open={showModal} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-6 w-6 text-amber-500" />
              Sessão Inativa
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-base">
                Sua sessão está prestes a expirar por inatividade.
              </p>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (countdown / COUNTDOWN_DURATION) * 264}
                      className="text-amber-500 transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">
                    {countdown}
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Você ainda está aí?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:gap-2">
            <AlertDialogCancel
              onClick={handleLogout}
              className="flex-1 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <LogOut className="h-4 w-4" />
              Não, sair
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStayLoggedIn}
              className="flex-1 gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Sim, continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SessionTimeoutGuard;
