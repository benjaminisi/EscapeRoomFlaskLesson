import React from 'react';
import { InventoryData } from '../services/api';

interface InventoryPanelProps {
  inventory: InventoryData;
  onDrop: (itemId: string) => void;
  onEquip: (itemId: string) => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, onDrop, onEquip }) => {
  return (
    <div className="glass-panel mt-4 p-4 text-sm" style={{ borderColor: '#00f0ff' }}>
      <h3 className="font-orbitron text-[#00f0ff] mb-2 font-bold tracking-wider">INVENTORY STATUS</h3>
      
      <div className="flex gap-4">
        {/* Hand slot */}
        <div className="flex-1 border border-[#00f0ff]/30 p-2 rounded bg-black/40">
          <div className="text-gray-400 text-xs mb-1">EQUIPPED (HAND)</div>
          {inventory.hand ? (
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">{inventory.hand.name}</span>
              <button 
                onClick={() => onDrop(inventory.hand!.id)}
                className="text-xs px-2 py-1 bg-red-900/50 text-red-200 hover:bg-red-900 rounded"
              >
                DROP
              </button>
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
                  <span className="text-white">{item.name}</span>
                  <button 
                    onClick={() => onEquip(item.id)}
                    className="text-xs text-blue-300 hover:text-white"
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
