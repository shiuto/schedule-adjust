import { PRESET_COLORS } from '../../utils/colors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
            value === color ? 'border-gray-800 scale-110' : 'border-white shadow'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      <div className="relative w-7 h-7">
        <div
          className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs overflow-hidden"
          style={!PRESET_COLORS.includes(value) ? { backgroundColor: value, borderColor: '#374151' } : {}}
        >
          {PRESET_COLORS.includes(value) ? '+' : ''}
        </div>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-full"
          title="カスタムカラー"
        />
      </div>
    </div>
  );
}
