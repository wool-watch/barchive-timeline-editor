import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  DragMoveEvent,
  DragOverEvent,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import useStore from '../store';
import type { Character, TimelineEvent } from '../types';

interface CharacterItemProps {
  character: Character | undefined;
  isEmpty?: boolean;
  id: string;
  preset?: Preset;
}

const CharacterItem = React.memo(function CharacterItem2({ character, isEmpty, id, preset }: CharacterItemProps) {
  if (isEmpty) {
    return (
      <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm opacity-50">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div>
          <div className="font-medium text-gray-400">未設定</div>
          <div className="text-sm text-gray-400">コスト: -</div>
        </div>
      </div>
    );
  }

  if (!character?.name) return null;

  const isStriker = preset?.strikers.some(s => s?.id === character.id);
  const borderColorClass = isStriker ? 'border-red-300' : 'border-blue-300';
  const hoverColorClass = isStriker ? 'hover:border-red-500' : 'hover:border-blue-500';

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    data: { type: 'character', character },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-white border-2 ${borderColorClass} rounded-lg shadow-sm cursor-move ${hoverColorClass}`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4 text-gray-400" />
      <div>
        <div className="font-medium">{character.name}</div>
        <div className="text-sm text-gray-500">コスト: {character.exCost}</div>
      </div>
    </div>
  );
});

// 並べ替え可能なタイムラインアイテム
interface SortableTimelineItemProps {
  event: TimelineEvent;
  character: Character;
  index: number;
  onRemove: () => void;
}

function SortableTimelineItem({ event, character, index, onRemove }: SortableTimelineItemProps) {
  const { presets, selectedPresetId, updatePreset } = useStore();
  const preset = presets.find((p) => p.id === selectedPresetId);
  const isStriker = preset?.strikers.some(s => s?.id === character.id);
  const borderColorClass = isStriker ? 'border-red-300' : 'border-blue-300';
  const hoverColorClass = isStriker ? 'hover:border-red-500' : 'hover:border-blue-500';

  const handleTimeChange = (value: number) => {
    if (!preset) return;
    
    const updatedTimeline = preset.timeline.map(e => 
      e.id === event.id ? { ...e, time: value } : e
    );

    updatePreset({
      ...preset,
      timeline: updatedTimeline,
    });
  };

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: event.id,
    data: { type: 'timeline', index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-white border-2 ${borderColorClass} rounded-lg shadow-sm ${hoverColorClass}`}
    >
      <button
        className="relative group flex items-center px-1 -ml-1 cursor-move hover:text-blue-600"
        {...attributes}
        {...listeners}
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-4 h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          ドラッグアンドドロップで並び替え
        </span>
      </button>
      <input
        type="number"
        value={event.time}
        onChange={(e) => handleTimeChange(parseFloat(e.target.value) || 0)}
        min="0"
        max="10"
        step="0.1"
        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
      />
      <div className="flex-1">
        <div className="font-medium">{character.name}</div>
        <div className="text-sm text-gray-500">コスト: {character.exCost}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="relative group p-2 text-red-600 hover:text-red-800"
      >
        <X className="w-4 h-4" />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          タイムラインから削除
        </span>
      </button>
    </div>
  );
}

