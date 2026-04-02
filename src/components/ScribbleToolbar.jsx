import React from 'react'

const COLORS = [
  '#FFFFFF', '#C1C1C1', '#EF130B', '#FF7100', '#FFE400', 
  '#00CC00', '#00B2FF', '#231FD3', '#A300BA', '#D37CAA', 
  '#A0522D', '#000000', '#4C4C4C', '#740B07', '#C23800', 
  '#E8A200', '#005510', '#00569E', '#0E0865', '#550069', 
  '#A75574', '#63300D'
]

const SIZES = [
  { size: 4, label: 'Small' },
  { size: 12, label: 'Medium' },
  { size: 24, label: 'Large' },
  { size: 40, label: 'Extra Large' }
]

export default function ScribbleToolbar({ 
  activeColor, setActiveColor, 
  activeSize, setActiveSize,
  activeTool, setActiveTool,
  onUndo, onClear
}) {
  return (
    <div className="flex bg-white border-t border-black p-2 gap-4 max-w-full overflow-x-auto items-center noselect">
      
      {/* Colors Grid (2 rows) */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex gap-1">
          {COLORS.slice(0, 11).map(color => (
            <button
              key={color}
              onClick={() => { setActiveColor(color); setActiveTool('brush') }}
              className={`w-6 h-6 rounded-sm border ${activeColor === color && activeTool === 'brush' ? 'border-2 border-black scale-110' : 'border-gray-300'} transition-transform`}
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            />
          ))}
        </div>
        <div className="flex gap-1">
          {COLORS.slice(11).map(color => (
            <button
              key={color}
              onClick={() => { setActiveColor(color); setActiveTool('brush') }}
              className={`w-6 h-6 rounded-sm border ${activeColor === color && activeTool === 'brush' ? 'border-2 border-black scale-110' : 'border-gray-300'} transition-transform`}
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Primary Tool Selection (Brush/Fill) */}
      <div className="flex items-center gap-2 border-l border-gray-300 pl-4 shrink-0">
         <button
            onClick={() => setActiveTool('brush')}
            className={`w-10 h-10 flex items-center justify-center rounded border border-black ${activeTool === 'brush' ? 'bg-[#99ccff] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-white hover:bg-gray-100'}`}
            title="Brush"
         >
            🖌️
         </button>
         <button
            onClick={() => setActiveTool('fill')}
            className={`w-10 h-10 flex items-center justify-center rounded border border-black ${activeTool === 'fill' ? 'bg-[#99ccff] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-white hover:bg-gray-100'}`}
            title="Fill Bucket"
         >
            🪣
         </button>
      </div>

      {/* Brush Sizes */}
      <div className="flex items-center gap-2 border-l border-gray-300 pl-4 shrink-0">
        {SIZES.map(({ size, label }) => (
          <button
            key={size}
            onClick={() => setActiveSize(size)}
            className={`w-10 h-10 flex items-center justify-center rounded border border-black ${activeSize === size ? 'bg-[#99ccff] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' : 'bg-white hover:bg-gray-100'}`}
            title={`Size: ${label}`}
          >
            <div 
              className="bg-black rounded-full" 
              style={{ width: `${Math.max(4, size/2)}px`, height: `${Math.max(4, size/2)}px` }}
            />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-l border-gray-300 pl-4 shrink-0">
        <button
            onClick={onUndo}
            className="w-10 h-10 flex items-center justify-center rounded border border-black bg-white hover:bg-gray-100"
            title="Undo"
        >
            ↩️
        </button>
        <button
            onClick={onClear}
            className="w-10 h-10 flex items-center justify-center rounded border border-black bg-white hover:bg-gray-100"
            title="Clear Canvas"
        >
            🗑️
        </button>
      </div>

    </div>
  )
}
