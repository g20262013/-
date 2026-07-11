import React from 'react';

interface TetrisBlockProps {
  value: number | null;
  isGhost?: boolean;
  theme: 'light' | 'dark';
}

export const TetrisBlock: React.FC<TetrisBlockProps> = ({ value, isGhost = false, theme }) => {
  const isLight = theme === 'light';

  // Base colors
  const strokeColor = isLight ? '#000000' : '#ffffff';
  const fillColor = isLight ? '#ffffff' : '#000000';
  const gridDotColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';

  // If empty, render a beautiful dot-matrix grid cell
  if (value === null || value === 0) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: isLight ? '#fafafa' : '#0a0a0a' }}
      >
        <svg viewBox="0 0 100 100" className="w-1.5 h-1.5">
          <circle cx="50" cy="50" r="15" fill={gridDotColor} />
        </svg>
      </div>
    );
  }

  // Render ghost piece projection (dashed border, no fill)
  if (isGhost) {
    return (
      <div 
        className="w-full h-full p-[1px] transition-colors duration-300"
        style={{ backgroundColor: isLight ? '#ffffff' : '#000000' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect 
            x="4" 
            y="4" 
            width="92" 
            height="92" 
            fill="none" 
            stroke={strokeColor} 
            strokeWidth="8" 
            strokeDasharray="16 12"
            opacity="0.35"
            rx="0"
          />
        </svg>
      </div>
    );
  }

  // Design distinct retro vector graphics for each piece (1-7)
  const renderPattern = () => {
    switch (value) {
      case 1: // 'I' - Solid fill with clean contrast border
        return (
          <>
            <rect x="6" y="6" width="88" height="88" fill={strokeColor} rx="0" />
            <rect x="20" y="20" width="60" height="60" fill={fillColor} rx="0" opacity="0.15" />
          </>
        );

      case 2: // 'O' - Concentric squares
        return (
          <>
            <rect x="6" y="6" width="88" height="88" fill="none" stroke={strokeColor} strokeWidth="12" rx="0" />
            <rect x="32" y="32" width="36" height="36" fill={strokeColor} rx="0" />
          </>
        );

      case 3: // 'T' - Bold central target/circle
        return (
          <>
            <rect x="6" y="6" width="88" height="88" fill="none" stroke={strokeColor} strokeWidth="10" rx="0" />
            <circle cx="50" cy="50" r="22" fill={strokeColor} />
            <circle cx="50" cy="50" r="10" fill={fillColor} />
          </>
        );

      case 4: // 'S' - Diagonal Cross 'X'
        return (
          <>
            <rect x="6" y="6" width="88" height="88" fill="none" stroke={strokeColor} strokeWidth="10" rx="0" />
            <line x1="24" y1="24" x2="76" y2="76" stroke={strokeColor} strokeWidth="12" strokeLinecap="square" />
            <line x1="76" y1="24" x2="24" y2="76" stroke={strokeColor} strokeWidth="12" strokeLinecap="square" />
          </>
        );

      case 5: // 'Z' - Checkered grid pattern inside
        return (
          <>
            <rect x="6" y="6" width="88" height="88" fill="none" stroke={strokeColor} strokeWidth="10" rx="0" />
            {/* Checker squares */}
            <rect x="20" y="20" width="24" height="24" fill={strokeColor} />
            <rect x="56" y="20" width="24" height="24" fill="none" stroke={strokeColor} strokeWidth="6" />
            <rect x="20" y="56" width="24" height="24" fill="none" stroke={strokeColor} strokeWidth="6" />
            <rect x="56" y="56" width="24" height="24" fill={strokeColor} />
          </>
        );

      case 6: // 'J' - Double border with nested square
        return (
          <>
            <rect x="6" y="6" width="88" height="88" fill="none" stroke={strokeColor} strokeWidth="10" rx="0" />
            <rect x="22" y="22" width="56" height="56" fill="none" stroke={strokeColor} strokeWidth="8" rx="0" />
            <rect x="38" y="38" width="24" height="24" fill={strokeColor} rx="0" />
          </>
        );

      case 7: // 'L' - Horizontal / Vertical striped hatching
        return (
          <>
            <rect x="6" y="6" width="88" height="88" fill="none" stroke={strokeColor} strokeWidth="10" rx="0" />
            {/* Hatched lines */}
            <line x1="22" y1="30" x2="78" y2="30" stroke={strokeColor} strokeWidth="8" strokeLinecap="square" />
            <line x1="22" y1="50" x2="78" y2="50" stroke={strokeColor} strokeWidth="8" strokeLinecap="square" />
            <line x1="22" y1="70" x2="78" y2="70" stroke={strokeColor} strokeWidth="8" strokeLinecap="square" />
          </>
        );

      default:
        return <rect x="6" y="6" width="88" height="88" fill={strokeColor} rx="0" />;
    }
  };

  return (
    <div 
      className="w-full h-full p-[1px] transition-all duration-300 transform scale-100"
      style={{ backgroundColor: isLight ? '#ffffff' : '#000000' }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {renderPattern()}
      </svg>
    </div>
  );
};
