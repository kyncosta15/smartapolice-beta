import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientPreview {
  id: string;
  initials: string;
}

const AVATAR_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-accent text-accent-foreground',
  'bg-muted text-foreground',
  'bg-primary/80 text-primary-foreground',
];

const FALLBACK_TOTAL = 33;
const FALLBACK_CLIENTS = [
  'Cliente - sandbox@rcaldas.com.br',
  'Cliente - financeiro@grupoassuncao.net',
  'Cliente - gestao.operacional@plazadoro.com.br',
  'Cliente - contato@andradesimoes.com.br',
];

const getInitials = (name: string): string => {
  // Strip prefixes like "Cliente - "
  const cleaned = name.replace(/^Cliente\s*-\s*/i, '').trim();

  // If it's an email, take the part before @ and the domain
  if (cleaned.includes('@')) {
    const [local, domain] = cleaned.split('@');
    const domainName = domain.split('.')[0];
    return (local.charAt(0) + domainName.charAt(0)).toUpperCase();
  }

  // Otherwise, take first letters of first two words
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

const toPreview = (name: string, id: string): ClientPreview => ({
  id,
  initials: getInitials(name),
});

export const ClientsSocialProof = () => {
  const [previews, setPreviews] = useState<ClientPreview[]>(() =>
    FALLBACK_CLIENTS.map((name, index) => toPreview(name, `fallback-${index}`))
  );
  const [total, setTotal] = useState<number>(FALLBACK_TOTAL);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, count } = await supabase
          .from('empresas')
          .select('id, nome', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (!data) return;

        const real = data.filter((e) => {
          const name = (e.nome || '').toLowerCase();
          return (
            name !== 'clientes individuais' &&
            !name.includes('@gmail.com') &&
            !name.includes('@hotmail.com') &&
            !name.includes('@outlook.com')
          );
        });

        if (real.length > 0) {
          setTotal(Math.max(count ?? real.length, real.length));
          setPreviews(real.slice(0, 4).map((e) => toPreview(e.nome, e.id)));
        }
      } catch (error) {
        console.error('Clients social proof fallback enabled:', error);
      }
    };

    load();
  }, []);

  return (
    <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/40">
      <div className="flex -space-x-2">
        {previews.map((client, i) => (
          <div
            key={client.id}
            className={`w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-semibold ${
              AVATAR_COLORS[i % AVATAR_COLORS.length]
            }`}
            title={client.initials}
          >
            {client.initials}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">+{total} clientes</span> confiam no SmartControl
      </p>
    </div>
  );
};
