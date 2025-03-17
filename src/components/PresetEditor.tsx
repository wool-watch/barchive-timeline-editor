import React from 'react';
import { FileDown, FileUp, ChevronDown, ChevronRight } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
import useStore from '../store';
import FormationEditor from './FormationEditor';
import type { Preset } from '../types';

export default function PresetEditor() {
  const [presetSettingsOpen, setPresetSettingsOpen] = React.useState(true);
  const [formationSettingsOpen, setFormationSettingsOpen] = React.useState(true);
  const { presets, selectedPresetId, updatePreset } = useStore();
  const preset = presets.find((p) => p.id === selectedPresetId);

  const handleExport = () => {
    if (!preset) return;
    const blob = new Blob([JSON.stringify(preset)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !preset) return;

    try {
      const text = await file.text();
      const importedPreset: Preset = JSON.parse(text);
      updatePreset({
        ...importedPreset,
        id: preset.id,
      });
    } catch (error) {
      console.error('プリセットのインポートに失敗しました:', error);
    }
  };

  if (!preset) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500">プリセットを選択してください</p>
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedPreset = {
      ...preset,
      name: e.target.value,
    };
    updatePreset(updatedPreset);
  };

  return (
    <div className="space-y-8">
      <Collapsible.Root open={presetSettingsOpen} onOpenChange={setPresetSettingsOpen}>
        <div className="p-4 bg-white rounded-lg shadow">
          <Collapsible.Trigger asChild>
            <button className="flex items-center gap-2 text-lg font-medium text-gray-800 hover:text-gray-600">
              {presetSettingsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              プリセット設定
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp mt-4">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">名前</label>
              <input
                type="text"
                value={preset.name}
                onChange={handleNameChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <label className="relative group flex-1">
                  <div className="flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                    <FileUp className="w-4 h-4" />
                    <span>インポート</span>
                  </div>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    プリセットをインポート
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={handleImport}
                  />
                </label>
                <button
                  onClick={handleExport}
                  className="relative group flex-1 flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FileDown className="w-4 h-4" />
                  <span>エクスポート</span>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    プリセットをエクスポート
                  </span>
                </button>
              </div>
            </div>
          </Collapsible.Content>
        </div>
      </Collapsible.Root>
      
      <Collapsible.Root open={formationSettingsOpen} onOpenChange={setFormationSettingsOpen}>
        <div className="p-4 bg-white rounded-lg shadow">
          <Collapsible.Trigger asChild>
            <button className="flex items-center gap-2 text-lg font-medium text-gray-800 hover:text-gray-600">
              {formationSettingsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              編成設定
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp mt-4">
            <FormationEditor preset={preset} updatePreset={updatePreset} />
          </Collapsible.Content>
        </div>
      </Collapsible.Root>
    </div>
  );
}