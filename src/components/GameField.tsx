import React, { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';
import useRealtimePlayers from '../hooks/useRealtimePlayers';
import usePlayerMovement from '../hooks/usePlayerMovement';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 30; // Increased player size
const INITIAL_X = Math.floor(GAME_WIDTH / 2);
const INITIAL_Y = Math.floor(GAME_HEIGHT / 2);

interface GameFieldProps {
  playerName: string;
}

const GameField: React.FC<GameFieldProps> = ({ playerName }) => {
  const players = useRealtimePlayers();
  const currentPlayerRef = useRef<{ id: string | null; cleanup: (() => void) | null }>({
    id: null,
    cleanup: null,
  });

  // Get current player position
  const position = usePlayerMovement({
    playerId: currentPlayerRef.current.id,
    initialX: INITIAL_X,
    initialY: INITIAL_Y,
    gameWidth: GAME_WIDTH,
    gameHeight: GAME_HEIGHT,
    playerSize: PLAYER_SIZE,
  });

  useEffect(() => {
    const setupPlayer = async () => {
      const playerId = uuidv4();
      // Generate a more vibrant random color
      const hue = Math.random() * 360;
      const color = `hsl(${hue}, 70%, 50%)`; // Using HSL for more vibrant colors
      const name = playerName || `Player_${Math.random().toString(36).substring(7)}`;

      const { error } = await supabase.from('players').insert([
        {
          id: playerId,
          x: INITIAL_X,
          y: INITIAL_Y,
          color: color,
          name: name,
        },
      ]);

      if (error) {
        console.error('Error inserting player:', error);
      } else {
        currentPlayerRef.current.id = playerId;
        console.log('Player joined:', playerId);

        const cleanup = async () => {
          if (currentPlayerRef.current.id) {
            console.log('Player leaving:', currentPlayerRef.current.id);
            await supabase
              .from('players')
              .delete()
              .eq('id', currentPlayerRef.current.id);
          }
        };

        currentPlayerRef.current.cleanup = cleanup;
      }
    };

    setupPlayer();

    return () => {
      if (currentPlayerRef.current.cleanup) {
        currentPlayerRef.current.cleanup();
      }
    };
  }, [playerName]);

  return (
    <div className="game-container">
      <div
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          backgroundColor: '#1a1a2e', // Darker, more modern background
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #30305a',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(0,0,0,0.3)',
        }}
      >
        {players.map((player) => (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              left: player.id === currentPlayerRef.current.id ? position.x : player.x,
              top: player.id === currentPlayerRef.current.id ? position.y : player.y,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              backgroundColor: player.color,
              transition: 'all 0.05s linear',
              transform: `scale(${player.id === currentPlayerRef.current.id ? 1.2 : 1})`,
              borderRadius: '8px',
              boxShadow: `0 0 20px ${player.color}80`, // Glow effect using player color
              zIndex: player.id === currentPlayerRef.current.id ? 2 : 1,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -20,
                left: '50%',
                transform: 'translateX(-50%)',
                color: player.color,
                fontSize: '12px',
                whiteSpace: 'nowrap',
                textShadow: '0 0 4px rgba(0,0,0,0.5)',
              }}
            >
              {player.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameField;