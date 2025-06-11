import React from 'react';

interface Player {
  id: string;
  name: string;
  color: string;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  return (
    <div className="player-list">
      <h2 className="text-2xl font-bold mb-4 text-white">Players Online</h2>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center gap-2 p-2 rounded bg-gray-800"
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: player.color }}
            />
            <span className="text-white">
              {player.name} {player.id === currentPlayerId ? '(You)' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;