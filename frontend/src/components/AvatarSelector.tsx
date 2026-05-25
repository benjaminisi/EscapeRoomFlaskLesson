import React, { useState } from 'react';

export interface Avatar {
  id: string;
  name: string;
  role: string;
  color: string;
  svgPath: string;
  description: string;
}

export const AVATARS: Avatar[] = [
  {
    id: 'cyber_hacker',
    name: 'Ghost',
    role: 'Cryptographer',
    color: '#00f0ff', // Neon Cyan
    description: 'Expert at decrypting complex security systems and bypass codes.',
    svgPath: `
      <circle cx="50" cy="35" r="18" fill="none" stroke="#00f0ff" stroke-width="2" stroke-dasharray="2 2" />
      <path d="M35,65 C35,50 65,50 65,65" fill="none" stroke="#00f0ff" stroke-width="2" />
      <path d="M42,32 L46,32 M54,32 L58,32" stroke="#00f0ff" stroke-width="2" />
      <rect x="38" y="25" width="24" height="4" rx="2" fill="none" stroke="#00f0ff" stroke-width="2" />
      <path d="M30,50 L40,45 L50,52 L60,45 L70,50" fill="none" stroke="#00f0ff" stroke-width="1.5" />
    `
  },
  {
    id: 'stealth_spy',
    name: 'Viper',
    role: 'Infiltrator',
    color: '#ff007f', // Neon Pink/Magenta
    description: 'Specializes in bypassing physical sensors and moving unseen.',
    svgPath: `
      <circle cx="50" cy="35" r="18" fill="none" stroke="#ff007f" stroke-width="2" />
      <path d="M30,70 L38,55 C42,48 58,48 62,55 L70,70" fill="none" stroke="#ff007f" stroke-width="2" />
      <path d="M40,35 L48,39 L60,35" fill="none" stroke="#ff007f" stroke-width="2" />
      <polygon points="50,20 40,28 60,28" fill="none" stroke="#ff007f" stroke-width="2" />
      <circle cx="50" cy="36" r="2" fill="#ff007f" />
    `
  },
  {
    id: 'bio_engineer',
    name: 'Spark',
    role: 'Technician',
    color: '#ffaa00', // Amber/Yellow
    description: 'Reconstructs electrical components and manipulates machinery.',
    svgPath: `
      <circle cx="50" cy="35" r="18" fill="none" stroke="#ffaa00" stroke-width="2" />
      <path d="M32,68 C35,55 65,55 68,68" fill="none" stroke="#ffaa00" stroke-width="2" />
      <line x1="50" y1="10" x2="50" y2="17" stroke="#ffaa00" stroke-width="2" />
      <line x1="50" y1="53" x2="50" y2="60" stroke="#ffaa00" stroke-width="2" />
      <circle cx="50" cy="35" r="8" fill="none" stroke="#ffaa00" stroke-width="2" stroke-dasharray="4 2" />
      <polygon points="48,32 52,32 50,38" fill="#ffaa00" />
    `
  },
  {
    id: 'ai_scholar',
    name: 'Oracle',
    role: 'AI Analyst',
    color: '#b026ff', // Neon Purple
    description: 'Interprets cryptic ancient code and navigates neural networks.',
    svgPath: `
      <circle cx="50" cy="35" r="18" fill="none" stroke="#b026ff" stroke-width="2" />
      <path d="M30,65 L35,50 C38,45 62,45 65,50 L70,65" fill="none" stroke="#b026ff" stroke-width="2" />
      <circle cx="50" cy="35" r="5" fill="none" stroke="#b026ff" stroke-width="1.5" />
      <path d="M30,35 H70 M50,15 V55" stroke="#b026ff" stroke-width="1" stroke-dasharray="2 2" />
      <rect x="42" y="28" width="16" height="14" rx="3" fill="none" stroke="#b026ff" stroke-width="2" />
    `
  }
];

interface AvatarSelectorProps {
  onSelect: (playerName: string, avatar: Avatar) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ onSelect }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSelect(name.trim(), selectedAvatar);
  };

  return (
    <div className="avatar-selector-card glass-panel">
      <h2 className="title-glow text-center font-orbitron">SYSTEM INITIALIZATION</h2>
      <p className="text-muted text-center font-inter subtitle">
        Select your operative profile and register terminal access.
      </p>

      <form onSubmit={handleSubmit} className="setup-form">
        <div className="form-group">
          <label htmlFor="operative-name" className="font-orbitron label-glowing">
            OPERATIVE ALIAS:
          </label>
          <input
            id="operative-name"
            type="text"
            className="input-cyber font-orbitron"
            placeholder="ENTER AGENT CODENAME..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            required
            autoComplete="off"
          />
        </div>

        <div className="avatar-grid-label font-orbitron label-glowing">
          SELECT OPERATIVE CHASSIS:
        </div>

        <div className="avatar-grid">
          {AVATARS.map((avatar) => {
            const isSelected = selectedAvatar.id === avatar.id;
            return (
              <div
                key={avatar.id}
                className={`avatar-option glass-panel ${isSelected ? 'selected' : ''}`}
                style={{
                  borderColor: isSelected ? avatar.color : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: isSelected ? `0 0 15px ${avatar.color}40` : 'none',
                }}
                onClick={() => setSelectedAvatar(avatar)}
              >
                <div className="avatar-svg-container">
                  <svg
                    viewBox="0 0 100 100"
                    width="80"
                    height="80"
                    dangerouslySetInnerHTML={{ __html: avatar.svgPath }}
                  />
                </div>
                <div className="avatar-meta">
                  <span className="avatar-role font-orbitron" style={{ color: avatar.color }}>
                    {avatar.role}
                  </span>
                  <span className="avatar-default-name font-inter">{avatar.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* operative description pane */}
        <div className="operative-description glass-panel">
          <div className="desc-header font-orbitron" style={{ color: selectedAvatar.color }}>
            CLASS: {selectedAvatar.role.toUpperCase()}
          </div>
          <div className="desc-body font-inter">{selectedAvatar.description}</div>
        </div>

        <div className="form-actions text-center">
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-cyber font-orbitron"
            style={{
              borderColor: name.trim() ? selectedAvatar.color : 'rgba(255,255,255,0.1)',
              boxShadow: name.trim() ? `0 0 15px ${selectedAvatar.color}50` : 'none',
              color: name.trim() ? '#ffffff' : 'rgba(255,255,255,0.3)'
            }}
          >
            ESTABLISH CONNECTION
          </button>
        </div>
      </form>
    </div>
  );
};
