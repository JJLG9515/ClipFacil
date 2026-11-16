import { ImagePlus, Loader2, WifiOff } from 'lucide-react';
import type { ChangeEvent, FormEvent, RefObject } from 'react';
import type { ReelDuration, ReelStyle } from '../types/reel';
import {
  EXAMPLE_TOPICS,
  REEL_DURATIONS,
  REEL_STYLES,
} from '../utils/reelLogic';

interface CreatorFormProps {
  topic: string;
  onTopicChange: (value: string) => void;
  duration: ReelDuration;
  onDurationChange: (duration: ReelDuration) => void;
  style: ReelStyle;
  onStyleChange: (style: ReelStyle) => void;
  includeMusic: boolean;
  onToggleMusic: (val: boolean) => void;
  offlineMode: boolean;
  onToggleOffline: (val: boolean) => void;
  customPhotoCount: number;
  onUploadPhotos: (files: FileList | null) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  validationError: string | null;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function CreatorForm({
  topic,
  onTopicChange,
  duration,
  onDurationChange,
  style,
  onStyleChange,
  includeMusic,
  onToggleMusic,
  offlineMode,
  onToggleOffline,
  customPhotoCount,
  onUploadPhotos,
  onSubmit,
  isGenerating,
  validationError,
  inputRef,
}: CreatorFormProps) {
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUploadPhotos(e.target.files);
    e.target.value = '';
  };

  return (
    <section
      aria-labelledby="creator-heading"
      className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6"
    >
      <div className="mb-5">
        <h2
          id="creator-heading"
          className="font-display text-lg font-semibold text-slate-900"
        >
          Configura tu video corto
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Escribe un tema, elige duración y estilo. La app genera el guion, los subtítulos y el montaje vertical 9:16.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="topic-input"
            className="block text-sm font-semibold text-slate-900 mb-2"
          >
            Tema o idea del video
          </label>
          <textarea
            ref={inputRef}
            id="topic-input"
            rows={2}
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Ej: Motivación para estudiar, recetas fáciles de cena, curiosidades del espacio..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-600 focus:outline-none transition-colors resize-none"
          />
          {validationError && (
            <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
              {validationError}
            </p>
          )}

          <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {EXAMPLE_TOPICS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => onTopicChange(sample)}
                className="min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <span className="block text-sm font-semibold text-slate-900 mb-2">
              Duración
            </span>
            <div
              role="group"
              aria-label="Duración del video"
              className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl"
            >
              {REEL_DURATIONS.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => onDurationChange(dur)}
                  aria-pressed={duration === dur}
                  className={`min-h-[44px] rounded-lg text-sm font-semibold tabular-nums transition-colors whitespace-nowrap ${
                    duration === dur
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-slate-900 mb-2">
              Opciones rápidas
            </span>
            <div className="space-y-2">
              <label className="flex items-center justify-between min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="text-sm font-medium text-slate-700">
                  Música libre de derechos
                </span>
                <input
                  type="checkbox"
                  checked={includeMusic}
                  onChange={(e) => onToggleMusic(e.target.checked)}
                  className="h-4 w-4 accent-rose-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold text-slate-900 mb-2">
            Estilo del video
          </span>
          <div
            role="group"
            aria-label="Estilo del video"
            className="flex flex-wrap gap-2"
          >
            {REEL_STYLES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onStyleChange(item)}
                aria-pressed={style === item}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  style === item
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="inline-flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={offlineMode}
              onChange={(e) => onToggleOffline(e.target.checked)}
              className="h-4 w-4 accent-rose-600 rounded"
            />
            <WifiOff className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Modo Offline (sin consumo de datos)</span>
          </label>

          <label className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer transition-colors whitespace-nowrap">
            <ImagePlus className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <span>
              {customPhotoCount > 0
                ? `${customPhotoCount} fotos propias cargadas`
                : 'Usar fotos de mi galería (opcional)'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full min-h-[54px] px-6 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-display text-base font-semibold rounded-xl transition-colors flex items-center justify-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>Generando guion y escenas...</span>
            </>
          ) : (
            <span>Generar Video</span>
          )}
        </button>
      </form>
    </section>
  );
}
