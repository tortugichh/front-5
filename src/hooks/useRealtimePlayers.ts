import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface Player {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

const useRealtimePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);

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

    // Set up real-time subscription
    const channel = supabase
      .channel('players_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'players' },
        (payload) => {
          console.log('INSERT', payload);
          setPlayers((currentPlayers) => [...currentPlayers, payload.new as Player]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'players' },
        (payload) => {
          console.log('UPDATE', payload);
          setPlayers((currentPlayers) =>
            currentPlayers.map((player) =>
              player.id === payload.new.id ? (payload.new as Player) : player
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'players' },
        (payload) => {
          console.log('DELETE', payload);
          setPlayers((currentPlayers) =>
            currentPlayers.filter((player) => player.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); 

  return players;
};

export default useRealtimePlayers; 