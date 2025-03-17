import React from 'react';
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Character, Preset } from '../types';
import { GripVertical, Zap } from 'lucide-react';

interface CharacterSlotProps {
  type: 'strikers' | 'specials';
  index: number;
  character?: Character;
  id: string;
  preset: Preset;
  onUpdate: (type: 'strikers' | 'specials', index: number, updates: Partial<Character>) => void;
  isDragging?: boolean;
}

function CharacterSlot({ type, index, character, id, preset, onUpdate, isDragging }: CharacterSlotProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const initialSkillCount = [...(preset?.strikers || []), ...(preset?.specials || [])]
    .filter(char => char?.isInitialSkill)
    .length;

  const canToggleInitialSkill = character?.isInitialSkill || initialSkillCount < 3;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      className="flex gap-2 p-3 bg-gray-50 rounded-lg"
    >
      <button
        {...listeners}
        className="relative group flex items-center px-1 -ml-1 cursor-move hover:text-blue-600"
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-4 h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          ドラッグアンドドロップで並び替え
        </span>
      </button>
      <input
        type="text"
        value={character?.name || ''}
        onChange={(e) => onUpdate(type, index, { name: e.target.value })}
        placeholder="生徒名"
        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <input
        type="number"
        value={character?.exCost || 5}
        onChange={(e) =>
          onUpdate(type, index, {
            exCost: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)),
          })
        }
        min="0"
        max="10"
        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
      <button
        onClick={() => onUpdate(type, index, { isInitialSkill: !character?.isInitialSkill })}
        disabled={!character?.name || (!character?.isInitialSkill && !canToggleInitialSkill)}
        className={`relative group p-2 rounded-md ${
          character?.isInitialSkill
            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
            : character?.name && canToggleInitialSkill
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
        }`}
        onClick={(e) => {
          if (!character?.name || (!character?.isInitialSkill && !canToggleInitialSkill)) {
            e.preventDefault();
            return;
          }
          onUpdate(type, index, { isInitialSkill: !character?.isInitialSkill });
        }}
      >
        <Zap className="w-4 h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {character?.isInitialSkill ? '開始スキルを無効化' : '開始スキルを有効化'}
          {!character?.name ? '（生徒名を入力してください）' : !canToggleInitialSkill ? '（最大3つまで）' : ''}
        </span>
      </button>
    </div>
  );
}

interface FormationEditorProps {
  preset: Preset;
  updatePreset: (preset: Preset) => void;
}

export default function FormationEditor({ preset, updatePreset }: FormationEditorProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeCharacter, setActiveCharacter] = React.useState<Character | null>(null);

  const updateCharacter = (type: 'strikers' | 'specials', index: number, updates: Partial<Character>) => {
    const characters = [...preset[type]];
    
    if (!characters[index]) {
      characters[index] = {
        id: crypto.randomUUID(),
        name: '',
        exCost: 5,
        ...updates,
      };
    } else {
      characters[index] = {
        ...characters[index],
        ...updates,
      };
    }

    // 名前が空になったキャラクターのイベントのみを削除
    const updatedTimeline = preset.timeline.filter((event) => {
      if (event.characterId === characters[index]?.id) {
        return characters[index]?.name !== '';
      }
      return true;
    });

    const updatedPreset = {
      ...preset,
      [type]: characters,
      timeline: updatedTimeline,
    };
    updatePreset(updatedPreset);
  };

  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the character being dragged
    const character = [...preset.strikers, ...preset.specials].find(
      (char) => char?.id === active.id || 
      `strikers-${preset.strikers.indexOf(char)}` === active.id ||
      `specials-${preset.specials.indexOf(char)}` === active.id
    );
    setActiveCharacter(character || null);
  };

  const handleDragEnd = (event: DragEndEvent, type: 'strikers' | 'specials') => {
    const { active, over } = event;
    setActiveId(null);
    setActiveCharacter(null);

    if (!over || active.id === over.id) return;

    const oldIndex = preset[type].findIndex(
      (char) => char?.id === active.id || `${type}-${preset[type].indexOf(char)}` === active.id
    );
    const newIndex = preset[type].findIndex(
      (char) => char?.id === over.id || `${type}-${preset[type].indexOf(char)}` === over.id
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const newCharacters = [...preset[type]];
    const [movedItem] = newCharacters.splice(oldIndex, 1);
    newCharacters.splice(newIndex, 0, movedItem);

    const updatedPreset = {
      ...preset,
      [type]: newCharacters,
    };

    updatePreset(updatedPreset);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <h4 className="font-medium mb-3">Striker</h4>
          <DndContext
            onDragStart={handleDragStart}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'strikers')}
          >
            <SortableContext
              items={preset.strikers.map((char, i) => char?.id || `strikers-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {Array.from({ length: 4 }).map((_, index) => {
                const labels = ['L', 'ML', 'MR', 'R'];
                const tooltips = ['L：編成画面 左', 'ML：編成画面 中央左', 'MR：編成画面 中央右', 'R：編成画面 右'];
                return (
                <div key={`striker-${index}`} className="flex gap-2 items-center">
                  <div className="relative group w-8 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-red-100 text-red-800 font-medium">
                    {labels[index]}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {tooltips[index]}
                    </span>
                  </div>
                  <CharacterSlot
                    type="strikers"
                    index={index}
                    character={preset.strikers[index]}
                    id={preset.strikers[index]?.id || `strikers-${index}`}
                    onUpdate={updateCharacter}
                    preset={preset}
                    isDragging={activeId === (preset.strikers[index]?.id || `strikers-${index}`)}
                  />
                </div>
                );
              })}
            </SortableContext>
            <DragOverlay>
              {activeCharacter && (
                <div className="flex gap-2 p-3 bg-white rounded-lg shadow-lg">
                  <div className="flex items-center px-1 -ml-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1">{activeCharacter.name}</div>
                  <div className="w-20">{activeCharacter.exCost}</div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium mb-3">Special</h4>
          <DndContext
            onDragStart={handleDragStart}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(event, 'specials')}
          >
            <SortableContext
              items={preset.specials.map((char, i) => char?.id || `specials-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={`special-${index}`} className="flex gap-2 items-center">
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-medium">
                    &nbsp;
                  </div>
                  <CharacterSlot
                    type="specials"
                    index={index}
                    character={preset.specials[index]}
                    id={preset.specials[index]?.id || `specials-${index}`}
                    onUpdate={updateCharacter}
                    preset={preset}
                    isDragging={activeId === (preset.specials[index]?.id || `specials-${index}`)}
                  />
                </div>
              ))}
            </SortableContext>
            <DragOverlay>
              {activeCharacter && (
                <div className="flex gap-2 p-3 bg-white rounded-lg shadow-lg">
                  <div className="flex items-center px-1 -ml-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1">{activeCharacter.name}</div>
                  <div className="w-20">{activeCharacter.exCost}</div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
  );
}