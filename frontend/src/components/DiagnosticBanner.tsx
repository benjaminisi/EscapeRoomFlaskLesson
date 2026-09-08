import React, { useState, useEffect } from 'react';
import { subscribeToDiagnostics, DiagnosticFailure } from '../services/api';

export const DiagnosticBanner: React.FC = () => {
  const [currentFailure, setCurrentFailure] = useState<DiagnosticFailure | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToDiagnostics((failure) => {
      setCurrentFailure(failure);
      setCopied(false);
    });
    return unsubscribe;
  }, []);

  if (!currentFailure) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentFailure.promptSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers / insecure context
      const textarea = document.createElement('textarea');
      textarea.value = currentFailure.promptSnippet;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-scale-up">
      <div 
        className="glass-panel max-w-2xl w-full p-6 text-left border-2 shadow-2xl relative"
        style={{ borderColor: '#ff0055', background: 'rgba(18, 5, 10, 0.95)' }}
      >
        <div className="flex justify-between items-center border-b border-[#ff0055]/40 pb-3 mb-4">
          <div className="flex items-center gap-2 text-[#ff0055] font-orbitron font-bold text-lg">
            <span className="text-xl">⚠️</span> SYSTEM DIAGNOSTIC FAILURE DETECTED
          </div>
          <button 
            onClick={() => setCurrentFailure(null)}
            className="text-gray-400 hover:text-white text-xl font-bold font-mono px-2"
          >
            &times;
          </button>
        </div>

        <div className="text-xs font-mono space-y-2 mb-4 text-gray-300">
          <div className="flex gap-2">
            <span className="text-red-400 font-bold">ENDPOINT:</span>
            <span className="text-white">{currentFailure.method} {currentFailure.url}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-400 font-bold">HTTP STATUS:</span>
            <span className="text-yellow-400">{currentFailure.status || 'NETWORK_ERROR / OFFLINE'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-400 font-bold">SYSTEM MESSAGE:</span>
            <span className="text-white">{currentFailure.message}</span>
          </div>
        </div>

        <div className="bg-black/70 border border-gray-700 rounded p-3 mb-4">
          <div className="text-[11px] text-gray-400 font-mono mb-1">
            DIAGNOSTIC REPORT FOR AI AGENT (Copy & paste into your conversation with Antigravity):
          </div>
          <pre className="text-[11px] font-mono text-green-300 whitespace-pre-wrap max-h-48 overflow-y-auto select-all">
            {currentFailure.promptSnippet}
          </pre>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => setCurrentFailure(null)}
            className="px-4 py-2 text-xs font-orbitron bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-600 transition-colors"
          >
            DISMISS
          </button>
          <button
            onClick={handleCopyPrompt}
            className={`px-4 py-2 text-xs font-orbitron rounded border font-bold transition-all shadow-lg ${
              copied 
                ? 'bg-green-700 text-white border-green-500 shadow-green-500/30' 
                : 'bg-red-700 hover:bg-red-600 text-white border-red-500 shadow-red-500/30'
            }`}
          >
            {copied ? '✓ COPIED TO CLIPBOARD!' : '📋 COPY PROMPT FOR AGENT'}
          </button>
        </div>
      </div>
    </div>
  );
};
