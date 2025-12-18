import React, { useCallback, useEffect, useRef, useState } from 'react';
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

// Tempo de ociosidade antes de aparecer o modal (10 minutos)
const INACTIVITY_WARNING_MS = 10 * 60 * 1000;
const CONFIRM_WINDOW_SECONDS = 10;
const INACTIVITY_LIMIT_MS = INACTIVITY_WARNING_MS + CONFIRM_WINDOW_SECONDS * 1000;

interface SessionTimeoutGuardProps {
  children: React.ReactNode;
}

export const SessionTimeoutGuard: React.FC<SessionTimeoutGuardProps> = ({ children }) => {
  const { user, signOut } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(CONFIRM_WINDOW_SECONDS);

  // Usar ref para evitar race-condition no instante em que o modal abre
  // (eventos de atividade podem disparar antes do React aplicar o novo state).
  const showModalRef = useRef(false);

  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  const clearTimers = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    showModalRef.current = false;
    clearTimers();
    setShowModal(false);
    try {
      await signOut();
    } catch {
      // noop
    }
  }, [clearTimers, signOut]);

  const startWarningModal = useCallback(() => {
    // Se já abriu, não reiniciar (evita resetar o contador)
    if (showModalRef.current) return;

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    showModalRef.current = true;
    setCountdown(CONFIRM_WINDOW_SECONDS);
    setShowModal(true);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        return next < 0 ? 0 : next;
      });
    }, 1000);
  }, []);

  const scheduleInactivityTimers = useCallback(() => {
    if (!user) return;
    if (showModalRef.current) return;

    clearTimers();

    warningTimeoutRef.current = setTimeout(() => {
      startWarningModal();
    }, INACTIVITY_WARNING_MS);

    logoutTimeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_LIMIT_MS);
  }, [user, clearTimers, startWarningModal, handleLogout]);

  const handleStayLoggedIn = useCallback(() => {
    showModalRef.current = false;
    clearTimers();
    setShowModal(false);
    setCountdown(CONFIRM_WINDOW_SECONDS);

    setTimeout(() => {
      scheduleInactivityTimers();
    }, 0);
  }, [clearTimers, scheduleInactivityTimers]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      setShowModal(false);
      return;
    }

    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'] as const;

    const handleActivity = (e: Event) => {
      if (showModalRef.current) return;

      if (e.type === 'pointermove') {
        const pe = e as PointerEvent;
        const next = { x: pe.clientX, y: pe.clientY };
        const last = lastPointerPosRef.current;
        if (last && last.x === next.x && last.y === next.y) return;
        lastPointerPosRef.current = next;
      }

      scheduleInactivityTimers();
    };

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    scheduleInactivityTimers();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [user, scheduleInactivityTimers, clearTimers]);

  if (!user) return <>{children}</>;

  // Calculate circle progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (countdown / CONFIRM_WINDOW_SECONDS) * circumference;

  return (
    <>
      {children}

      <AlertDialog open={showModal} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-sm border-0 shadow-2xl">
          <AlertDialogHeader className="space-y-4">
            <AlertDialogTitle className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary" />
              Sessão Inativa
            </AlertDialogTitle>
            
            <AlertDialogDescription asChild>
              <div className="space-y-6">
                <p className="text-center text-sm text-muted-foreground">
                  Sua sessão vai expirar por inatividade.
                </p>

                {/* Circular Progress Timer */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg 
                      width="140" 
                      height="140" 
                      viewBox="0 0 140 140"
                      className="transform -rotate-90"
                    >
                      {/* Background circle */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="6"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - progress}
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    
                    {/* Counter number */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold tabular-nums text-foreground">
                        {countdown}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-center text-base font-medium text-foreground">
                  Você ainda está aí?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 flex flex-row gap-3 sm:flex-row">
            <AlertDialogCancel
              onClick={handleLogout}
              className="flex-1 h-11 gap-2 border-2 border-destructive bg-transparent text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Não, sair
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStayLoggedIn} 
              className="flex-1 h-11 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
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
