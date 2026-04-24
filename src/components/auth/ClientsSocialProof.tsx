import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientPreview {
  id: string;
  initials: string;
}

const AVATAR_COLORS = [
  'bg-[hsl(230,80%,55%)]',
  'bg-[hsl(280,70%,55%)]',
  'bg-[hsl(180,70%,45%)]',
  'bg-[hsl(20,85%,55%)]',
  'bg-[hsl(340,75%,55%)]',
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

export const ClientsSocialProof = () => {
  const [previews, setPreviews] = useState<ClientPreview[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const { data, count } = await supabase
        .from('empresas')
        .select('id, nome', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (!data) return;

      // Filter out generic placeholders
      const real = data.filter((e) => {
        const name = (e.nome || '').toLowerCase();
        return (
          name !== 'clientes individuais' &&
          !name.includes('@gmail.com') &&
          !name.includes('@hotmail.com') &&
          !name.includes('@outlook.com')
        );
      });

      setTotal(count ?? data.length);
      setPreviews(
        real.slice(0, 4).map((e) => ({
          id: e.id,
          initials: getInitials(e.nome),
        }))
      );
    };

    load();
  }, []);

  if (total === 0) return null;

  return (
    <div className="hidden lg:flex items-center gap-3 mt-10 pt-6 border-t border-border/40">
      <div className="flex -space-x-2">
        {previews.map((client, i) => (
          <div
            key={client.id}
            className={`w-8 h-8 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-semibold text-white ${
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
