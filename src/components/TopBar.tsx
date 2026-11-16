import { Film, Code2, Sparkles, Video } from 'lucide-react';

export type AppTab = 'estudio' | 'biblioteca' | 'flutter';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  savedCount: number;
  onFocusCreate: () => void;
}

export function TopBar({
  activeTab,
  onSelectTab,
  savedCount,
  onFocusCreate,
}: TopBarProps) {
  return (
    <>
      <header className="sticky top-0 z-30 h-13 md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-8 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('estudio');
            }}
            className="font-display text-lg md:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600 rounded"
          >
            ClipFácil
          </a>

          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-7">
            <button
              type="button"
              onClick={() => onSelectTab('estudio')}
              className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'estudio'
                  ? 'border-rose-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Estudio
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('biblioteca')}
              className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 tabular-nums ${
                activeTab === 'biblioteca'
                  ? 'border-rose-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Mis Videos ({savedCount})
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('flutter')}
              className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'flutter'
                  ? 'border-rose-600 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Flutter Android
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onFocusCreate}
              className="min-h-[40px] px-4 py-2 text-xs md:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              Crear Video
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3 items-center px-2"
      >
        <button
          type="button"
          onClick={() => onSelectTab('estudio')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
            activeTab === 'estudio' ? 'text-rose-600' : 'text-slate-600'
          }`}
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <span>Estudio</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('biblioteca')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap tabular-nums ${
            activeTab === 'biblioteca' ? 'text-rose-600' : 'text-slate-600'
          }`}
        >
          <Video className="w-5 h-5" aria-hidden="true" />
          <span>Mis Videos ({savedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('flutter')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium whitespace-nowrap ${
            activeTab === 'flutter' ? 'text-rose-600' : 'text-slate-600'
          }`}
        >
          <Code2 className="w-5 h-5" aria-hidden="true" />
          <span>Flutter</span>
        </button>
      </nav>
    </>
  );
}
