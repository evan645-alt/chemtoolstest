import React, { useEffect, useRef, useState, useCallback } from 'react';

const ANIMATION_SPEED = 0.0015;

export const DisplacementReaction: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1 represents reaction completion
  const requestRef = useRef<number>(0);

  const animate = useCallback(() => {
    setProgress((prev) => {
      if (prev >= 1) return 1;
      return prev + ANIMATION_SPEED;
    });
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isPlaying && progress < 1) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, progress, animate]);

  // Solution Opacity: Starts at 0.6 (Blue), fades to 0.1 (Clear/Grey)
  const solutionOpacity = 0.6 * (1 - progress) + 0.05;

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-lg mt-8 border-t-4 border-green-600">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">2. 鋅銅取代反應 (Displacement Reaction)</h2>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={progress >= 1}
          className={`px-8 py-3 rounded-full font-bold text-white transition-colors text-lg shadow-md ${
             progress >= 1 ? 'bg-gray-400 cursor-not-allowed' : 
             isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {progress >= 1 ? '反應結束 (Finished)' : isPlaying ? '暫停 (Pause)' : '開始 (Start)'}
        </button>
        <button
          onClick={() => setProgress(0)}
          className="px-4 py-3 rounded-full font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
        >
          重置 (Reset)
        </button>
      </div>

      <div className="relative w-full aspect-[5/3] border-2 border-slate-300 rounded-xl overflow-hidden bg-gray-50 shadow-inner">
        <svg viewBox="0 0 600 400" className="w-full h-full">
          <defs>
            <linearGradient id="gradZnBar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <filter id="roughSurface">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
            </filter>
          </defs>

          {/* Beaker */}
          <rect x="200" y="150" width="200" height="230" rx="10" fill="#fff" stroke="#94a3b8" strokeWidth="2" />

          {/* Solution (Fading Blue) */}
          <path 
            d="M 205,170 L 395,170 L 395,370 Q 395,375 390,375 L 210,375 Q 205,375 205,370 Z" 
            fill="#3b82f6" 
            fillOpacity={solutionOpacity}
          />
          <text x="300" y="360" textAnchor="middle" fontSize="14" fill="#1e3a8a" opacity={solutionOpacity + 0.3} fontWeight="bold">
            {progress < 0.8 ? "CuSO₄(aq)" : "ZnSO₄(aq)"}
          </text>

          {/* Zinc Bar */}
          {/* Base Zinc */}
          <rect x="280" y="100" width="40" height="200" fill="url(#gradZnBar)" stroke="#475569" />
          
          {/* Copper Coating (Black/Dark Red spongy mass) */}
          {/* Grows as progress increases */}
          <g opacity={progress}>
             <rect 
               x="278" y="170" width="44" height="130" 
               fill="#451a03" rx="2" filter="url(#roughSurface)" opacity="0.9"
             />
             {/* Add some reddish distinct spots */}
             <circle cx="285" cy="200" r="3" fill="#b45309" />
             <circle cx="315" cy="250" r="4" fill="#b45309" />
             <circle cx="290" cy="280" r="3" fill="#b45309" />
          </g>

          <text x="300" y="90" textAnchor="middle" fontWeight="bold" fill="#334155">鋅片 (Zn Plate)</text>

          {/* --- Microscopic Reactions --- */}

          {/* 1. Zn atoms leaving (becoming ions) */}
          {[0, 0.25, 0.5, 0.75].map((offset, i) => {
            const loopT = (progress * 50 + offset) % 1; // Fast local loop based on progress
            if (progress > 0.9) return null; // Stop animation when mostly done
            
            // Start at surface, move out
            const y = 180 + (i * 40);
            const x = 280; // Left side of plate
            
            return (
              <g key={`zn-loss-${i}`} transform={`translate(${x - loopT * 30}, ${y})`} opacity={1 - loopT}>
                <circle r="6" fill="#cbd5e1" stroke="#475569" />
                <text x="0" y="3" textAnchor="middle" fontSize="8">Zn²⁺</text>
              </g>
            );
          })}

          {/* 2. Cu ions approaching and sticking */}
          {[0.1, 0.35, 0.6, 0.85].map((offset, i) => {
            const loopT = (progress * 50 + offset) % 1;
            if (progress > 0.9) return null;

            // Start far, move to surface
            const y = 190 + (i * 35);
            const startX = 350; 
            const endX = 320; // Right side of plate
            const currentX = startX - (loopT * (startX - endX));
            
            return (
               <g key={`cu-gain-${i}`} transform={`translate(${currentX}, ${y})`} opacity={loopT < 0.9 ? 1 : 0}>
                 <circle r="6" fill="#3b82f6" stroke="#1e40af" fillOpacity={solutionOpacity + 0.2} />
                 <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white">Cu²⁺</text>
               </g>
            );
          })}

          {/* 3. Direct Electron Transfer (Flash at surface) */}
          {[0, 0.2, 0.4, 0.6, 0.8].map((offset, i) => {
             const loopT = (progress * 50 + offset) % 1;
             if (progress > 0.9) return null;
             
             // Randomize y slightly
             const y = 180 + i * 30;
             // Tiny hop from Zn surface (320) to Cu ion (322)
             // Visualized as a small yellow flash appearing
             if (loopT > 0.8 && loopT < 0.95) {
                 return (
                    <g key={`e-trans-${i}`} transform={`translate(320, ${y})`}>
                        <circle r="4" fill="#eab308" stroke="black" />
                        <text x="5" y="-5" fontSize="10" fontWeight="bold" fill="#eab308">e⁻</text>
                    </g>
                 )
             }
             return null;
          })}
          
          {/* Labels inside SVG */}
          <g transform="translate(450, 200)">
             <text x="0" y="0" fontWeight="bold" fill="#333" fontSize="14">微觀反應：</text>
             <text x="0" y="25" fontSize="12" fill="#555">1. Zn 放出 2e⁻ (氧化)</text>
             <text x="0" y="45" fontSize="12" fill="#555">2. e⁻ 停留在鋅片表面</text>
             <text x="0" y="65" fontSize="12" fill="#555">3. Cu²⁺ 接觸表面獲得 2e⁻</text>
             <text x="0" y="85" fontSize="12" fill="#555">4. 銅析出覆蓋鋅片</text>
          </g>

        </svg>

        <div className="absolute bottom-2 right-2 bg-white/90 p-2 rounded border text-xs shadow">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>銅離子 (藍色溶液)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-slate-300 rounded-full border border-slate-500"></div>
                <span>鋅離子 (無色)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-900 rounded"></div>
                <span>銅析出物 (變黑/紅)</span>
            </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-green-50 rounded-lg w-full text-sm border border-green-100">
         <h3 className="font-bold text-green-900 mb-2">原理說明 (Direct Displacement)：</h3>
         <p className="text-slate-700 mb-2">
           鋅的活性大於銅 (Zn &gt; Cu)，因此鋅會主動將電子傳遞給銅離子。由於沒有導線連接，電子直接在接觸面上轉移。
         </p>
         <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>
              <strong>總反應：</strong>
              <span> Zn<sub>(s)</sub> + Cu<sup>2+</sup><sub>(aq)</sub> → Zn<sup>2+</sup><sub>(aq)</sub> + Cu<sub>(s)</sub></span>
            </li>
            <li><strong>現象：</strong> 藍色溶液變淡 (Cu<sup>2+</sup>濃度下降)，鋅片表面附著紅黑色固體 (Cu)。</li>
         </ul>
      </div>
    </div>
  );
};