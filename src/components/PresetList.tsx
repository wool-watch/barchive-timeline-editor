import React from 'react';
import { Copy, Trash2, FileDown, FileUp, Download, Upload } from 'lucide-react';
import useStore from '../store';
import type { Preset } from '../types';

export default function PresetList() {
  const { presets, selectedPresetId, selectPreset, deletePreset, duplicatePreset } = useStore();

  const handleBulkExport = () => {
    const blob = new Blob([JSON.stringify(presets)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedPresets: Preset[] = JSON.parse(text);
      
      // 各プリセットに新しいIDを割り当てる
      const presetsWithNewIds = importedPresets.map(preset => ({
        ...preset,
        id: crypto.randomUUID(),
      }));

      useStore.getState().importPresets(presetsWithNewIds);
    } catch (error) {
      console.error('プリセットの一括インポートに失敗しました:', error);
    }
  };

  const handleExport = (preset: Preset) => {
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
    if (!file) return;

    try {
      const text = await file.text();
      const preset: Preset = JSON.parse(text);
      useStore.getState().addPreset({
        ...preset,
        id: crypto.randomUUID(),
      });
    } catch (error) {
      console.error('プリセットのインポートに失敗しました:', error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex mb-4">
        <label className="relative group cursor-pointer p-1 border border-gray-300 rounded hover:border-blue-500">
          <input
            type="file"
            className="hidden"
            accept=".json"
            onChange={handleBulkImport}
          />
          <Upload className="w-6 h-6 text-gray-600 hover:text-blue-600" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            一括インポート
          </span>
        </label>
        <button
          onClick={handleBulkExport}
          className="relative group ml-2 p-1 border border-gray-300 rounded hover:border-blue-500 text-gray-600"
        >
          <Download className="w-6 h-6" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            一括エクスポート
          </span>
        </button>
      </div>

      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className={`p-3 rounded-lg border ${
              selectedPresetId === preset.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => selectPreset(preset.id)}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{preset.name}</span>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePreset(preset.id);
                  }}
                  className="relative group p-1 hover:text-blue-600"
                >
                  <Copy className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    プリセットを複製
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset(preset.id);
                  }}
                  className="relative group p-1 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    プリセットを削除
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          useStore.getState().addPreset({
            id: crypto.randomUUID(),
            name: '新規プリセット',
            strikers: [],
            specials: [],
            timeline: [],
          });
        }}
        className="relative group mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        新規プリセット作成
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          新しいプリセットを作成
        </span>
      </button>
    </div>
  );
}