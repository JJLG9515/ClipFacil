import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import type { MusicPreset, ReelProject } from '../types/reel';
import { MUSIC_PRESET_LABELS, formatTimecode } from '../utils/reelLogic';

interface ScriptEditorPanelProps {
  project: ReelProject;
  onUpdateSubtitle: (sceneId: string, newSubtitle: string) => void;
  onChangeMusicPreset: (preset: MusicPreset) => void;
  onJumpToTime: (sec: number) => void;
}

const ROLE_NAME = {
  hook: 'Hook inicial',
  desarrollo: 'Desarrollo',
  cierre: 'Cierre',
} as const;

export function ScriptEditorPanel({
  project,
  onUpdateSubtitle,
  onChangeMusicPreset,
  onJumpToTime,
}: ScriptEditorPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCaption = async () => {
    const caption = `${project.title}\n\n${project.hookText}\n\n${project.hashtags.join(' ')}`;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <section
      aria-labelledby="script-heading"
      className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3
            id="script-heading"
            className="font-display text-base font-semibold text-slate-900"
          >
            Guion y subtítulos automáticos
          </h3>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {project.duration}s · {project.style} · {project.scenes.length} escenas ·{' '}
            {project.source === 'gemini' ? 'Generado con Gemini IA' : 'Generado Offline'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCaption}
          className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <span>Copiar descripción</span>
            </>
          )}
        </button>
      </div>

      <div>
        <label
          htmlFor="music-preset-select"
          className="block text-xs font-semibold text-slate-700 mb-1.5"
        >
          Pista de música libre de derechos
        </label>
        <select
          id="music-preset-select"
          value={project.musicPreset}
          onChange={(e) => onChangeMusicPreset(e.target.value as MusicPreset)}
          className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 focus:border-rose-600 focus:bg-white focus:outline-none"
        >
          {(Object.keys(MUSIC_PRESET_LABELS) as MusicPreset[]).map((preset) => (
            <option key={preset} value={preset}>
              {MUSIC_PRESET_LABELS[preset]}
            </option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-slate-100">
        {project.scenes.map((scene, idx) => (
          <div key={scene.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onJumpToTime(scene.startTime + 0.05)}
                className="text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors tabular-nums text-left"
              >
                0{idx + 1}. {ROLE_NAME[scene.role]} · {formatTimecode(scene.startTime)}–
                {formatTimecode(scene.endTime)}
              </button>
              <span className="text-xs text-slate-400 truncate max-w-[160px]">
                {scene.visualQuery}
              </span>
            </div>
            <label htmlFor={`subtitle-${scene.id}`} className="sr-only">
              Subtítulo escena {idx + 1}
            </label>
            <input
              id={`subtitle-${scene.id}`}
              type="text"
              value={scene.subtitle}
              onChange={(e) => onUpdateSubtitle(scene.id, e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-rose-600 focus:outline-none transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500">
          Hashtags sugeridos: <span className="text-slate-700">{project.hashtags.join(' ')}</span>
        </p>
      </div>
    </section>
  );
}
