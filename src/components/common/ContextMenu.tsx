import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') { onClose(); return; }
      if (e instanceof MouseEvent && ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handle);
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('mousedown', handle);
      window.removeEventListener('keydown', handle);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = 180;
  const menuH = items.length * 36 + 8;
  const adjX = x + menuW > vw ? vw - menuW - 8 : x;
  const adjY = y + menuH > vh ? vh - menuH - 8 : y;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 py-1 overflow-hidden"
      style={{ left: adjX, top: adjY, width: menuW, minWidth: menuW }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.divider && i > 0 && <div className="h-px bg-gray-100 my-1" />}
          <button
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left ${
              item.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => { item.onClick(); onClose(); }}
          >
            {item.icon && (
              <span className={`shrink-0 ${item.danger ? 'text-red-500' : 'text-gray-400'}`}>
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
