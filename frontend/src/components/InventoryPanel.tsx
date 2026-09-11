import React from 'react';
import { InventoryData } from '../services/api';

interface InventoryPanelProps {
  inventory: InventoryData;
  onDrop: (itemId: string) => void;
  onEquip: (itemId: string) => void;
  onUse: (itemId: string) => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, onDrop, onEquip, onUse }) => {
  return (
    <div className="glass-panel mt-4 p-4 text-sm" style={{ borderColor: '#00f0ff' }}>
      <h3 className="font-orbitron text-[#00f0ff] mb-2 font-bold tracking-wider">INVENTORY STATUS</h3>
      
      <div className="flex gap-4">
        {/* Hand slot */}
        <div className="flex-1 border border-[#00f0ff]/30 p-2 rounded bg-black/40">
          <div className="text-gray-400 text-xs mb-1">EQUIPPED (HAND)</div>
          {inventory.hand ? (
            <div className="flex justify-between items-center">
              <span className="font-bold text-white flex-1 flex items-center gap-2">
                {inventory.hand.name}
                {(inventory.hand.id === 'item_lantern' || inventory.hand.id === 'item_flash') && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-orbitron ${(inventory.hand.activation_level ?? 0) > 0 ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(255,170,0,0.5)]' : 'bg-gray-700/50 text-gray-400 border border-gray-600'}`}>
                    {(inventory.hand.activation_level ?? 0) > 0 ? 'ON' : 'OFF'}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => onUse(inventory.hand!.id)}
                  className={`text-xs px-2 py-1 rounded font-orbitron transition-all ${
                    (inventory.hand.id === 'item_lantern' || inventory.hand.id === 'item_flash')
                      ? (inventory.hand.activation_level ?? 0) > 0
                        ? 'bg-amber-900/60 text-amber-200 hover:bg-amber-800 border border-amber-500/60'
                        : 'bg-green-900/50 text-green-200 hover:bg-green-900 border border-green-500/40'
                      : 'bg-green-900/50 text-green-200 hover:bg-green-900'
                  }`}
                >
                  {(inventory.hand.id === 'item_lantern' || inventory.hand.id === 'item_flash') 
                    ? ((inventory.hand.activation_level ?? 0) > 0 ? 'TURN OFF' : 'TURN ON') 
                    : 'USE'}
                </button>
                <button 
                  onClick={() => onDrop(inventory.hand!.id)}
                  className="text-xs px-2 py-1 bg-red-900/50 text-red-200 hover:bg-red-900 rounded font-orbitron"
                >
                  DROP
                </button>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 italic">Empty</div>
          )}
        </div>

        {/* Bag slots */}
        <div className="flex-[2] border border-[#00f0ff]/30 p-2 rounded bg-black/40">
          <div className="text-gray-400 text-xs mb-1">STORAGE (BAG)</div>
          {inventory.bag.length === 0 ? (
            <div className="text-gray-500 italic">Empty</div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {inventory.bag.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-gray-800 p-1 px-2 rounded border border-gray-700">
                  <span className="text-white flex items-center gap-1.5">
                    {item.name}
                    {(item.id === 'item_lantern' || item.id === 'item_flash') && (item.activation_level ?? 0) > 0 && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-300 font-orbitron">
                        ON
                      </span>
                    )}
                  </span>
                  <button 
                    onClick={() => onEquip(item.id)}
                    className="text-xs text-blue-300 hover:text-white font-orbitron"
                  >
                    EQUIP
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
