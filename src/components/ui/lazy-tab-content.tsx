import React from 'react';
import { TabsContent } from '@/components/ui/tabs';

interface LazyTabContentProps extends React.ComponentPropsWithoutRef<typeof TabsContent> {
  /** Aba ativa atualmente. Quando bate com `value`, o conteúdo monta. */
  activeValue: string;
  /** Após montado, mantém renderizado mesmo quando o usuário troca de aba (cache visual). */
  keepMounted?: boolean;
  children: React.ReactNode;
}

/**
 * TabsContent com mount preguiçoso (lazy):
 * - Não monta o conteúdo até a aba ser acessada pela primeira vez.
 * - Por padrão, mantém o conteúdo no DOM depois (keepMounted=true) para evitar
 *   re-fetch e perder estado ao alternar entre abas.
 *
 * Combinado com React Query (stale-while-revalidate), entrega navegação
 * instantânea entre abas já visitadas.
 */
export function LazyTabContent({
  value,
  activeValue,
  keepMounted = true,
  children,
  ...rest
}: LazyTabContentProps) {
  const isActive = activeValue === value;
  const wasActiveRef = React.useRef(false);

  if (isActive) {
    wasActiveRef.current = true;
  }

  const shouldRender = isActive || (keepMounted && wasActiveRef.current);

  return (
    <TabsContent value={value} {...rest}>
      {shouldRender ? children : null}
    </TabsContent>
  );
}
