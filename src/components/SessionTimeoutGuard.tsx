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

// Regra pedida: expirar após 30s sem interação.
// Para conseguir perguntar "você ainda está aí?", abrimos o modal nos últimos 10s.
const INACTIVITY_LIMIT_MS = 30_000;
const CONFIRM_WINDOW_SECONDS = 10;
const WARNING_START_MS = INACTIVITY_LIMIT_MS - CONFIRM_WINDOW_SECONDS * 1000; // 20s

interface SessionTimeoutGuardProps {
  children: React.ReactNode;
}

export const SessionTimeoutGuard: React.FC<SessionTimeoutGuardProps> = ({ children }) => {
  const { user, signOut } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(CONFIRM_WINDOW_SECONDS);

  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);

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
    clearTimers();
    setShowModal(false);
    try {
      await signOut();
    } catch {
      // noop
    }
  }, [clearTimers, signOut]);

  const startWarningModal = useCallback(() => {
    // Evita múltiplos intervals em dev (StrictMode) / re-entrância.
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

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

    // Não reinicia timers enquanto o modal está aberto (o usuário deve responder Sim/Não)
    if (showModal) return;

    clearTimers();

    warningTimeoutRef.current = setTimeout(() => {
      startWarningModal();
    }, Math.max(0, WARNING_START_MS));

    logoutTimeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_LIMIT_MS);
  }, [user, showModal, clearTimers, startWarningModal, handleLogout]);

  const handleStayLoggedIn = useCallback(() => {
    clearTimers();
    setShowModal(false);
    setCountdown(CONFIRM_WINDOW_SECONDS);

    // Reagenda após fechar (garante que não depende do showModal ainda true nesta render)
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
      if (showModal) return;

      // Evita “falso mousemove” quando o layout anima sob o cursor.
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

    // Timer inicial
    scheduleInactivityTimers();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [user, showModal, scheduleInactivityTimers, clearTimers]);

  if (!user) return <>{children}</>;

  return (
    <>
      {children}

      <AlertDialog open={showModal} onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-6 w-6 text-primary" />
              Sessão Inativa
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-base">Sua sessão vai expirar por inatividade.</p>

              <div className="flex items-center justify-center py-4">
                <div className="relative h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90 transform">
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
                      strokeDashoffset={264 - (countdown / CONFIRM_WINDOW_SECONDS) * 264}
                      className="text-primary transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">
                    {countdown}
                  </span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground">Você ainda está aí?</p>
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
            <AlertDialogAction onClick={handleStayLoggedIn} className="flex-1 gap-2">
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
