import React from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import PresetList from './components/PresetList';
import PresetEditor from './components/PresetEditor';
import Timeline from './components/Timeline';

function App() {
  const [settingsOpen, setSettingsOpen] = React.useState(true);
  const [timelineOpen, setTimelineOpen] = React.useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            タイムラインEditor（α）
          </h1>
        </header>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <h2 className="text-xl font-bold text-gray-800 mb-4">プリセット一覧</h2>
            <PresetList />
          </div>
          <div className="col-span-9 space-y-8">
            <Collapsible.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
              <Collapsible.Trigger asChild>
                <button className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:text-gray-600">
                  {settingsOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  設定
                </button>
              </Collapsible.Trigger>
              <Collapsible.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp mt-4">
                <PresetEditor />
              </Collapsible.Content>
            </Collapsible.Root>

            <Collapsible.Root open={timelineOpen} onOpenChange={setTimelineOpen}>
              <Collapsible.Trigger asChild>
                <button className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:text-gray-600">
                  {timelineOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  タイムライン設定
                </button>
              </Collapsible.Trigger>
              <Collapsible.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp mt-4">
                <Timeline />
              </Collapsible.Content>
            </Collapsible.Root>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;