import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Player {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

interface PostgresChanges {
  new: Player;
  old: Player;
}

const useRealtimePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribed = useRef(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('id, x, y, color, name');

      if (error) {
        console.error('Error fetching players:', error);
      } else {
        setPlayers(data || []);
      }
    };

    if (!isSubscribed.current) {
      isSubscribed.current = true;
      
      channelRef.current = supabase.channel('players_realtime');
      
      channelRef.current
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'players' },
          (payload: RealtimePostgresChangesPayload<PostgresChanges>) => {
            if (payload.new) {
              setPlayers((current) => [...current, payload.new as Player]);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'players' },
          (payload: RealtimePostgresChangesPayload<PostgresChanges>) => {
            if (payload.new) {
              setPlayers((current) =>
                current.map((player) =>
                  player.id === (payload.new as Player).id ? (payload.new as Player) : player
                )
              );
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'players' },
          (payload: RealtimePostgresChangesPayload<PostgresChanges>) => {
            if (payload.old) {
              setPlayers((current) =>
                current.filter((player) => player.id !== (payload.old as Player).id)
              );
            }
          }
        );

      channelRef.current.subscribe();
      fetchPlayers();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribed.current = false;
      }
    };
  }, []);

  return players;
};

export default useRealtimePlayers;