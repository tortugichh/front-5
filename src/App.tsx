import { useState } from 'react';
import GameField from './components/GameField';
import PlayerList from './components/PlayerList';
import LoginForm from './components/LoginForm';
import useRealtimePlayers from './hooks/useRealtimePlayers';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const players = useRealtimePlayers();
  
  const handleLogin = (name: string) => {
    setPlayerName(name);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginForm onSubmit={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-3">
            <GameField playerName={playerName} />
          </div>
          <div className="col-span-1">
            <PlayerList 
              players={players}
              currentPlayerId={null} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;