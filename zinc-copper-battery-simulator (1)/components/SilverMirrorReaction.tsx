import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types & Constants ---
type Reagent = 'A' | 'B' | 'C' | 'D';

interface DropState {
  A: number; // AgNO3
  B: number; // NaOH
  C: number; // Ammonia
  D: number; // Glucose
}

const SUGGESTED_DROPS = {
  A: 10,
  B: 10,
  C: "1.2x A (約12滴)",
  D: 5
};

export const SilverMirrorReaction: React.FC = () => {
  // --- State ---
  const [drops, setDrops] = useState<DropState>({ A: 0, B: 0, C: 0, D: 0 });
  const [isCapped, setIsCapped] = useState(false);
  const [shakeSpeed, setShakeSpeed] = useState(0); // 0 to 100
  const [reactionProgress, setReactionProgress] = useState(0); // 0 to 100 (Silver coating)
  const [warning, setWarning] = useState<string | null>(null);
  
  // Physics/Animation Ref
  const requestRef = useRef<number>(0);
  const shakeOffsetRef = useRef(0); // For visual vibration

  // --- Derived Logic ---
  
  // 1. Total Volume (proportional to drops)
  const totalDrops = drops.A + drops.B + drops.C + drops.D;
  // Cap visual height at a reasonable max for the vial
  const liquidHeightPercent = Math.min((totalDrops / 50) * 100, 90); 

  // 2. Precipitate Logic (Brown Ag2O)
  // Forms if A > 0 and B > 0.
  // Dissolves if C >= A * 1.2
  const hasReactantsForPpt = drops.A > 0 && drops.B > 0;
  // Calculate how much "cloudiness" remains. 
  // If C is 0, cloudiness is max (based on min(A,B)). 
  // If C >= 1.2 * A, cloudiness is 0.
  const neededAmmonia = drops.A * 1.2;
  const ammoniaRatio = neededAmmonia > 0 ? Math.min(drops.C / neededAmmonia, 1) : 1;
  
  // Base turbidity depends on the presence of Ag2O reactants
  const baseTurbidity = hasReactantsForPpt ? Math.min(drops.A, drops.B) / 10 : 0;
  // Final turbidity is reduced by ammonia
  const turbidity = Math.max(0, baseTurbidity * (1 - ammoniaRatio));
  const isCloudy = turbidity > 0.1;
  const isClearComplex = hasReactantsForPpt && !isCloudy;

  // 3. Reaction Conditions for Silver Mirror
  // Needs: Complex Ion (Clear) + Glucose (D) + Time/Shake
  const canReact = isClearComplex && drops.D > 0;

  // --- Animation Loop ---
  const animate = useCallback(() => {
    // Visual Shake
    if (shakeSpeed > 0) {
      shakeOffsetRef.current = Math.sin(Date.now() / 20) * (shakeSpeed / 20);
    } else {
      shakeOffsetRef.current = 0;
    }

    // Warning Logic: Shaking without cap
    if (shakeSpeed > 0 && !isCapped) {
      setWarning("警告：危險！請先蓋上蓋子再搖晃 (Danger: Cap the vial before shaking!)");
      setShakeSpeed(0); // Force stop
    } else if (warning && isCapped) {
      setWarning(null); // Clear warning if fixed
    }

    // Reaction Kinetics
    // Factors: 
    // 1. Positive: Shake Speed (Kinetic energy/mixing)
    // 2. Negative: Total Volume (Dilution/Thermal mass as requested)
    if (canReact && isCapped && shakeSpeed > 0 && reactionProgress < 100) {
      // Logic: Rate increases with shakeSpeed, decreases with totalDrops
      // Base rate * ShakeFactor / VolumeFactor
      // Adding a constant to volume to prevent divide by zero or extreme speeds
      const rate = (0.05 * shakeSpeed) / (totalDrops + 5); 
      
      setReactionProgress(prev => Math.min(prev + rate, 100));
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [shakeSpeed, isCapped, canReact, totalDrops, reactionProgress, warning]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);


  // --- Handlers ---
  const addDrop = (type: Reagent) => {
    if (isCapped) {
      setWarning("請先打開蓋子才能滴加試劑 (Uncap first)");
      return;
    }
    setWarning(null);
    setDrops(prev => ({ ...prev, [type]: prev[type] + 1 }));
    
    // Reset reaction if we add more reagents after finishing (optional, but keeps logic clean)
    // But usually adding more reagents to a finished mirror just adds liquid.
  };

  const handleReset = () => {
    setDrops({ A: 0, B: 0, C: 0, D: 0 });
    setIsCapped(false);
    setShakeSpeed(0);
    setReactionProgress(0);
    setWarning(null);
  };

  // --- Colors & Visuals ---
  
  // Liquid Color Logic
  // 1. Brown/Black if cloudy
  // 2. Clear if complex formed
  // 3. Silvering happens on the WALLS, but for 2D SVG we overlay a gradient
  
  // The liquid itself inside
  const getLiquidColor = () => {
    if (totalDrops === 0) return "transparent";
    if (isCloudy) return "#3f2e18"; // Muddy brown
    if (drops.A > 0 && drops.B === 0) return "#e2e8f0"; // Clear Agno3
    return "#f1f5f9"; // Clear
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-lg mt-8 border-t-4 border-slate-600">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">4. 銀鏡反應 (Silver Mirror Reaction)</h2>
      
      {/* Controls Area */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        
        {/* Left: Reagent Controls */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">1. 試劑滴加 (Add Reagents)</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Reagent A */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">A劑: 硝酸銀 (AgNO₃)</label>
              <button onClick={() => addDrop('A')} className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 py-2 rounded font-mono transition">
                滴加 (+1)
              </button>
              <div className="flex justify-between text-xs text-slate-600 px-1">
                <span>目前: {drops.A}</span>
                <span className="text-green-600">建議: {SUGGESTED_DROPS.A}</span>
              </div>
            </div>

            {/* Reagent B */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">B劑: 氫氧化鈉 (NaOH)</label>
              <button onClick={() => addDrop('B')} className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 py-2 rounded font-mono transition">
                滴加 (+1)
              </button>
               <div className="flex justify-between text-xs text-slate-600 px-1">
                <span>目前: {drops.B}</span>
                <span className="text-green-600">建議: {SUGGESTED_DROPS.B}</span>
              </div>
            </div>

            {/* Reagent C */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">C劑: 濃氨水 (NH₃)</label>
              <button onClick={() => addDrop('C')} className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 py-2 rounded font-mono transition">
                滴加 (+1)
              </button>
               <div className="flex justify-between text-xs text-slate-600 px-1">
                <span>目前: {drops.C}</span>
                <span className="text-green-600">建議: {Math.ceil(drops.A * 1.2)}</span>
              </div>
            </div>

            {/* Reagent D */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500">D劑: 葡萄糖 (Glucose)</label>
              <button onClick={() => addDrop('D')} className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 py-2 rounded font-mono transition">
                滴加 (+1)
              </button>
               <div className="flex justify-between text-xs text-slate-600 px-1">
                <span>目前: {drops.D}</span>
                <span className="text-green-600">建議: {SUGGESTED_DROPS.D}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Action Controls */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">2. 實驗操作 (Actions)</h3>
            
            {/* Cap Control */}
            <div className="flex items-center justify-between mb-4 p-2 bg-white rounded border">
              <span className="text-sm font-bold text-slate-700">瓶蓋狀態 (Cap):</span>
              <button 
                onClick={() => setIsCapped(!isCapped)}
                className={`px-4 py-1 rounded-full text-sm font-bold transition-colors ${isCapped ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
              >
                {isCapped ? "已蓋上 (Capped)" : "已打開 (Open)"}
              </button>
            </div>

            {/* Shake Control */}
            <div className="mb-4">
               <div className="flex justify-between mb-1">
                 <label className="text-sm font-bold text-slate-700">搖晃速度 (Shaking):</label>
                 <span className="text-xs font-mono">{shakeSpeed}%</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={shakeSpeed} 
                 onChange={(e) => setShakeSpeed(Number(e.target.value))}
                 className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
               <p className="text-[10px] text-slate-500 mt-1">
                 * 搖晃越快，反應越快 (Faster shake = Faster reaction)
               </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2 rounded font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
          >
            重置實驗 (Reset Experiment)
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className="w-full bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded animate-pulse" role="alert">
          <p className="font-bold">⚠️ {warning}</p>
        </div>
      )}

      {/* Main Visualization Area */}
      <div className="relative w-full max-w-md aspect-[4/5] mx-auto flex items-center justify-center">
        <svg viewBox="0 0 300 400" className="w-full h-full overflow-visible">
          <defs>
            {/* Gradient for Silver Mirror Effect (Shiny Metallic) */}
            <radialGradient id="silverGradient" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#d1d5db" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="1" />
            </radialGradient>
            
            {/* Filter for Brown Precipitate (Cloudy Noise) */}
            <filter id="brownCloud">
              <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="4" result="noise" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.4  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 1 0" in="noise" result="coloredNoise" />
              <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" />
            </filter>

            {/* Glass Reflection */}
            <linearGradient id="glassReflect" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0.1" />
              <stop offset="20%" stopColor="white" stopOpacity="0.3" />
              <stop offset="40%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Shaking Animation Group */}
          <g transform={`translate(${shakeOffsetRef.current * 10}, 0)`}>
            
            {/* Vial Body (Rectangular with rounded bottom) */}
            <path 
              d="M 100,100 L 100,330 Q 100,350 120,350 L 180,350 Q 200,350 200,330 L 200,100 Z" 
              fill="none" 
              stroke="#94a3b8" 
              strokeWidth="3" 
            />
            {/* Vial Neck/Rim */}
            <rect x="95" y="90" width="110" height="10" rx="2" fill="#cbd5e1" stroke="#64748b" />

            {/* Liquid Content - Masked by vial shape conceptually */}
            <mask id="vialMask">
               <path d="M 102,100 L 102,330 Q 102,348 120,348 L 180,348 Q 198,348 198,330 L 198,100 Z" fill="white" />
            </mask>

            <g mask="url(#vialMask)">
               {/* The Liquid Level */}
               {/* Height depends on total drops. 
                   Max height y=100, Bottom y=350. Range = 250px. 
                   Percent maps to this range.
               */}
               <rect 
                 x="100" 
                 y={350 - (liquidHeightPercent / 100) * 250} 
                 width="100" 
                 height="250" 
                 fill={getLiquidColor()}
                 opacity={0.9}
               />

               {/* Brown Precipitate Overlay (Cloud) */}
               {isCloudy && (
                 <rect 
                    x="100" 
                    y={350 - (liquidHeightPercent / 100) * 250} 
                    width="100" 
                    height="250"
                    filter="url(#brownCloud)"
                    opacity={turbidity * 1.5} // Boost visibility
                 />
               )}

               {/* Silver Mirror Coating Overlay */}
               {/* Appears on the WALLS (simulated by filling the rect) as reaction progress increases */}
               <rect 
                 x="100" 
                 y={100} // Silver coats the wet walls, simplified to whole area for 2D effect
                 width="100" 
                 height="250" 
                 fill="url(#silverGradient)"
                 opacity={reactionProgress / 100} 
               />
            </g>

            {/* Glass Shine Overlay */}
             <path 
              d="M 100,100 L 100,330 Q 100,350 120,350 L 180,350 Q 200,350 200,330 L 200,100 Z" 
              fill="url(#glassReflect)" 
              pointerEvents="none"
            />

            {/* Cap (Visual) */}
            {isCapped && (
              <g>
                <rect x="95" y="60" width="110" height="30" rx="4" fill="#334155" stroke="#1e293b" />
                {/* Thread lines */}
                <line x1="95" y1="70" x2="205" y2="70" stroke="#475569" strokeWidth="1" />
                <line x1="95" y1="80" x2="205" y2="80" stroke="#475569" strokeWidth="1" />
              </g>
            )}

          </g>

          {/* Status Labels inside SVG */}
          <text x="150" y="380" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
            {reactionProgress > 90 ? "銀鏡反應完成！ (Mirror Formed!)" : 
             isCloudy ? "混濁沉澱 (Cloudy Ppt)" :
             isClearComplex ? "澄清錯離子溶液 (Clear)" : "溶液 (Solution)"}
          </text>

        </svg>
      </div>

      {/* Chemical Principles Explanation */}
      <div className="mt-4 p-4 bg-slate-100 rounded-lg w-full text-sm border border-slate-300">
         <h3 className="font-bold text-slate-800 mb-2">反應式與實驗原理 (Reactions)：</h3>
         
         <div className="space-y-3">
           <div className="border-l-4 border-slate-400 pl-2">
             <p className="font-bold text-slate-700">步驟 1 (滴加 A + B): 產生氧化銀沉澱</p>
             <p className="font-mono text-xs mt-1 bg-white p-1 rounded">
               2AgNO₃ + 2NaOH → Ag₂O↓(褐色) + H₂O + 2NaNO₃
             </p>
           </div>

           <div className="border-l-4 border-blue-400 pl-2">
             <p className="font-bold text-slate-700">步驟 2 (滴加 C): 沉澱溶解形成銀氨錯離子</p>
             <p className="text-xs text-slate-500 italic">當氨水加入量適當 (約 1.2倍) 時，沉澱完全溶解。</p>
             <p className="font-mono text-xs mt-1 bg-white p-1 rounded">
               Ag₂O + 4NH₃ + H₂O → 2[Ag(NH₃)₂]⁺ + 2OH⁻ (澄清)
             </p>
           </div>

           <div className="border-l-4 border-yellow-500 pl-2">
             <p className="font-bold text-slate-700">步驟 3 (滴加 D + 搖晃): 氧化還原析出銀鏡</p>
             <p className="text-xs text-slate-500 italic">
               搖晃加快反應碰撞頻率；總體積越大，反應速率相對越慢 (溫度/濃度分散效應)。
             </p>
             <p className="font-mono text-xs mt-1 bg-white p-1 rounded">
               C₅H₁₁O₅-CHO + 2[Ag(NH₃)₂]⁺ + 3OH⁻ → C₅H₁₁O₅-COO⁻ + 2Ag↓(銀鏡) + 4NH₃ + 2H₂O
             </p>
           </div>
         </div>
      </div>
    </div>
  );
};
