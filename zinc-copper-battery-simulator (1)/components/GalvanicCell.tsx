import React, { useEffect, useRef, useState, useCallback } from 'react';

// --- Constants ---
const WIRE_PATH = "M 100,120 L 100,40 L 300,40 L 500,40 L 500,120";

const ANIMATION_SPEED = 0.002; // Global speed factor

export const GalvanicCell: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  // Initialize with 0 to satisfy TypeScript requirement
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

  // Calculate electrode deformation based on time
  // Cap it so it doesn't disappear completely or overlap too much
  // Max deformation: 30px (Original width is 40px)
  const deformation = Math.min(time * 15, 30); 

  // --- Helper to get position along the wire path ---
  // Wire goes Up(100,120->100,40) -> Right(100,40->500,40) -> Down(500,40->500,120)
  const getWirePos = (t: number) => {
    const p = t % 1;
    // Segment 1: Up (0 - 0.14)
    if (p < 0.14) return { x: 100, y: 120 - (p / 0.14) * 80 };
    // Segment 2: Across (0.14 - 0.86)
    if (p < 0.86) return { x: 100 + ((p - 0.14) / 0.72) * 400, y: 40 };
    // Segment 3: Down (0.86 - 1.0)
    return { x: 500, y: 40 + ((p - 0.86) / 0.14) * 80 };
  };

  // --- Helper for Salt Bridge Path ---
  const getBridgePos = (t: number, reverse: boolean) => {
    let p = t % 1;
    if (reverse) p = 1 - p; // Used for Anions moving Right(1) to Left(0)
    
    const t1 = 1 - p;
    // Simple piecewise interpolation for U-shape visual
    let x, y;
    if (p < 0.5) {
       const localT = p * 2; // 0 to 1
       const lt1 = 1 - localT;
       // Quad bezier: P0(180,200), P1(180,100), P2(300,100)
       x = lt1*lt1*180 + 2*lt1*localT*180 + localT*localT*300;
       y = lt1*lt1*200 + 2*lt1*localT*100 + localT*localT*100;
    } else {
       const localT = (p - 0.5) * 2; // 0 to 1
       const lt1 = 1 - localT;
       // Quad bezier: P0(300,100), P1(420,100), P2(420,200)
       x = lt1*lt1*300 + 2*lt1*localT*420 + localT*localT*420;
       y = lt1*lt1*100 + 2*lt1*localT*100 + localT*localT*200;
    }
    return { x, y: y + 10 }; // slight offset inside tube
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">1. 丹尼爾電池 (Galvanic Cell)</h2>
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-8 py-3 rounded-full font-bold text-white transition-colors text-lg shadow-md ${
            isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
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
            {/* Gradients and Filters */}
            <linearGradient id="gradZn" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="gradCu" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <pattern id="dashedPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M0,10 L10,0" stroke="#94a3b8" strokeWidth="1" />
            </pattern>
          </defs>

          {/* --- Static Lab Equipment --- */}

          {/* Beaker Left (Zn) */}
          <rect x="50" y="180" width="160" height="200" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
          {/* Zn Solution (ZnSO4 - Clear/Greyish) */}
          <path d="M 55,200 L 205,200 L 205,370 Q 205,375 200,375 L 60,375 Q 55,375 55,370 Z" fill="#f1f5f9" opacity="0.8" />
          <text x="130" y="360" textAnchor="middle" fontSize="14" fill="#475569" fontWeight="bold">ZnSO₄(aq)</text>

          {/* Beaker Right (Cu) */}
          <rect x="390" y="180" width="160" height="200" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />
          {/* Cu Solution (CuSO4 - Blue) */}
          <path d="M 395,200 L 545,200 L 545,370 Q 545,375 540,375 L 400,375 Q 395,375 395,370 Z" fill="#3b82f6" opacity="0.4" />
          <text x="470" y="360" textAnchor="middle" fontSize="14" fill="#1e40af" fontWeight="bold">CuSO₄(aq)</text>

          {/* --- ELECTRODES --- */}
          
          {/* 1. Zinc Electrode (Oxidation -> Shrinks) */}
          {/* Ghost/Original Outline: Shows where it started */}
          <rect 
            x="80" y="120" width="40" height="200" 
            fill="#e2e8f0" fillOpacity="0.3" 
            stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5"
          />
          {/* Active/Shrinking Electrode */}
          {/* width shrinks from 40 down to 10 */}
          <rect 
            x="80" 
            y="120" 
            width={Math.max(10, 40 - deformation)} 
            height="200" 
            fill="url(#gradZn)" 
            stroke="#475569" 
          />
          {/* Label */}
          <text x="65" y="220" textAnchor="end" fill="#334155" fontSize="14" fontWeight="bold" style={{writingMode: "vertical-rl"}}>
            Zn 負極 (Anode)
          </text>
          
          {/* 2. Copper Electrode (Reduction -> Grows) */}
          {/* Ghost/Original Outline: Shows where it started */}
          <rect 
            x="480" y="120" width="40" height="200" 
            fill="none" 
            stroke="#78350f" strokeWidth="2" strokeDasharray="5,5" strokeOpacity="0.5"
          />
          {/* Active/Growing Electrode */}
          {/* Grows towards left (solution). x moves left, width increases. */}
          <rect 
            x={480 - deformation} 
            y="120" 
            width={40 + deformation} 
            height="200" 
            fill="url(#gradCu)" 
            stroke="#78350f" 
          />
          {/* Label */}
          <text x="535" y="220" textAnchor="start" fill="#451a03" fontSize="14" fontWeight="bold" style={{writingMode: "vertical-rl"}}>
            Cu 正極 (Cathode)
          </text>


          {/* Salt Bridge */}
          <path d="M 170,200 Q 170,90 300,90 Q 430,90 430,200 L 410,200 Q 410,110 300,110 Q 190,110 190,200 Z" fill="#fffbeb" stroke="#d97706" strokeWidth="2" opacity="0.9" />
          <text x="300" y="130" textAnchor="middle" fontSize="14" fill="#92400e" fontWeight="bold">鹽橋 (Salt Bridge)</text>

          {/* External Circuit (Wire) */}
          <path d={WIRE_PATH} fill="none" stroke="#333" strokeWidth="4" />

          {/* Voltmeter */}
          <g transform="translate(300, 40)">
            {/* Outer Case */}
            <circle r="30" fill="#fef08a" stroke="#333" strokeWidth="3" />
            {/* Terminals */}
            <circle cx="-30" cy="0" r="4" fill="black" />
            <circle cx="30" cy="0" r="4" fill="black" />
            
            <text x="0" y="8" textAnchor="middle" fontSize="22" fontWeight="bold">V</text>
            
            {/* Polarity & Electrode Labels on Voltmeter */}
            <text x="-45" y="-10" fontSize="16" fontWeight="bold" textAnchor="end" fill="#dc2626">- (Anode)</text>
            <text x="45" y="-10" fontSize="16" fontWeight="bold" textAnchor="start" fill="#dc2626">+ (Cathode)</text>
            
            {/* Reading */}
            <text x="0" y="45" textAnchor="middle" fontSize="14" fill="#000" fontWeight="bold">1.10 V</text>
          </g>


          {/* --- Dynamic Particle Layer --- */}
          
          {/* 1. Electrons (Zn -> Cu) */}
          {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((offset, i) => {
             const pos = getWirePos(time + offset);
             return (
               <g key={`e-${i}`} transform={`translate(${pos.x}, ${pos.y})`}>
                 <circle r="5" fill="#eab308" stroke="black" strokeWidth="1" />
                 <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="bold">e⁻</text>
               </g>
             );
          })}

          {/* 2. Zn Oxidation: Zn (solid) -> Zn2+ (solution) + 2e- */}
          {[0, 0.25, 0.5, 0.75].map((offset, i) => {
            const t = (time + offset) % 1;
            // Adjust start position based on deformation (electrode shrinking)
            const currentEdge = 80 + Math.max(10, 40 - deformation);
            
            // Start at current electrode edge, move right into solution
            const x = currentEdge + t * 40; 
            const y = 250 + Math.sin(t * 10) * 10;
            return (
              <g key={`zn-${i}`} transform={`translate(${x}, ${y})`} opacity={1 - t}>
                <circle r="8" fill="#cbd5e1" stroke="#475569" />
                <text x="0" y="3" textAnchor="middle" fontSize="8">Zn²⁺</text>
              </g>
            );
          })}
          
          {/* Label for Oxidation */}
          <text x="100" y="340" textAnchor="middle" fontSize="12" fill="#333" className="font-mono font-bold">
            Zn → Zn²⁺ + 2e⁻
          </text>

          {/* 3. Cu Reduction: Cu2+ (solution) + 2e- -> Cu (solid) */}
          {[0, 0.25, 0.5, 0.75].map((offset, i) => {
            const t = (time + offset) % 1;
            // Adjust end position based on deformation (electrode growing)
            const currentEdge = 480 - deformation;
            
            // Start in solution (approx x=430), move right to current electrode edge
            const startX = 430;
            const dist = currentEdge - startX;
            const x = startX + t * dist;
            
            const y = 250 + Math.sin(t * 10 + 2) * 10;
            
            // Disappear when it hits the plate
            const op = t > 0.9 ? 0 : 1;
            
            return (
              <g key={`cu-${i}`} transform={`translate(${x}, ${y})`} opacity={op}>
                <circle r="8" fill="#3b82f6" stroke="#1e40af" />
                <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white">Cu²⁺</text>
              </g>
            );
          })}
          
          {/* Label for Reduction */}
          <text x="500" y="340" textAnchor="middle" fontSize="12" fill="#333" className="font-mono font-bold">
            Cu²⁺ + 2e⁻ → Cu
          </text>


          {/* 4. Salt Bridge Ions */}
          
          {/* Anions (-) -> Move to LEFT (Zn side) */}
          {[0, 0.2, 0.4, 0.6, 0.8].map((offset, i) => {
             const rawT = (time * 0.5 + offset) % 1;
             const finalPos = getBridgePos(rawT, true); 
             
             return (
               <g key={`anion-${i}`} transform={`translate(${finalPos.x}, ${finalPos.y - 5})`}>
                 <circle r="6" fill="#ef4444" stroke="#7f1d1d" />
                 <text x="0" y="3" textAnchor="middle" fontSize="10" fill="white">-</text>
               </g>
             );
          })}

          {/* Cations (+) -> Move to RIGHT (Cu side) */}
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((offset, i) => {
             const rawT = (time * 0.5 + offset) % 1;
             const finalPos = getBridgePos(rawT, false);
             
             return (
               <g key={`cation-${i}`} transform={`translate(${finalPos.x}, ${finalPos.y + 5})`}>
                 <circle r="6" fill="#22c55e" stroke="#14532d" />
                 <text x="0" y="3" textAnchor="middle" fontSize="10" fill="white">+</text>
               </g>
             );
          })}

        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-2 right-2 bg-white/95 p-3 rounded-lg border border-slate-300 text-xs shadow-md">
          <div className="font-bold mb-2 text-slate-800 border-b pb-1">圖例 (Legend)</div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black flex items-center justify-center text-[8px]">e</div>
            <span>電子 (Electron)</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-3 border-2 border-dashed border-slate-400 bg-slate-100"></div>
            <span>原電極範圍 (Original)</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-slate-300 border border-slate-600"></div>
            <span>鋅離子 (Zn²⁺)</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-800"></div>
            <span>銅離子 (Cu²⁺)</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>陰離子 (Anion -)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>陽離子 (Cation +)</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-slate-700 w-full max-w-4xl text-sm bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h3 className="font-bold text-lg mb-3 text-slate-900">科學原理說明 (Scientific Process):</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-red-700 mb-1">負極/陽極 (Anode) - 氧化反應</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>反應式：</strong> 
                <span>Zn<sub>(s)</sub> → Zn<sup>2+</sup><sub>(aq)</sub> + 2e<sup>-</sup></span>
              </li>
              <li><strong>現象：</strong> 鋅原子失去電子變成鋅離子溶入溶液。</li>
              <li><strong>結果：</strong> 鋅電極質量減少（變薄），圖中虛線區域顯示消失的部分。</li>
              <li><strong>鹽橋平衡：</strong> 陰離子移向此杯以中和過多的 Zn<sup>2+</sup>。</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-blue-700 mb-1">正極/陰極 (Cathode) - 還原反應</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>反應式：</strong> 
                <span>Cu<sup>2+</sup><sub>(aq)</sub> + 2e<sup>-</sup> → Cu<sub>(s)</sub></span>
              </li>
              <li><strong>現象：</strong> 溶液中的銅離子得到電子變成銅原子。</li>
              <li><strong>結果：</strong> 銅原子附著在電極上（變厚），超出原本虛線範圍。</li>
              <li><strong>鹽橋平衡：</strong> 陽離子移向此杯以補充正電荷。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};