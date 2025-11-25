import React, { useState, useMemo } from 'react';

// --- Constants & Types ---
const ACID_VOL_INITIAL = 25; // mL
const ACID_CONC = 0.1; // M
const BASE_CONC = 0.1; // M

// Constants for Weak electrolytes
const KA_ACETIC = 1.8e-5; // pKa = 4.74
const KB_AMMONIA = 1.8e-5; // pKb = 4.74 -> pKa(NH4+) = 9.26
const KW = 1e-14;

type IndicatorType = 'phenolphthalein' | 'methylRed' | 'bromothymolBlue';
type ElectrolyteType = 'strong' | 'weak';

interface TitrationState {
  addedBaseVol: number; // mL
  indicator: IndicatorType;
  acidType: ElectrolyteType;
  baseType: ElectrolyteType;
}

interface IndicatorInfo {
  name: string;
  rangeLow: number;
  rangeHigh: number;
  colorLow: string;
  colorHigh: string;
  label: string;
}

const INDICATORS: Record<IndicatorType, IndicatorInfo> = {
  phenolphthalein: {
    name: '酚酞',
    rangeLow: 8.2,
    rangeHigh: 10.0,
    colorLow: '#ffffff', // clear
    colorHigh: '#ec4899', // pink
    label: '8.2 - 10.0'
  },
  methylRed: {
    name: '甲基紅',
    rangeLow: 4.4,
    rangeHigh: 6.2,
    colorLow: '#ef4444', // red
    colorHigh: '#eab308', // yellow
    label: '4.4 - 6.2'
  },
  bromothymolBlue: {
    name: '溴瑞香草芬藍',
    rangeLow: 6.0,
    rangeHigh: 7.6,
    colorLow: '#eab308', // yellow
    colorHigh: '#3b82f6', // blue
    label: '6.0 - 7.6'
  }
};

// --- Helper Functions ---

/**
 * Robust pH Calculation for Titration
 * Handles: SA+SB, WA+SB, SA+WB, WA+WB
 */