// タイムラインコンポーネント
export default function Timeline() {
  const { presets, selectedPresetId, updatePreset } = useStore();
  const [draggedCharacter, setDraggedCharacter] = useState<Character | null>(null);
  const [isDraggingFarEnough, setIsDraggingFarEnough] = useState(false);
  const [ghostIndex, setGhostIndex] = useState<number | null>(null);
  const preset = presets.find((p) => p.id === selectedPresetId);

  if (!preset) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500">プリセットを選択してください</p>
      </div>
    );
  }

  const { strikers, specials, timeline } = preset;
  const allCharacters = [...(strikers || []), ...(specials || [])].filter(char => char && char.id);

  // ドラッグ開始時の処理
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const character = active.data.current?.character as Character;
    if (character) {
      setDraggedCharacter(character);
    }
  };

  // ドラッグ移動時の処理
  const handleDragMove = (event: DragMoveEvent) => {
    const { delta } = event;
    // ドラッグ距離が20px以上になったら配置を許可
    const distance = Math.sqrt(Math.pow(delta.x, 2) + Math.pow(delta.y, 2));
    setIsDraggingFarEnough(distance > 20);
  };

  // ドラッグオーバー時の処理
  const handleDragOver = (event: DragOverEvent) => {
    if (!isDraggingFarEnough) {
      setGhostIndex(null);
      return;
    }

    const { over, active, delta } = event;
    
    if (!over) {
      setGhostIndex(null);
      return;
    }

    // タイムラインアイテムの上にドラッグした場合
    if (over.data.current?.type === 'timeline') {
      const overIndex = timeline.findIndex((event) => event.id === over.id);
      if (overIndex === -1) return;

      // マウスの位置に基づいてアイテムの上下どちらに配置するかを決定
      const threshold = over.rect.height * 0.5;
      const relativeY = delta.y + threshold;
      
      setGhostIndex(relativeY > threshold ? overIndex + 1 : overIndex);
      return;
    }

    // タイムラインのドロップ領域にドラッグした場合
    if (over.id === 'timeline-drop-area') {
      setGhostIndex(timeline.length);
    }
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedCharacter(null);
    setGhostIndex(null);
    setIsDraggingFarEnough(false);

    if (!over || !active.data.current || !isDraggingFarEnough) return;

    const activeData = active.data.current;
    const overData = over?.data.current;

    // ドロップ位置の決定
    let insertIndex = ghostIndex;
    if (insertIndex === null) {
      insertIndex = timeline.length;
    }

    // タイムライン内での並べ替え
    if (activeData?.type === 'timeline') {
      if (insertIndex !== -1) {
        const oldIndex = timeline.findIndex((event) => event.id === active.id);
        if (oldIndex !== -1) {
          const newTimeline = [...timeline];
          const [movedItem] = newTimeline.splice(oldIndex, 1);
          // 移動元より後ろに移動する場合は、移動元の分を考慮してインデックスを調整
          const adjustedIndex = oldIndex < insertIndex ? insertIndex - 1 : insertIndex;
          newTimeline.splice(adjustedIndex, 0, movedItem);
          updatePreset({ ...preset, timeline: newTimeline });
        }
      }
    } else {
      // 新規アイテムの追加
      const character = activeData?.character as Character;
      if (character) {
        const newTimeline = [...timeline];
        newTimeline.splice(insertIndex, 0, {
          id: crypto.randomUUID(),
          characterId: character.id,
          time: character.exCost,
        });

        updatePreset({ ...preset, timeline: newTimeline });
      }
    }
  };

  // タイムラインからの削除
  const removeTimelineEvent = (eventId: string) => {
    const updatedPreset = {
      ...preset,
      timeline: timeline.filter((t) => t.id !== eventId),
    };
    updatePreset(updatedPreset);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        <div className="grid grid-cols-12 gap-6">
          {/* キャラクター一覧 */}
          <div className="col-span-4">
            <h3 className="text-lg font-medium">編成生徒</h3>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Striker</h4>
                <SortableContext items={strikers?.filter(char => char?.id).map(char => char.id) || []} strategy={verticalListSortingStrategy}>
                  {Array.from({ length: 4 }).map((_, index) => {
                    const character = strikers[index];
                    return (
                      <CharacterItem
                        key={character?.id || `striker-${index}`}
                        character={character}
                        id={character?.id || `striker-${index}`}
                        isEmpty={!character?.name}
                        preset={preset}
                      />
                    );
                  })}
                </SortableContext>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Special</h4>
                <SortableContext items={specials?.filter(char => char?.id).map(char => char.id) || []} strategy={verticalListSortingStrategy}>
                  {Array.from({ length: 2 }).map((_, index) => {
                    const character = specials[index];
                    return (
                      <CharacterItem
                        key={character?.id || `special-${index}`}
                        character={character}
                        id={character?.id || `special-${index}`}
                        isEmpty={!character?.name}
                        preset={preset}
                      />
                    );
                  })}
                </SortableContext>
              </div>
            </div>
          </div>
          {/* タイムライン */}
          <div className="col-span-8">
            <h3 className="text-lg font-medium mb-4">タイムライン</h3>
            <div
              className="space-y-2 min-h-[200px] p-4 border-2 border-dashed border-gray-300 rounded-lg"
              id="timeline-drop-area"
              data-type="timeline-drop-area"
              style={{
                backgroundColor: draggedCharacter ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                position: 'relative',
              }}
            >
              <SortableContext
                items={[...timeline.map(event => event.id), 'timeline-drop-area']}
                strategy={verticalListSortingStrategy}
              >
                {timeline.map((event, index) => {
                  // ゴーストの表示
                  if (ghostIndex === index && draggedCharacter && isDraggingFarEnough) {
                    return (
                      <React.Fragment key={`ghost-${index}`}>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg">
                          <div className="px-1 -ml-1">
                            <GripVertical className="w-4 h-4 text-blue-400" />
                          </div>
                          <input
                            type="number"
                            value={draggedCharacter.exCost}
                            disabled
                            className="w-20 rounded-md border-blue-300 bg-blue-100 text-blue-800 text-center"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-blue-600">{draggedCharacter.name}</div>
                            <div className="text-sm text-blue-500">コスト: {draggedCharacter.exCost}</div>
                          </div>
                        </div>
                        {timeline[index] && (
                          <SortableTimelineItem
                            key={event.id}
                            event={event}
                            character={allCharacters.find((c) => c.id === event.characterId)!}
                            index={index}
                            onRemove={() => removeTimelineEvent(event.id)}
                          />
                        )}
                      </React.Fragment>
                    );
                  }

                  const character = allCharacters.find((c) => c.id === event.characterId);
                  if (!character?.name) {
                    // タイムラインから無効なイベントを削除
                    removeTimelineEvent(event.id);
                    return null;
                  }

                  return (
                    <SortableTimelineItem
                      key={event.id}
                      event={event}
                      character={character}
                      index={index}
                      onRemove={() => removeTimelineEvent(event.id)}
                    />
                  );
                })}
                
                {/* 最後尾のゴースト表示 */}
                {ghostIndex === timeline.length && draggedCharacter && isDraggingFarEnough && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg">
                    <div className="px-1 -ml-1">
                      <GripVertical className="w-4 h-4 text-blue-400" />
                    </div>
                    <input
                      type="number"
                      value={draggedCharacter.exCost}
                      disabled
                      className="w-20 rounded-md border-blue-300 bg-blue-100 text-blue-800 text-center"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-blue-600">{draggedCharacter.name}</div>
                      <div className="text-sm text-blue-500">コスト: {draggedCharacter.exCost}</div>
                    </div>
                  </div>
                )}
              </SortableContext>

              {timeline.length === 0 && draggedCharacter === null && (
                <div className="h-16 flex items-center justify-center text-gray-500">
                  生徒をドラッグしてタイムラインに追加
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ドラッグオーバーレイ */}
        <DragOverlay>
          {draggedCharacter && (
            <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium">{draggedCharacter.name}</div>
                <div className="text-sm text-gray-500">コスト: {draggedCharacter.exCost}</div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}