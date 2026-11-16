import { Play, Trash2 } from 'lucide-react';
import type { ReelProject } from '../types/reel';
import { STYLE_BACKDROP_IMAGES } from '../utils/styleAssets';

interface SavedReelsViewProps {
  projects: ReelProject[];
  onLoadProject: (project: ReelProject) => void;
  onDeleteProject: (id: string) => void;
  onGoToStudio: () => void;
}

export function SavedReelsView({
  projects,
  onLoadProject,
  onDeleteProject,
  onGoToStudio,
}: SavedReelsViewProps) {
  if (projects.length === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 text-center max-w-xl mx-auto my-8">
        <h2 className="font-display text-xl font-semibold text-slate-900">
          Todavía no hay videos guardados
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Genera tu primer video vertical y guárdalo aquí para editarlo o exportarlo sin conexión en tu teléfono.
        </p>
        <button
          type="button"
          onClick={onGoToStudio}
          className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors"
        >
          Crear mi primer video
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby="saved-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="saved-heading"
            className="font-display text-2xl font-bold text-slate-900"
          >
            Mis Videos Guardados
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Almacenados localmente en tu dispositivo para acceso rápido y sin conexión.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((item) => {
          const thumb = STYLE_BACKDROP_IMAGES[item.style];
          return (
            <article
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="relative h-48 bg-slate-900 overflow-hidden">
                <img
                  src={thumb}
                  alt={`Fondo estilo ${item.style} para ${item.topic}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="text-xs font-medium text-white/80 tabular-nums">
                    {item.duration}s · {item.style} ·{' '}
                    {item.source === 'gemini' ? 'Gemini IA' : 'Offline'}
                  </p>
                  <h2 className="font-display text-base font-bold leading-snug mt-0.5 line-clamp-2">
                    {item.topic}
                  </h2>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <p className="text-sm text-slate-600 line-clamp-2">
                  {item.hookText}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onLoadProject(item)}
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Abrir en Estudio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(item.id)}
                    aria-label={`Eliminar '${item.topic}'`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
