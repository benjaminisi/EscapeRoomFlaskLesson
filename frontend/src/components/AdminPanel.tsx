import React, { useState } from 'react';
import { api, PlayerData } from '../services/api';

interface AdminPanelProps {
  onClose: () => void;
  onRefresh: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onRefresh }) => {
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPlayers, setShowPlayers] = useState(false);
  const [playersList, setPlayersList] = useState<PlayerData[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);

  const handleFetchPlayers = async () => {
    setPlayersLoading(true);
    setMessage(null);
    try {
      const res = await api.getPlayers();
      setPlayersList(res.players);
      setShowPlayers(true);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setPlayersLoading(false);
    }
  };

  const handleInit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.initDatabase(force);
      setMessage(res.message);
      if (force) {
        setForce(false); // clear flag after use
      }
      onRefresh(); // Refresh game state
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-md w-full text-cyan-50">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4 border-b border-cyan-500/50 pb-2">Admin Control Panel</h2>
        
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-4">
            Initialize the database from the master schema.
          </p>
          
          <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-800 rounded border border-gray-700 hover:border-red-500 transition-colors">
            <input 
              type="checkbox" 
              checked={force} 
              onChange={(e) => setForce(e.target.checked)}
              className="form-checkbox h-5 w-5 text-red-500 rounded border-gray-600 bg-gray-700 focus:ring-red-500 focus:ring-offset-gray-900"
            />
            <span className="text-red-400 font-medium">Force Rebuild (Clears all data)</span>
          </label>
        </div>

        {message && (
          <div className={`p-3 mb-4 rounded text-sm ${message.startsWith('Error') ? 'bg-red-900/50 text-red-200 border border-red-500' : 'bg-green-900/50 text-green-200 border border-green-500'}`}>
            {message}
          </div>
        )}

        <div className="mb-6">
          <button 
            onClick={handleFetchPlayers}
            disabled={playersLoading}
            className="w-full px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500 rounded hover:bg-blue-600/40 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            {playersLoading ? 'Fetching...' : 'View Connected Players'}
          </button>
          
          {showPlayers && (
            <div className="mt-4 max-h-48 overflow-y-auto bg-gray-950 border border-gray-700 rounded p-2 text-xs">
              {playersList.length === 0 ? (
                <p className="text-gray-500 text-center p-2">No players found.</p>
              ) : (
                <ul className="space-y-2">
                  {playersList.map(p => (
                    <li key={p.id} className="border-b border-gray-800 pb-2 flex justify-between">
                      <span className="font-bold" style={{ color: p.color }}>{p.name} ({p.role})</span>
                      <span className="text-gray-500">Pos: ({p.x}, {p.y}) | Steps: {p.steps_taken}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleInit}
            disabled={loading}
            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500 rounded hover:bg-red-600/40 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Initializing...' : 'Initialize Master'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
