import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export function useRealtime(
  mutate: (...args: any[]) => void,
  channels: RealtimeConfig[]
) {
  useEffect(() => {
    const subscriptions = channels.map(({ table, event = '*' }) =>
      supabase
        .channel(`${table}-realtime`)
        .on(
          'postgres_changes' as any,
          { event, schema: 'public', table },
          (payload) => {
            console.log(`🔄 Realtime update on ${table}:`, payload);
            mutate();
          }
        )
        .subscribe()
    );

    return () => {
      subscriptions.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [mutate, channels]);
}