import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PresetStore, Preset } from './types';

const useStore = create<PresetStore>()(
  persist(
    (set, get) => ({
      presets: [],
      selectedPresetId: null,

      addPreset: (preset) => {
        set((state) => ({
          presets: [...state.presets, {
            ...preset,
            strikers: preset.strikers.map(striker => ({
              ...striker,
              isInitialSkill: striker.isInitialSkill || false
            })),
            specials: preset.specials.map(special => ({
              ...special,
              isInitialSkill: special.isInitialSkill || false
            })),
            id: crypto.randomUUID(),
          }],
          selectedPresetId: preset.id,
        }));
      },

      updatePreset: (preset) => {
        set((state) => ({
          presets: state.presets.map((p) => (p.id === preset.id ? preset : p)),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          selectedPresetId: state.selectedPresetId === id ? null : state.selectedPresetId,
        }));
      },

      selectPreset: (id) => {
        set({ selectedPresetId: id });
      },

      duplicatePreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (!preset) return;

        const newPreset: Preset = {
          ...preset,
          id: crypto.randomUUID(),
          name: `${preset.name} (コピー)`,
        };

        set((state) => ({
          presets: [...state.presets, newPreset],
          selectedPresetId: newPreset.id,
        }));
      },

      importPresets: (presets) => {
        set({ presets });
      },

      exportPresets: () => {
        return get().presets;
      },
    }),
    {
      name: 'blue-archive-timeline',
    }
  )
);

export default useStore;