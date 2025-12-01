import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Lock, Mail, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
  userId: string;
}

export function TermsModal({ open, onAccept, userId }: TermsModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          termos_aceitos: true,
          termos_aceitos_em: new Date().toISOString(),
          termos_versao: "1.0",
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Termos aceitos com sucesso!");
      onAccept();
    } catch (error: any) {
      console.error("Erro ao salvar aceite dos termos:", error);
      toast.error("Erro ao salvar aceite. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Termos de Uso e Autorização</DialogTitle>
              <DialogDescription className="text-sm">
                RCORP | SmartApólice
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6">
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              Ao acessar e utilizar o sistema RCORP (SmartApólice), o usuário declara estar ciente e de acordo com os seguintes termos:
            </p>

            {/* Finalidade do Sistema */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Shield className="h-5 w-5 text-primary" />
                <span>Finalidade do Sistema</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                O SmartApólice é uma ferramenta gratuita disponibilizada pela RCaldas Corretora de Seguros, com o objetivo de facilitar a gestão de apólices e oferecer ao usuário maior transparência sobre seus seguros vigentes.
              </p>
            </div>

            {/* Tratamento de Dados */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Lock className="h-5 w-5 text-primary" />
                <span>Tratamento de Dados Pessoais</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                Em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD), os dados pessoais e contratuais informados ou extraídos das apólices serão utilizados exclusivamente para fins de análise, atualização, auditoria e oferta de novas cotações personalizadas no momento da renovação de cada seguro.
              </p>
            </div>

            {/* Base Legal */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <FileText className="h-5 w-5 text-primary" />
                <span>Base Legal</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                O tratamento dos dados é realizado com base no consentimento do titular (art. 7º, I da LGPD) e no legítimo interesse da corretora (art. 7º, IX da LGPD), sempre garantindo a segurança, confidencialidade e finalidade específica dos dados coletados.
              </p>
            </div>

            {/* Compartilhamento e Segurança */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Shield className="h-5 w-5 text-primary" />
                <span>Compartilhamento e Segurança</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                As informações são armazenadas em ambiente seguro, com acesso restrito à equipe técnica da RCaldas e parceiros homologados. Nenhum dado é compartilhado com terceiros sem autorização expressa do usuário.
              </p>
            </div>

            {/* Direitos do Titular */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Mail className="h-5 w-5 text-primary" />
                <span>Direitos do Titular</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                O usuário pode, a qualquer momento, solicitar acesso, correção, exclusão ou portabilidade dos seus dados, conforme previsto na LGPD, através do canal oficial:{" "}
                <a href="mailto:privacidade@rcaldas.com.br" className="text-primary hover:underline">
                  privacidade@rcaldas.com.br
                </a>
              </p>
            </div>

            {/* Consentimento */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Consentimento</span>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                Ao utilizar o sistema, o usuário autoriza a RCaldas Corretora a reanalisar suas apólices periodicamente e oferecer novas propostas de cotação no momento das renovações, sem qualquer custo adicional.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t flex-col gap-4">
          <div className="flex items-start gap-3 w-full">
            <Checkbox
              id="terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-1"
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-relaxed cursor-pointer select-none"
            >
              Declaro que li e aceito os Termos de Uso e Autorização acima.
            </label>
          </div>
          
          <Button
            onClick={handleAccept}
            disabled={!accepted || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Salvando..." : "Aceitar e Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
