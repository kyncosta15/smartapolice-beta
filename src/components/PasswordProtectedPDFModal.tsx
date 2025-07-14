
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordProtectedPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordSubmit: (password: string) => Promise<boolean>;
  fileName: string;
  maxAttempts?: number;
}

export function PasswordProtectedPDFModal({ 
  isOpen, 
  onClose, 
  onPasswordSubmit, 
  fileName,
  maxAttempts = 3 
}: PasswordProtectedPDFModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Por favor, insira a senha');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValid = await onPasswordSubmit(password);
      
      if (isValid) {
        toast({
          title: "✅ PDF Desbloqueado",
          description: "Senha correta! Prosseguindo com a extração dos dados.",
        });
        handleClose();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          toast({
            title: "❌ Limite de Tentativas Excedido",
            description: `Máximo de ${maxAttempts} tentativas atingido. O arquivo será descartado.`,
            variant: "destructive",
          });
          handleClose();
        } else {
          setError(`Senha inválida. Tentativa ${newAttempts} de ${maxAttempts}. Tente novamente.`);
          setPassword('');
        }
      }
    } catch (error) {
      console.error('Erro ao validar senha:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setAttempts(0);
    setShowPassword(false);
    onClose();
  };

  const handleCancel = () => {
    toast({
      title: "🚫 Upload Cancelado",
      description: "O arquivo foi descartado pois o desbloqueio foi cancelado.",
      variant: "destructive",
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <span>PDF Protegido por Senha</span>
          </DialogTitle>
          <DialogDescription>
            Detectamos que este PDF está protegido por senha. Insira a senha para prosseguir com a leitura e extração dos dados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-start">
              <div className="ml-2">
                <p className="text-sm font-medium text-blue-800">Arquivo:</p>
                <p className="text-sm text-blue-700 truncate">{fileName}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha do PDF
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha..."
                  className="pr-10"
                  disabled={isLoading}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {attempts > 0 && attempts < maxAttempts && (
              <div className="text-sm text-orange-600">
                Tentativas restantes: {maxAttempts - attempts}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="flex-1"
              >
                {isLoading ? 'Validando...' : 'Confirmar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
