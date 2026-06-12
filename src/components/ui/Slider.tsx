interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: string[];
}

export function Slider({ 
  label, 
  value, 
  onChange, 
  min = 1, 
  max = 5, 
  step = 1,
  marks 
}: SliderProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="text-lg font-bold text-primary min-w-[2rem] text-center">
          {value}
        </span>
      </div>
      {marks && (
        <div className="flex justify-between mt-1 text-xs text-text-secondary">
          {marks.map((mark, index) => (
            <span key={index}>{mark}</span>
          ))}
        </div>
      )}
    </div>
  );
}
