export interface ParticleProps {
  id: number;
  progress: number; // 0 to 1
  type: 'electron' | 'znIon' | 'cuIon' | 'anion' | 'cation';
}

export interface Position {
  x: number;
  y: number;
}