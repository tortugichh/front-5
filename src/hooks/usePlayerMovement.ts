import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface UsePlayerMovementProps {
  playerId: string | null;
  initialX: number;
  initialY: number;
  gameWidth: number;
  gameHeight: number;
  playerSize: number;
}

const usePlayerMovement = ({
  playerId,
  initialX,
  initialY,
  gameWidth,
  gameHeight,
  playerSize,
}: UsePlayerMovementProps) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });

  // Effect to update position in DB when local position changes
  useEffect(() => {
    if (!playerId) return;

    const updatePlayerPosition = async () => {
      const { error } = await supabase
        .from('players')
        .update({ x: position.x, y: position.y })
        .eq('id', playerId);

      if (error) {
        console.error('Error updating player position:', error);
      }
    };

    // Avoid updating immediately on mount with initial position
    if (position.x !== initialX || position.y !== initialY) {
      updatePlayerPosition();
    }
  }, [position, playerId, initialX, initialY]);

  // Effect to handle keyboard input
  useEffect(() => {
    if (!playerId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      setPosition((prevPosition) => {
        let newX = prevPosition.x;
        let newY = prevPosition.y;
        const step = 5; // Increased from 1 to 5 for faster movement

        switch (event.key.toLowerCase()) {
          case 'w':
            newY -= step;
            break;
          case 's':
            newY += step;
            break;
          case 'a':
            newX -= step;
            break;
          case 'd':
            newX += step;
            break;
          default:
            return prevPosition; // No change for other keys
        }

        // Clamp position within game boundaries
        newX = Math.max(0, Math.min(newX, gameWidth - playerSize));
        newY = Math.max(0, Math.min(newY, gameHeight - playerSize));

        return { x: newX, y: newY };
      });
    };

    // Add support for continuous movement while key is held down
    let isMoving = false;
    let moveInterval: NodeJS.Timeout | null = null;

    const startMoving = (event: KeyboardEvent) => {
      if (!isMoving) {
        isMoving = true;
        handleKeyDown(event);
        moveInterval = setInterval(() => handleKeyDown(event), 16); 
      }
    };

    const stopMoving = () => {
      isMoving = false;
      if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
      }
    };

    window.addEventListener('keydown', startMoving);
    window.addEventListener('keyup', stopMoving);

    return () => {
      window.removeEventListener('keydown', startMoving);
      window.removeEventListener('keyup', stopMoving);
      if (moveInterval) {
        clearInterval(moveInterval);
      }
    };
  }, [playerId, gameWidth, gameHeight, playerSize]);

  return position;
};

export default usePlayerMovement;