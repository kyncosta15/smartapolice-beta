import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Users, Car, FileText, AlertCircle, Clock, Mail, User, Trash2 } from 'lucide-react';
import type { CompanySummary } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCompanyDetails } from '@/hooks/useCompanyDetails';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { useState } from 'react';
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

interface CompanySidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanySummary | null;
}

export function CompanySidePanel({ open, onOpenChange, company }: CompanySidePanelProps) {
  const { details, loading } = useCompanyDetails(company?.empresa_id || null);
  const { deleteUser, deleting } = useAdminMetrics();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  if (!company) return null;

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const success = await deleteUser(userToDelete);
    if (success) {
      setUserToDelete(null);
      // Recarregar detalhes
      window.location.reload();
    }
  };

  const displayData = details || company;

  const stats: Array<{
    label: string;
    value: number;
    subtitle?: string;
    icon: any;
    color: string;
  }> = [
    {
      label: 'Usuários',
      value: displayData.usuarios,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Veículos',
      value: displayData.veiculos,
      icon: Car,
      color: 'text-green-600',
    },
    {
      label: 'Apólices',
      value: displayData.apolices,
      subtitle: details ? `${details.apolices_ativas} ativas` : undefined,
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      label: 'Sinistros',
      value: displayData.sinistros_abertos,
      subtitle: details ? `${details.sinistros_total} total` : undefined,
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      label: 'Assistências',
      value: displayData.assistencias_abertas,
      subtitle: details ? `${details.assistencias_total} total` : undefined,
      icon: AlertCircle,
      color: 'text-orange-600',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.empresa_nome}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Informações da Conta */}
          {(company.conta_nome || company.conta_email) && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Conta Responsável
                  </div>
                  {company.conta_nome && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{company.conta_nome}</span>
                    </div>
                  )}
                  {company.conta_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{company.conta_email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Última Atividade */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Última atividade:{' '}
                  {formatDistanceToNow(new Date(company.ultima_atividade), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              stats.map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-xs text-muted-foreground">
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      {stat.subtitle && (
                        <p className="text-xs text-muted-foreground">
                          {stat.subtitle}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Lista de Usuários */}
          {!loading && details?.users && details.users.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Usuários ({details.users.length})
                  </div>
                  {details.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {user.name || 'Sem nome'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {user.role}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => setUserToDelete(user.id)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={() => {
                onOpenChange(false);
                window.location.href = `/admin/empresa/${company.empresa_id}`;
              }}
            >
              Ver Dados Completos
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a deletar este usuário e todos os seus dados associados.
              <p className="mt-3 font-semibold text-destructive">Esta ação não pode ser desfeita!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deletando...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
