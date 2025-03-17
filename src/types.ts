export interface Character {
  id: string;
  name: string;
  exCost: number;
  isInitialSkill: boolean;
}

export interface TimelineEvent {
  id: string;
  characterId: string;
  time: number; // seconds from start
}

export interface Preset {
  id: string;
  name: string;
  strikers: Character[];
  specials: Character[];
  timeline: TimelineEvent[];
}

export interface PresetStore {
  presets: Preset[];
  selectedPresetId: string | null;
  addPreset: (preset: Preset) => void;
  updatePreset: (preset: Preset) => void;
  deletePreset: (id: string) => void;
  selectPreset: (id: string | null) => void;
  duplicatePreset: (id: string) => void;
  importPresets: (presets: Preset[]) => void;
  exportPresets: () => Preset[];
}