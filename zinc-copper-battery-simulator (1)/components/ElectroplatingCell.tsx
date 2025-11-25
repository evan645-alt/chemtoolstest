import React, { useEffect, useRef, useState, useCallback } from 'react';

// --- Constants ---
const WIRE_PATH_LEFT = "M 180,150 L 180,60 L 280,60"; // Anode to Battery(+)
const WIRE_PATH_RIGHT = "M 320,60 L 420,60 L 420,150"; // Battery(-) to Cathode

const ANIMATION_SPEED = 0.002; 

export const ElectroplatingCell: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const requestRef = useRef<number>(0);

  const animate = useCallback(() => {
    setTime((prevTime) => prevTime + ANIMATION_SPEED);
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]);

  // Deformation logic
  // Anode (Cu) shrinks: max 15px
  // Cathode (Graphite) grows (plating): max 15px thickness
  const deformation = Math.min(time * 10, 15); 

  // Helper for Wire Positions
  const getWirePosLeft = (t: number) => {
    // Path: 180,150 -> 180,60 -> 280,60
    // Total length approx: 90 + 100 = 190
    const p = t % 1;
    if (p < 0.47) { // Up segment
      return { x: 180, y: 150 - (p / 0.47) * 90 };
    } else { // Right segment
      return { x: 180 + ((p - 0.47) / 0.53) * 100, y: 60 };
    }
  };

  const getWirePosRight = (t: number) => {
    // Path: 320,60 -> 420,60 -> 420,150
    // Total length approx: 100 + 90 = 190
    const p = t % 1;
    if (p < 0.53) { // Right segment
      return { x: 320 + (p / 0.53) * 100, y: 60 };
    } else { // Down segment
      return { x: 420, y: 60 + ((p - 0.53) / 0.47) * 90 };
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-lg mt-8 border-t-4 border-blue-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">3. 電解電鍍 (Electrochemical Plating)</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-8 py-3 rounded-full font-bold text-white transition-colors text-lg shadow-md ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPlaying ? '暫停 (Pause)' : '開始 (Start)'}
        </button>
        <button
          onClick={() => setTime(0)}
          className="px-4 py-3 rounded-full font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
        >
          重置 (Reset)
        </button>
      </div>

      <div className="relative w-full aspect-[5/3] border-2 border-slate-300 rounded-xl overflow-hidden bg-gray-50 shadow-inner">
        <svg viewBox="0 0 600 400" className="w-full h-full">
          <defs>
            <linearGradient id="gradCuPlate" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="gradGraphite" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="50%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
          </defs>

          {/* --- Static Lab Equipment --- */}
          
          {/* Single Large Beaker */}
          <rect x="100" y="200" width="400" height="180" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
          
          {/* Solution: CuSO4 (Blue) */}
          <path d="M 105,220 L 495,220 L 495,370 Q 495,375 490,375 L 110,375 Q 105,375 105,370 Z" fill="#3b82f6" opacity="0.4" />
          <text x="300" y="350" textAnchor="middle" fontSize="16" fill="#1e40af" fontWeight="bold" opacity="0.7">CuSO₄(aq)</text>

          {/* --- Power Source (Battery) --- */}
          <g transform="translate(300, 60)">
            {/* Positive Terminal (Long bar) */}
            <line x1="-10" y1="-15" x2="-10" y2="15" stroke="#333" strokeWidth="4" />
            <text x="-25" y="-20" fontSize="14" fontWeight="bold" fill="#dc2626">+</text>
            
            {/* Negative Terminal (Short bar) */}
            <line x1="10" y1="-8" x2="10" y2="8" stroke="#333" strokeWidth="4" />
            <text x="20" y="-20" fontSize="14" fontWeight="bold" fill="#333">-</text>
            
            {/* Label */}
            <text x="0" y="35" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#333">DC Power</text>
          </g>

          {/* Wires */}
          <path d={WIRE_PATH_LEFT} fill="none" stroke="#333" strokeWidth="3" />
          <path d={WIRE_PATH_RIGHT} fill="none" stroke="#333" strokeWidth="3" />

          {/* --- ELECTRODES --- */}

          {/* 1. Anode (Left, Positive) - Copper */}
          {/* Ghost Outline */}
          <rect x="160" y="150" width="40" height="180" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
          {/* Active Electrode (Shrinks) */}
          <rect 
            x={160} 
            y="150" 
            width={Math.max(10, 40 - deformation)} 
            height="180" 
            fill="url(#gradCuPlate)" 
            stroke="#78350f"
            strokeWidth="2"
          />
          <text x="160" y="140" textAnchor="middle" fontWeight="bold" fill="#b45309">銅 (Anode +)</text>

          {/* 2. Cathode (Right, Negative) - Graphite/Metal */}
          {/* Base Electrode (Constant size, Graphite Black) */}
          <rect x="400" y="150" width="40" height="180" fill="url(#gradGraphite)" stroke="#000" strokeWidth="2" />
          
          {/* Plating Layer (Grows outwards, Copper Color) */}
          <rect 
            x={400 - deformation} 
            y="150" 
            width={40 + deformation * 2} 
            height="180" 
            fill="url(#gradCuPlate)" 
            opacity="0.9"
            stroke="#78350f"
          />
           {/* Outline of original graphite to show it's inside */}
          <rect x="400" y="150" width="40" height="180" fill="none" stroke="#000" strokeWidth="1" strokeDasharray="2,2" strokeOpacity="0.5" />
          
          <text x="420" y="140" textAnchor="middle" fontWeight="bold" fill="#1f2937">石墨 (Cathode -)</text>

          {/* --- PARTICLES --- */}

          {/* Electrons: Anode -> Battery */}
          {[0, 0.2, 0.4, 0.6, 0.8].map((offset, i) => {
             const pos = getWirePosLeft(time + offset);
             return (
               <g key={`e-left-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                 <circle r="6" fill="#eab308" stroke="black" strokeWidth="1" />
                 <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="bold">e⁻</text>
               </g>
             );
          })}

          {/* Electrons: Battery -> Cathode */}
          {[0, 0.2, 0.4, 0.6, 0.8].map((offset, i) => {
             const pos = getWirePosRight(time + offset);
             return (
               <g key={`e-right-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                 <circle r="6" fill="#eab308" stroke="black" strokeWidth="1" />
                 <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="bold">e⁻</text>
               </g>
             );
          })}

          {/* Reaction 1: Anode Oxidation (Cu -> Cu2+) */}
          {[0, 0.3, 0.6, 0.9].map((offset, i) => {
            const t = (time + offset) % 1;
            // Start at Anode surface (approx x = 160 + width)
            const startX = 160 + Math.max(10, 40 - deformation); 
            // Move into solution
            const x = startX + t * 50;
            const y = 250 + Math.sin(t * 10 + i) * 20;
            return (
              <g key={`ion-ox-${i}`} transform={`translate(${x}, ${y})`} opacity={1 - t}>
                <circle r="7" fill="#3b82f6" stroke="#1e40af" />
                <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white">Cu²⁺</text>
              </g>
            );
          })}
          {/* Reaction Text Anode */}
          <text x="180" y="390" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350f">
            Cu → Cu²⁺ + 2e⁻
          </text>

          {/* Reaction 2: Cathode Reduction (Cu2+ -> Cu) */}
          {/* Ions move from solution TOWARDS Cathode */}
          {[0, 0.25, 0.5, 0.75].map((offset, i) => {
             const t = (time + offset) % 1;
             // Target is Cathode surface (approx x = 400 - deformation)
             const targetX = 400 - deformation;
             // Start somewhere left of it
             const startX = targetX - 60;
             
             const x = startX + t * 60;
             const y = 200 + (i * 40) + Math.cos(t * 10) * 5; // Spread vertically
             
             // Disappear when hitting
             const op = t > 0.9 ? 0 : 1;

             return (
               <g key={`ion-red-${i}`} transform={`translate(${x}, ${y})`} opacity={op}>
                 <circle r="7" fill="#3b82f6" stroke="#1e40af" />
                 <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white">Cu²⁺</text>
               </g>
             );
          })}
          {/* Reaction Text Cathode */}
          <text x="420" y="390" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350f">
            Cu²⁺ + 2e⁻ → Cu
          </text>

        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-white/90 p-2 rounded border text-xs shadow">
           <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black flex items-center justify-center text-[8px]">e</div>
            <span>電子流向 (e⁻)</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-800"></div>
            <span>銅離子 (Cu²⁺)</span>
          </div>
           <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-700 border border-black"></div>
            <span>石墨電極</span>
          </div>
        </div>

      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg w-full text-sm border border-blue-100">
         <h3 className="font-bold text-blue-900 mb-2">原理說明 (Electroplating)：</h3>
         <ul className="list-disc pl-5 space-y-1 text-slate-700">
           <li>
             <strong>陽極 (Anode +)：</strong> 銅電極發生<span className="text-red-600 font-bold">氧化</span>反應，銅原子失去電子溶解至溶液中。
             <br/>反應式：<span>Cu → Cu<sup>2+</sup> + 2e<sup>-</sup></span> (電極變薄)
           </li>
           <li>
             <strong>陰極 (Cathode -)：</strong> 溶液中的銅離子游向負極，發生<span className="text-blue-600 font-bold">還原</span>反應，析出金屬銅附著在黑色石墨表面。
             <br/>反應式：<span>Cu<sup>2+</sup> + 2e<sup>-</sup> → Cu</span> (電鍍層增厚)
           </li>
           <li>
             <strong>溶液變化：</strong> 陽極產生的 Cu<sup>2+</sup> 剛好補充陰極消耗的 Cu<sup>2+</sup>，因此溶液顏色保持藍色不變。
           </li>
         </ul>
      </div>
    </div>
  );
};