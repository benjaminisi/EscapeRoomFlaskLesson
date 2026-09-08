import { useState } from 'react';
import { AvatarSelector, Avatar } from './components/AvatarSelector';
import { GameGrid } from './components/GameGrid';
import AdminPanel from './components/AdminPanel';
import { DiagnosticBanner } from './components/DiagnosticBanner';
import { api } from './services/api';

interface PlayerSession {
  playerName: string;
  avatar: Avatar;
}

function App() {
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const handleSelectOperative = async (name: string, chosenAvatar: Avatar) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Hit the register endpoint on port 5001
      const result = await api.registerPlayer(name, chosenAvatar.role, chosenAvatar.color);
      setSession({
        playerName: result.player.name,
        avatar: chosenAvatar
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Connection failed: API server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleAbortMission = () => {
    setSession(null);
    setErrorMsg(null);
  };

  return (
    <div className="app-viewport">
      <header className="app-header font-orbitron">
        <h1 className="header-title">CYBER_ESCAPE // CHAMBER_01</h1>
        <div className="header-subtitle">MONOREPO GRID CHALLENGE</div>
      </header>

      {errorMsg && (
        <div className="glass-panel text-center animate-scale-up" style={{ borderColor: '#ff0055', padding: '12px', margin: '0 auto 15px auto', maxWidth: '650px', background: 'rgba(255, 0, 85, 0.05)', color: '#ff0055', fontSize: '0.85rem', fontWeight: 'bold' }}>
          CONNECTION_ERROR: {errorMsg.toUpperCase()}
        </div>
      )}

      {loading && (
        <div className="glass-panel text-center animate-scale-up font-orbitron" style={{ borderColor: '#00f0ff', padding: '15px', margin: '0 auto 15px auto', maxWidth: '650px', color: '#00f0ff' }}>
          SYNCING NEURAL CONNECTIVITY...
        </div>
      )}

      <main className="app-main-content">
        {!session ? (
          <AvatarSelector onSelect={handleSelectOperative} />
        ) : (
          <GameGrid
            playerName={session.playerName}
            avatar={session.avatar}
            onReset={handleAbortMission}
          />
        )}
      </main>

      <footer className="app-footer font-mono flex justify-between items-center px-4">
        <span>SECURE CONNECTION // PROTOCOL v1.0.4 // ENCRYPTED NODE ACCESS</span>
        <button 
          onClick={() => setShowAdmin(true)}
          className="text-xs text-red-500/50 hover:text-red-400 transition-colors cursor-pointer"
        >
          [ADMIN]
        </button>
      </footer>

      {showAdmin && (
        <AdminPanel 
          onClose={() => setShowAdmin(false)} 
          onRefresh={() => window.location.reload()} 
        />
      )}

      <DiagnosticBanner />
    </div>
  );
}

export default App;