const calculatePH = (vBase: number, acidType: ElectrolyteType, baseType: ElectrolyteType) => {
  const vAcid = ACID_VOL_INITIAL;
  const cAcid = ACID_CONC;
  const cBase = BASE_CONC;

  const molesA = vAcid * cAcid; // 2.5
  const molesB = vBase * cBase;
  const totalVol = vAcid + vBase; // mL

  // 1. Strong Acid + Strong Base
  if (acidType === 'strong' && baseType === 'strong') {
    if (molesB < molesA) {
      return -Math.log10((molesA - molesB) / totalVol);
    } else if (Math.abs(molesB - molesA) < 1e-9) {
      return 7.0;
    } else {
      const pOH = -Math.log10((molesB - molesA) / totalVol);
      return 14.0 - pOH;
    }
  }

  // 2. Weak Acid + Strong Base (e.g., CH3COOH + NaOH)
  if (acidType === 'weak' && baseType === 'strong') {
    // Initial
    if (vBase === 0) {
      // [H+] = sqrt(Ka * C)
      return -Math.log10(Math.sqrt(KA_ACETIC * cAcid));
    }
    // Buffer Region
    if (molesB < molesA) {
      // pH = pKa + log(salt/acid)
      // Salt formed = molesB, Remaining Acid = molesA - molesB
      const pKa = -Math.log10(KA_ACETIC);
      return pKa + Math.log10(molesB / (molesA - molesB));
    }
    // Equivalence Point
    if (Math.abs(molesB - molesA) < 1e-9) {
      // Salt hydrolysis: A- + H2O <-> HA + OH-
      // Kb = Kw/Ka
      // [OH-] = sqrt(Kb * [Salt])
      const concSalt = molesA / totalVol;
      const Kb = KW / KA_ACETIC;
      const pOH = -Math.log10(Math.sqrt(Kb * concSalt));
      return 14.0 - pOH;
    }
    // Excess Base
    if (molesB > molesA) {
      // Dominated by strong base
      const pOH = -Math.log10((molesB - molesA) / totalVol);
      return 14.0 - pOH;
    }
  }

  // 3. Strong Acid + Weak Base (e.g., HCl + NH3)
  if (acidType === 'strong' && baseType === 'weak') {
    // Initial (Strong Acid)
    if (vBase === 0) {
      return -Math.log10(cAcid);
    }
    // Excess Acid Region
    if (molesB < molesA) {
      // Strong acid dominates
      return -Math.log10((molesA - molesB) / totalVol);
    }
    // Equivalence Point
    if (Math.abs(molesB - molesA) < 1e-9) {
      // Salt hydrolysis: NH4+ <-> NH3 + H+
      // Ka = Kw/Kb
      // [H+] = sqrt(Ka * [Salt])
      const concSalt = molesA / totalVol;
      const Ka = KW / KB_AMMONIA;
      return -Math.log10(Math.sqrt(Ka * concSalt));
    }
    // Buffer Region (Excess Weak Base)
    if (molesB > molesA) {
      // NH3 + NH4+ buffer
      // pH = pKa(NH4+) + log(Base/Salt)
      // Base remaining = molesB - molesA
      // Salt formed = molesA
      const pKaNH4 = 14.0 - (-Math.log10(KB_AMMONIA));
      return pKaNH4 + Math.log10((molesB - molesA) / molesA);
    }
  }

  // 4. Weak Acid + Weak Base (e.g., CH3COOH + NH3)
  // This is complex, but we can approximate regions.
  if (acidType === 'weak' && baseType === 'weak') {
    const pKa = -Math.log10(KA_ACETIC);
    const pKaNH4 = 14.0 - (-Math.log10(KB_AMMONIA));

    if (vBase === 0) return -Math.log10(Math.sqrt(KA_ACETIC * cAcid));

    // Before Eq: Buffer of Acid
    if (molesB < molesA) {
       return pKa + Math.log10(molesB / (molesA - molesB));
    }
    // At Eq: pH approx (pKa1 + pKa2)/2
    if (Math.abs(molesB - molesA) < 1e-9) {
       return (pKa + pKaNH4) / 2;
    }
    // After Eq: Buffer of Base
    if (molesB > molesA) {
       return pKaNH4 + Math.log10((molesB - molesA) / molesA);
    }
  }

  return 7;
};

// Determine Color based on Indicator and pH
const getSolutionColor = (ph: number, type: IndicatorType): string => {
  const ind = INDICATORS[type];
  if (ph < ind.rangeLow) return '#f1f5f9'; // Use neutral for low unless colored
  // Custom color mapping for specific indicators to look realistic
  if (type === 'phenolphthalein') {
    if (ph < 8.2) return '#f8fafc'; // Clear
    if (ph > 10.0) return '#ec4899'; // Pink
    return '#fbcfe8'; // Transition
  }
  if (type === 'methylRed') {
    if (ph < 4.4) return '#ef4444'; // Red
    if (ph > 6.2) return '#eab308'; // Yellow
    return '#f97316'; // Orange
  }
  if (type === 'bromothymolBlue') {
    if (ph < 6.0) return '#eab308'; // Yellow
    if (ph > 7.6) return '#3b82f6'; // Blue
    return '#22c55e'; // Green
  }
  return '#f1f5f9';
};

