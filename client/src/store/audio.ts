import create from 'zustand';

const STORAGE_KEY = 'curacall-audio';

type AudioState = {
  volume: number; // 0..1
  rate: number;   // 0.5..2 (1 = normal)
  micEnabled: boolean;
  setVolume: (v: number) => void;
  setRate: (r: number) => void;
  setMicEnabled: (on: boolean) => void;
  toggleMic: () => void;
};

function load(): Pick<AudioState, 'volume' | 'micEnabled' | 'rate'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const vol = typeof data.volume === 'number' ? Math.max(0, Math.min(1, data.volume)) : 0.8;
      const rate = typeof data.rate === 'number' ? Math.max(0.5, Math.min(2, data.rate)) : 1.0;
      const mic = typeof data.micEnabled === 'boolean' ? data.micEnabled : true;
      return { volume: vol, micEnabled: mic, rate };
    }
  } catch {}
  return { volume: 0.8, micEnabled: true, rate: 1.0 };
}

function save(state: Pick<AudioState, 'volume' | 'micEnabled' | 'rate'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const useAudio = create<AudioState>((set, get) => ({
  volume: typeof window !== 'undefined' ? load().volume : 0.8,
  rate: typeof window !== 'undefined' ? load().rate : 1.0,
  micEnabled: typeof window !== 'undefined' ? load().micEnabled : true,
  setVolume: (v) => {
    const vol = Math.max(0, Math.min(1, v));
    set({ volume: vol });
    save({ volume: vol, micEnabled: get().micEnabled, rate: get().rate });
  },
  setRate: (r) => {
    const rate = Math.max(0.5, Math.min(2, r));
    set({ rate });
    save({ volume: get().volume, micEnabled: get().micEnabled, rate });
  },
  setMicEnabled: (on) => {
    set({ micEnabled: on });
    save({ volume: get().volume, micEnabled: on, rate: get().rate });
  },
  toggleMic: () => {
    const next = !get().micEnabled;
    set({ micEnabled: next });
    save({ volume: get().volume, micEnabled: next, rate: get().rate });
  },
}));
