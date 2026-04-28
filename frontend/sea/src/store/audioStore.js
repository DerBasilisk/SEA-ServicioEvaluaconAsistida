import { create } from "zustand";
import { persist } from "zustand/middleware";

export const TRACKS = [
  { id: 1, title: "Bibrant Hall",     src: "/audio/bibrant_hall.mp3" },
  { id: 2, title: "Glitter Hall",     src: "/audio/glitter_hall.mp3" },
  { id: 3, title: "Looped Learning",  src: "/audio/looped_learning.mp3" },
  { id: 4, title: "Looping Park",     src: "/audio/looping_park.mp3" },
  { id: 5, title: "Rainy Loop",       src: "/audio/rainy_loop.mp3" },
  { id: 6, title: "Rainy Process",    src: "/audio/rainy_process.mp3" },
];

const useAudioStore = create(
  persist(
    (set, get) => ({
      // ── Solo esto se persiste ──
      musicEnabled: true,
      sfxEnabled: true,
      volume: 0.6,
      trackIndex: 0,
      shuffle: false,

      // ── tracks viene siempre del código, nunca de localStorage ──
      get tracks() { return TRACKS; },

      nextTrack: () => {
        const { trackIndex, shuffle } = get();
        const total = TRACKS.length;
        const next = shuffle
          ? Math.floor(Math.random() * total)
          : (trackIndex + 1) % total;
        set({ trackIndex: next });
      },
      prevTrack: () => {
        const { trackIndex } = get();
        set({ trackIndex: (trackIndex - 1 + TRACKS.length + TRACKS.length) % TRACKS.length });
      },
      setTrackIndex: (i) => set({ trackIndex: i }),
      setVolume:     (v) => set({ volume: v }),
      toggleMusic:   ()  => set((s) => ({ musicEnabled: !s.musicEnabled })),
      toggleSfx:     ()  => set((s) => ({ sfxEnabled:   !s.sfxEnabled })),
      toggleShuffle: ()  => set((s) => ({ shuffle:      !s.shuffle })),
    }),
    {
      name: "sea-audio",
      // ← Solo persiste estas keys, nunca "tracks"
      partialize: (state) => ({
        musicEnabled: state.musicEnabled,
        sfxEnabled:   state.sfxEnabled,
        volume:       state.volume,
        trackIndex:   state.trackIndex,
        shuffle:      state.shuffle,
      }),
    }
  )
);

export default useAudioStore;