// Generate explanation based on state
const getExplanation = (vol: number, acidType: ElectrolyteType, baseType: ElectrolyteType) => {
  const vAcid = ACID_VOL_INITIAL;
  const isEq = Math.abs(vol - vAcid) < 0.1;
  const isPre = vol < vAcid;
  const isPost = vol > vAcid;

  // Case 1: Strong Acid + Strong Base
  if (acidType === 'strong' && baseType === 'strong') {
    if (vol === 0) return {
      title: '初始狀態 (Initial)',
      formula: '[H⁺] = Cₐ',
      desc: '強酸完全解離，氫離子濃度直接等於酸的莫耳濃度。'
    };
    if (isPre) return {
      title: '酸過量 (Excess Acid)',
      formula: '[H⁺] = (Nₐ - Nᵦ) / Vₜ',
      desc: '剩餘的酸莫耳數 (Nₐ-Nᵦ) 除以當前總體積 (Vₜ)，即可得氫離子濃度。'
    };
    if (isEq) return {
      title: '當量點 (Equivalence Point)',
      formula: '[H⁺] = 10⁻⁷',
      desc: '強酸強鹼完全中和，溶液呈中性。'
    };
    if (isPost) return {
      title: '鹼過量 (Excess Base)',
      formula: '[OH⁻] = (Nᵦ - Nₐ) / Vₜ',
      desc: '剩餘的鹼莫耳數除以總體積，求得 [OH⁻]，再推算 pH。'
    };
  }

  // Case 2: Weak Acid + Strong Base
  if (acidType === 'weak' && baseType === 'strong') {
    if (vol === 0) return {
      title: '弱酸解離 (Weak Acid)',
      formula: '[H⁺] ≈ √(Kₐ × Cₐ)',
      desc: '弱酸部分解離，濃度為 Kₐ 與酸濃度的幾何平均數。'
    };
    if (isPre) return {
      title: '緩衝溶液 (Buffer Region)',
      formula: '[H⁺] = Kₐ × (Cₐ / Cₛ)',
      desc: '剩餘弱酸與生成的鹽形成緩衝對。氫離子濃度由 Kₐ 乘上 [酸]/[鹽] 比例決定。'
    };
    if (isEq) return {
      title: '當量點 (Hydrolysis)',
      formula: '[OH⁻] ≈ √(Kₕ × Cₛ)',
      desc: '完全中和生成弱鹼性鹽。鹽類水解產生 OH⁻，需使用 Kₕ (即 Kw/Ka) 計算。'
    };
    if (isPost) return {
      title: '強鹼過量',
      formula: '[OH⁻] ≈ (Nᵦ - Nₐ) / Vₜ',
      desc: '強鹼完全解離，直接由過量的強鹼決定 [OH⁻]。'
    };
  }

  // Case 3: Strong Acid + Weak Base
  if (acidType === 'strong' && baseType === 'weak') {
    if (vol === 0) return {
      title: '強酸初始',
      formula: '[H⁺] = Cₐ',
      desc: '強酸完全解離。'
    };
    if (isPre) return {
      title: '強酸過量',
      formula: '[H⁺] = (Nₐ - Nᵦ) / Vₜ',
      desc: '強酸主導溶液酸鹼值。'
    };
    if (isEq) return {
      title: '當量點 (Hydrolysis)',
      formula: '[H⁺] ≈ √(Kₕ × Cₛ)',
      desc: '完全中和生成弱酸性鹽。鹽類水解產生 H⁺，使用 Kₕ (即 Kw/Kb) 計算。'
    };
    if (isPost) return {
      title: '緩衝溶液 (Buffer Region)',
      formula: '[OH⁻] = K₆ × (C₆ / Cₛ)',
      desc: '過量弱鹼與其共軛酸形成緩衝。OH⁻ 濃度由 Kb 乘上 [鹼]/[鹽] 比例決定。'
    };
  }

  return { title: '複雜系統', formula: '-', desc: '弱酸弱鹼滴定計算較為複雜。' };
};

