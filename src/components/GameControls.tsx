import React from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  ArrowDown, 
  RotateCw, 
  ArrowDownToLine, 
  RefreshCw 
} from 'lucide-react';

interface GameControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotate: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
  onHold: () => void;
  disabled: boolean;
  theme: 'light' | 'dark';
}

export const GameControls: React.FC<GameControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onRotate,
  onSoftDrop,
  onHardDrop,
  onHold,
  disabled,
  theme
}) => {
  const isLight = theme === 'light';

  // Base style helpers
  const btnBaseClass = `
    active:scale-95 transition-all duration-100 flex flex-col items-center justify-center select-none touch-none
    border-4 rounded-none focus:outline-none font-black font-mono uppercase
  `;

  const themeBtnClass = isLight
    ? 'border-black text-black bg-white active:bg-black active:text-white disabled:opacity-30'
    : 'border-white text-white bg-black active:bg-white active:text-black disabled:opacity-30';

  const handleTouch = (callback: () => void) => (e: React.TouchEvent) => {
    e.preventDefault();
    if (!disabled) {
      callback();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 mt-2 mb-6 block md:hidden select-none">
      {/* Dynamic Layout: Movement on Left, Action on Right */}
      <div className="grid grid-cols-2 gap-4 w-full h-44">
        
        {/* Left Side: Movement D-Pad */}
        <div className="grid grid-cols-3 gap-2 h-full">
          {/* Spacer */}
          <div></div>
          
          {/* Rotate / Up (Accessible in movement group too, or empty) */}
          <button
            onTouchStart={handleTouch(onRotate)}
            onClick={() => !disabled && onRotate()}
            disabled={disabled}
            className={`${btnBaseClass} ${themeBtnClass} h-12 w-12 mx-auto col-span-1`}
            aria-label="Rotate"
            id="mobile-btn-rotate-top"
          >
            <RotateCw size={18} />
          </button>
          
          {/* Spacer */}
          <div></div>

          {/* Left Button */}
          <button
            onTouchStart={handleTouch(onMoveLeft)}
            onClick={() => !disabled && onMoveLeft()}
            disabled={disabled}
            className={`${btnBaseClass} ${themeBtnClass} h-14 w-full`}
            aria-label="Move Left"
            id="mobile-btn-left"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>

          {/* Soft Drop Button */}
          <button
            onTouchStart={handleTouch(onSoftDrop)}
            onClick={() => !disabled && onSoftDrop()}
            disabled={disabled}
            className={`${btnBaseClass} ${themeBtnClass} h-14 w-full`}
            aria-label="Soft Drop"
            id="mobile-btn-down"
          >
            <ArrowDown size={22} strokeWidth={2.5} />
          </button>

          {/* Right Button */}
          <button
            onTouchStart={handleTouch(onMoveRight)}
            onClick={() => !disabled && onMoveRight()}
            disabled={disabled}
            className={`${btnBaseClass} ${themeBtnClass} h-14 w-full`}
            aria-label="Move Right"
            id="mobile-btn-right"
          >
            <ArrowRight size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Side: Major Actions */}
        <div className="grid grid-cols-2 gap-2 h-full">
          {/* Rotate Large Button */}
          <button
            onTouchStart={handleTouch(onRotate)}
            onClick={() => !disabled && onRotate()}
            disabled={disabled}
            className={`${btnBaseClass} ${themeBtnClass} h-20 col-span-2`}
            id="mobile-btn-rotate-action"
          >
            <RotateCw size={24} className="mb-1" />
            <span className="text-[10px] font-mono tracking-wider uppercase font-bold">Rotate</span>
          </button>

          {/* Hold Button */}
          <button
            onTouchStart={handleTouch(onHold)}
            onClick={() => !disabled && onHold()}
            disabled={disabled}
            className={`${btnBaseClass} ${themeBtnClass} h-16`}
            id="mobile-btn-hold"
          >
            <RefreshCw size={18} className="mb-1" />
            <span className="text-[10px] font-mono tracking-wider uppercase">Hold</span>
          </button>

          {/* Hard Drop Button */}
          <button
            onTouchStart={handleTouch(onHardDrop)}
            onClick={() => !disabled && onHardDrop()}
            disabled={disabled}
            className={`${btnBaseClass} ${themeBtnClass} h-16`}
            id="mobile-btn-harddrop"
          >
            <ArrowDownToLine size={18} className="mb-1" />
            <span className="text-[10px] font-mono tracking-wider uppercase">Drop</span>
          </button>
        </div>

      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] font-mono opacity-40">
          Tip: Swipe or drag is supported on keypads. Tap buttons directly for instant action.
        </span>
      </div>
    </div>
  );
};
