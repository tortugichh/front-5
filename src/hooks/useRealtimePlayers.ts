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

  useEffect(() => {
    // Fetch initial players
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

    fetchPlayers();

    // Set up real-time subscription only if we don't have a channel yet
    if (!channelRef.current) {
      channelRef.current = supabase
        .channel('players_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'players' },
          (payload: RealtimePostgresChangesPayload<PostgresChanges>) => {
            console.log('INSERT', payload);
            setPlayers((currentPlayers) => [...currentPlayers, payload.new as Player]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'players' },
          (payload: RealtimePostgresChangesPayload<PostgresChanges>) => {
            console.log('UPDATE', payload);
            setPlayers((currentPlayers) =>
              currentPlayers.map((player) =>
                player.id === (payload.new as Player).id ? (payload.new as Player) : player
              )
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'players' },
          (payload: RealtimePostgresChangesPayload<PostgresChanges>) => {
            console.log('DELETE', payload);
            setPlayers((currentPlayers) =>
              currentPlayers.filter((player) => player.id !== (payload.old as Player).id)
            );
          }
        )
        .subscribe();
    }

    // Cleanup subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); 

  return players;
};

export default useRealtimePlayers;