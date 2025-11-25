import React from 'react';
import { GalvanicCell } from './components/GalvanicCell';
import { ElectroplatingCell } from './components/ElectroplatingCell';
import { DisplacementReaction } from './components/DisplacementReaction';
import { SilverMirrorReaction } from './components/SilverMirrorReaction';
import { TitrationExperiment } from './components/TitrationExperiment';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
          電化學互動模擬 (Electrochemical Simulations)
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Interactive visualization of Galvanic Cells, Displacement Reactions, Electroplating, Silver Mirror Reaction and Titration.
        </p>
      </header>

      <main className="space-y-16 pb-20">
        {/* 1. 丹尼爾電池 */}
        <section>
          <GalvanicCell />
        </section>
        
        <hr className="border-t-2 border-slate-200 max-w-5xl mx-auto" />

        {/* 2. 取代反應 */}
        <section>
          <DisplacementReaction />
        </section>

        <hr className="border-t-2 border-slate-200 max-w-5xl mx-auto" />

        {/* 3. 電解電鍍 */}
        <section>
          <ElectroplatingCell />
        </section>

        <hr className="border-t-2 border-slate-200 max-w-5xl mx-auto" />

        {/* 4. 銀鏡反應 */}
        <section>
          <SilverMirrorReaction />
        </section>

        <hr className="border-t-2 border-slate-200 max-w-5xl mx-auto" />

        {/* 5. 酸鹼滴定 */}
        <section>
          <TitrationExperiment />
        </section>
      </main>

      <footer className="mt-12 text-center text-slate-400 text-sm pb-8">
        © {new Date().getFullYear()} Chemistry Viz | Designed for Education
      </footer>
    </div>
  );
}

export default App;