export const TitrationExperiment: React.FC = () => {
  const [state, setState] = useState<TitrationState>({
    addedBaseVol: 0,
    indicator: 'phenolphthalein',
    acidType: 'strong', // Default HCl
    baseType: 'strong', // Default NaOH
  });

  const currentPH = calculatePH(state.addedBaseVol, state.acidType, state.baseType);
  const currentColor = getSolutionColor(currentPH, state.indicator);
  const selectedInd = INDICATORS[state.indicator];
  const explanation = getExplanation(state.addedBaseVol, state.acidType, state.baseType);

  // --- Graph Data Generation ---
  const graphPoints = useMemo(() => {
    const points = [];
    for (let v = 0; v <= 50; v += 0.5) {
      if (v > 24 && v < 26) {
        for (let fineV = v; fineV < v + 0.5; fineV += 0.1) {
             points.push({ v: fineV, ph: calculatePH(fineV, state.acidType, state.baseType) });
        }
      } else {
        points.push({ v, ph: calculatePH(v, state.acidType, state.baseType) });
      }
    }
    return points;
  }, [state.acidType, state.baseType]);

  // Coordinate mapping for Graph (SVG 300x200)
  // X-axis: 0-50 mL -> 40-280 px
  // Y-axis: 0-14 pH -> 180-20 px
  const mapX = (v: number) => 40 + (v / 50) * 240;
  const mapY = (ph: number) => 180 - (ph / 14) * 160;

  const polylinePoints = graphPoints
    .map(p => `${mapX(p.v)},${mapY(p.ph)}`)
    .join(' ');

  // Indicator Range Box
  const indRangeYStart = mapY(selectedInd.rangeHigh);
  const indRangeHeight = mapY(selectedInd.rangeLow) - indRangeYStart;

  // --- Handlers ---
  const addVolume = (amount: number) => {
    // Ensure volume stays between 0 and 50
    setState(prev => ({ 
      ...prev, 
      addedBaseVol: Math.max(0, Math.min(prev.addedBaseVol + amount, 50)) 
    }));
  };

  const reset = () => {
    setState(prev => ({ ...prev, addedBaseVol: 0 }));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 bg-white rounded-xl shadow-lg mt-8 border-t-4 border-purple-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">5. 酸鹼滴定 (Acid-Base Titration)</h2>
      
      {/* Controls */}
      <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 space-y-4">
        
        {/* Row 1: Configurations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">酸液種類 (Acid)</label>
            <select 
              value={state.acidType}
              onChange={(e) => setState(prev => ({...prev, acidType: e.target.value as ElectrolyteType, addedBaseVol: 0}))}
              className="w-full p-2 border rounded bg-white text-slate-700 font-semibold"
            >
              <option value="strong">強酸 (e.g., HCl)</option>
              <option value="weak">弱酸 (e.g., CH₃COOH)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">鹼液種類 (Base)</label>
            <select 
              value={state.baseType}
              onChange={(e) => setState(prev => ({...prev, baseType: e.target.value as ElectrolyteType, addedBaseVol: 0}))}
              className="w-full p-2 border rounded bg-white text-slate-700 font-semibold"
            >
              <option value="strong">強鹼 (e.g., NaOH)</option>
              <option value="weak">弱鹼 (e.g., NH₃)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">指示劑 (Indicator)</label>
            <select 
              value={state.indicator}
              onChange={(e) => setState(prev => ({...prev, indicator: e.target.value as IndicatorType}))}
              className="w-full p-2 border rounded bg-white text-slate-700 font-semibold"
            >
              <option value="phenolphthalein">酚酞 (Phenolphthalein)</option>
              <option value="methylRed">甲基紅 (Methyl Red)</option>
              <option value="bromothymolBlue">溴瑞香草芬藍 (BTB)</option>
            </select>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Row 2: Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Backwards Controls */}
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-slate-500 mb-1">倒回 (Reverse):</label>
                <div className="flex gap-2">
                  <button onClick={() => addVolume(-5)} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-sm transition shadow-sm">-5</button>
                  <button onClick={() => addVolume(-1)} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-sm transition shadow-sm">-1</button>
                  <button onClick={() => addVolume(-0.1)} className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-sm transition shadow-sm">-0.1</button>
                </div>
              </div>
              
              {/* Forwards Controls */}
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-blue-700 mb-1">滴加鹼液 (Add Base):</label>
                <div className="flex gap-2">
                  <button onClick={() => addVolume(0.1)} className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-semibold text-sm transition shadow-sm">+0.1</button>
                  <button onClick={() => addVolume(1)} className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-semibold text-sm transition shadow-sm">+1</button>
                  <button onClick={() => addVolume(5)} className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-semibold text-sm transition shadow-sm">+5</button>
                </div>
              </div>
           </div>
           
           <button onClick={reset} className="w-full md:w-auto px-6 py-2 h-full bg-red-100 hover:bg-red-200 text-red-700 rounded font-semibold text-sm mt-4 md:mt-0 transition self-end">
              重置 (Reset)
           </button>
        </div>
      </div>

      {/* Main Visualization Row */}
      <div className="flex flex-col md:flex-row w-full gap-8 items-start justify-center">
        
        {/* LEFT: Lab Setup SVG */}
        <div className="w-full md:w-1/2 aspect-[3/4] border border-slate-200 rounded-lg bg-white relative shadow-inner">
          <svg viewBox="0 0 300 400" className="w-full h-full">
            <defs>
              <linearGradient id="gradGlass" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
                <stop offset="50%" stopColor="white" stopOpacity="0"/>
                <stop offset="100%" stopColor="white" stopOpacity="0.4"/>
              </linearGradient>
            </defs>

            {/* Stand */}
            <rect x="140" y="20" width="10" height="380" fill="#475569" />
            <rect x="80" y="380" width="130" height="15" fill="#334155" />
            <rect x="110" y="100" width="40" height="5" fill="#334155" /> {/* Clamp */}

            {/* Burette (Top) */}
            <g transform="translate(100, 40)">
               {/* Tube */}
               <rect x="0" y="0" width="20" height="200" fill="none" stroke="#94a3b8" strokeWidth="2" />
               {/* Liquid in Burette */}
               <rect 
                 x="2" 
                 y={state.addedBaseVol * 4} 
                 width="16" 
                 height={200 - state.addedBaseVol * 4} 
                 fill="#f1f5f9" opacity="0.8" 
               />
               {/* Graduations */}
               {Array.from({length: 11}).map((_, i) => (
                 <line key={i} x1="12" y1={i * 20} x2="20" y2={i * 20} stroke="#cbd5e1" strokeWidth="1" />
               ))}
               {/* Stopcock */}
               <path d="M 10,200 L 10,220" stroke="#94a3b8" strokeWidth="2" />
               <circle cx="10" cy="210" r="4" fill="#64748b" />
               {/* Drop Animation */}
               <circle cx="10" cy="225" r="3" fill="#f1f5f9" stroke="#cbd5e1">
                 <animate attributeName="cy" from="220" to="260" dur="1s" repeatCount="indefinite" />
                 <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
               </circle>
            </g>

            {/* Flask (Bottom) */}
            <g transform="translate(60, 260)">
              {/* Flask Shape */}
              <path 
                d="M 40,0 L 60,0 L 60,40 L 90,100 L 10,100 L 40,40 Z" 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="2" 
              />
              {/* Liquid in Flask */}
              <path 
                d={`M 15,90 L 85,90 L 90,100 L 10,100 Z`}
                fill={currentColor}
                stroke="none"
                opacity="0.8"
              />
              <path d="M 40,0 L 60,0 L 60,40 L 90,100 L 10,100 L 40,40 Z" fill="url(#gradGlass)" pointerEvents="none" />
              
              {/* Label */}
              <text x="50" y="125" textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">
                0.1M {state.acidType === 'strong' ? 'HCl' : 'CH₃COOH'}
              </text>
            </g>
          </svg>
        </div>

        {/* RIGHT: Graph & Math */}
        <div className="w-full md:w-1/2 flex flex-col items-center gap-4">
           
           {/* Graph */}
           <div className="relative w-full aspect-[4/3] border border-slate-300 bg-white rounded shadow-sm">
             <svg viewBox="0 0 300 200" className="w-full h-full">
                
                {/* Indicator Range Band (Background) */}
                <rect 
                  x="40" 
                  y={indRangeYStart} 
                  width="240" 
                  height={indRangeHeight} 
                  fill={selectedInd.colorHigh} 
                  fillOpacity="0.15"
                />
                <line x1="40" y1={indRangeYStart} x2="280" y2={indRangeYStart} stroke={selectedInd.colorHigh} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                <line x1="40" y1={indRangeYStart + indRangeHeight} x2="280" y2={indRangeYStart + indRangeHeight} stroke={selectedInd.colorLow} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
                
                {/* Grid Lines */}
                {[0, 2, 4, 6, 8, 10, 12, 14].map(ph => (
                  <line key={ph} x1="40" y1={mapY(ph)} x2="280" y2={mapY(ph)} stroke="#e2e8f0" strokeWidth="1" />
                ))}
                {[0, 10, 20, 30, 40, 50].map(v => (
                  <line key={v} x1={mapX(v)} y1="20" x2={mapX(v)} y2="180" stroke="#e2e8f0" strokeWidth="1" />
                ))}

                {/* Axes */}
                <line x1="40" y1="20" x2="40" y2="180" stroke="#64748b" strokeWidth="2" /> {/* Y */}
                <line x1="40" y1="180" x2="280" y2="180" stroke="#64748b" strokeWidth="2" /> {/* X */}

                {/* Axis Labels */}
                <text x="160" y="195" textAnchor="middle" fontSize="10" fill="#64748b">加入體積 (mL)</text>
                <text x="25" y="100" textAnchor="middle" fontSize="10" fill="#64748b" transform="rotate(-90, 25, 100)">pH Value</text>

                {/* Theoretical Curve */}
                <polyline 
                  points={polylinePoints} 
                  fill="none" 
                  stroke="#475569" 
                  strokeWidth="2" 
                />

                {/* Current Point Marker */}
                <circle 
                  cx={mapX(state.addedBaseVol)} 
                  cy={mapY(currentPH)} 
                  r="5" 
                  fill="#ef4444" 
                  stroke="white" 
                  strokeWidth="2" 
                />
                
                {/* Eq. Pt Logic Display */}
                {!(state.acidType === 'weak' && state.baseType === 'weak') && (
                  <>
                    <circle cx={mapX(25)} cy={mapY(state.acidType === 'weak' ? 8.72 : (state.baseType === 'weak' ? 5.28 : 7.0))} r="3" fill="#333" />
                    <text x={mapX(25)+5} y={mapY(state.acidType === 'weak' ? 8.72 : (state.baseType === 'weak' ? 5.28 : 7.0))} fontSize="8" fill="#333">當量點</text>
                  </>
                )}

                {/* Tick Labels */}
                <text x="35" y={mapY(7)} textAnchor="end" fontSize="9" alignmentBaseline="middle">7</text>
                <text x="35" y={mapY(14)} textAnchor="end" fontSize="9" alignmentBaseline="middle">14</text>
                
                <text x={mapX(25)} y="188" textAnchor="middle" fontSize="9">25</text>
                <text x={mapX(50)} y="188" textAnchor="middle" fontSize="9">50</text>
             </svg>
             
             {/* Indicator Legend on Graph */}
             <div className="absolute top-2 right-2 bg-white/90 p-1.5 border border-slate-200 rounded text-[9px] shadow-sm">
                <div className="font-bold text-slate-700 mb-1">變色範圍 (Range):</div>
                <div className="flex items-center gap-1">
                   <div className="w-3 h-3 rounded bg-current opacity-30" style={{color: selectedInd.colorHigh}}></div>
                   <span>{selectedInd.name} ({selectedInd.label})</span>
                </div>
             </div>
           </div>

           {/* Stats & Calculation Panel */}
           <div className="w-full flex flex-col gap-3">
             <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <div className="text-[10px] text-blue-600 font-bold uppercase">加入體積</div>
                  <div className="text-lg font-mono text-blue-900">{state.addedBaseVol.toFixed(1)} mL</div>
                </div>
                <div className="bg-purple-50 p-2 rounded border border-purple-100">
                  <div className="text-[10px] text-purple-600 font-bold uppercase">目前 pH 值</div>
                  <div className="text-lg font-mono text-purple-900">{currentPH.toFixed(2)}</div>
                </div>
             </div>

             {/* Calculation Logic Explanation Card */}
             <div className="w-full bg-slate-800 text-slate-100 rounded-lg p-4 shadow-md text-sm border-l-4 border-yellow-400">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="font-bold text-yellow-400">理論計算 (Calculation)</h4>
                   <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">{explanation.title}</span>
                </div>
                <div className="font-mono text-lg mb-2 text-center py-2 bg-slate-900 rounded border border-slate-700">
                  {explanation.formula}
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {explanation.desc}
                </p>
             </div>
           </div>
           
        </div>

      </div>
    </div>
  );
};