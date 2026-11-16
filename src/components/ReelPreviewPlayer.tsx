import {
  Bookmark,
  Check,
  Download,
  Eye,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReelProject } from '../types/reel';
import { drawReelFrame } from '../utils/canvasRenderer';
import { RoyaltyFreeMusicEngine } from '../utils/musicEngine';
import { formatTimecode } from '../utils/reelLogic';
import { STYLE_BACKDROP_IMAGES } from '../utils/styleAssets';
import { exportReelToVideo } from '../utils/videoExporter';

interface ReelPreviewPlayerProps {
  project: ReelProject;
  includeMusic: boolean;
  onToggleMusic: (val: boolean) => void;
  seekRequestSec: number | null;
  onClearSeekRequest: () => void;
  onSaveProject: (project: ReelProject) => void;
  isSaved: boolean;
}

export function ReelPreviewPlayer({
  project,
  includeMusic,
  onToggleMusic,
  seekRequestSec,
  onClearSeekRequest,
  onSaveProject,
  isSaved,
}: ReelPreviewPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const musicRef = useRef<RoyaltyFreeMusicEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [lastExportFile, setLastExportFile] = useState<File | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const elapsedRef = useRef(0);
  const isPlayingRef = useRef(true);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Preload style backdrops and any custom scene images
  useEffect(() => {
    const urls = new Set<string>(Object.values(STYLE_BACKDROP_IMAGES));
    project.scenes.forEach((s) => {
      if (s.customImageUrl) urls.add(s.customImageUrl);
    });

    urls.forEach((url) => {
      if (!imagesRef.current[url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        imagesRef.current[url] = img;
      }
    });
  }, [project]);

  // Reset timeline when a new project ID is loaded
  useEffect(() => {
    elapsedRef.current = 0;
    setElapsedSec(0);
    setIsPlaying(true);
    setLastExportFile(null);
    setExportStatus(null);
  }, [project.id]);

  // Handle jump-to-scene click from ScriptEditorPanel
  useEffect(() => {
    if (seekRequestSec !== null) {
      elapsedRef.current = Math.max(0, Math.min(project.duration, seekRequestSec));
      setElapsedSec(elapsedRef.current);
      onClearSeekRequest();
    }
  }, [seekRequestSec, project.duration, onClearSeekRequest]);

  // Synchronize Web Audio music during active playback if user interacted
  useEffect(() => {
    if (!musicRef.current) {
      musicRef.current = new RoyaltyFreeMusicEngine();
    }
    if (isPlaying && includeMusic && audioUnlocked) {
      musicRef.current.start(project.musicPreset);
    } else {
      musicRef.current.stop();
    }
    return () => {
      musicRef.current?.stop();
    };
  }, [isPlaying, includeMusic, audioUnlocked, project.musicPreset]);

  // 120Hz-ready Canvas animation loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let lastUiSync = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastTs) / 1000);
      lastTs = now;

      if (isPlayingRef.current) {
        elapsedRef.current += dt;
        if (elapsedRef.current >= project.duration) {
          elapsedRef.current = 0;
        }
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const defaultImgUrl = STYLE_BACKDROP_IMAGES[project.style];
        drawReelFrame(
          ctx,
          canvas.width,
          canvas.height,
          project,
          elapsedRef.current,
          imagesRef.current,
          defaultImgUrl,
          showSafeZone,
        );
      }

      if (now - lastUiSync > 120) {
        setElapsedSec(elapsedRef.current);
        lastUiSync = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [project, showSafeZone]);

  const handleTogglePlay = () => {
    setAudioUnlocked(true);
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    setAudioUnlocked(true);
    elapsedRef.current = 0;
    setElapsedSec(0);
    setIsPlaying(true);
  };

  const handleExportVideo = async () => {
    setAudioUnlocked(true);
    setIsPlaying(false);
    setExportProgress(0);
    setExportStatus('Renderizando video vertical 9:16...');

    try {
      const defaultImgUrl = STYLE_BACKDROP_IMAGES[project.style];
      const result = await exportReelToVideo(
        project,
        imagesRef.current,
        defaultImgUrl,
        includeMusic,
        (pct) => setExportProgress(pct),
      );

      const file = new File([result.blob], result.filename, {
        type: result.mimeType,
      });
      setLastExportFile(file);

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);

      setExportStatus(`Video guardado: ${result.filename}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'No se pudo exportar el video.';
      setExportStatus(msg);
    } finally {
      setExportProgress(null);
    }
  };

  const handleShare = async () => {
    setAudioUnlocked(true);
    const shareText = `${project.title}\n${project.hashtags.join(' ')}`;
    try {
      if (
        lastExportFile &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [lastExportFile] })
      ) {
        await navigator.share({
          title: project.title,
          text: shareText,
          files: [lastExportFile],
        });
        setExportStatus('Compartido con éxito.');
        return;
      }

      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: project.title,
          text: shareText,
        });
        setExportStatus('Texto y hashtags compartidos.');
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setExportStatus(
        'Primero toca "Guardar en Galería" para descargar el video; copiamos tus hashtags al portapapeles.',
      );
    } catch {
      // User dismissed share sheet
    }
  };

  return (
    <section
      id="preview-section"
      aria-labelledby="preview-heading"
      className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center"
    >
      <div className="w-full flex items-center justify-between gap-3 mb-4">
        <div>
          <h2
            id="preview-heading"
            className="font-display text-lg font-semibold text-slate-900"
          >
            Vista previa 9:16
          </h2>
          <p className="text-xs text-slate-500">
            Formato vertical listo para TikTok y Facebook Reels
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSafeZone((v) => !v)}
          aria-pressed={showSafeZone}
          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border transition-colors whitespace-nowrap ${
            showSafeZone
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Zona segura</span>
        </button>
      </div>

      <div className="w-full max-w-[255px] xl:max-w-[265px] aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 relative">
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          data-testid="reel-canvas"
          className="w-full h-full block"
        />
      </div>

      <div className="w-full max-w-[330px] mt-3.5 space-y-2.5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pausar vista previa' : 'Reproducir vista previa'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Play className="w-5 h-5" aria-hidden="true" />
            )}
          </button>

          <input
            type="range"
            aria-label="Línea de tiempo del video"
            min={0}
            max={project.duration}
            step={0.1}
            value={elapsedSec}
            onChange={(e) => {
              const v = Number(e.target.value);
              elapsedRef.current = v;
              setElapsedSec(v);
            }}
            className="flex-1 accent-rose-600 cursor-pointer"
          />

          <span className="text-xs font-mono tabular-nums text-slate-600 shrink-0">
            {formatTimecode(elapsedSec)} / {formatTimecode(project.duration)}
          </span>

          <button
            type="button"
            onClick={handleRestart}
            aria-label="Reiniciar video"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => {
              setAudioUnlocked(true);
              onToggleMusic(!includeMusic);
            }}
            aria-label={includeMusic ? 'Silenciar música' : 'Activar música'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {includeMusic ? (
              <Volume2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            disabled={exportProgress !== null}
            onClick={handleExportVideo}
            className="min-h-[48px] px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            {exportProgress !== null ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span className="tabular-nums">{exportProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Guardar en Galería</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            <span>Compartir</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSaveProject(project)}
          className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 transition-colors"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Guardado en Mis Videos (Offline)</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" aria-hidden="true" />
              <span>Guardar proyecto en Mis Videos</span>
            </>
          )}
        </button>

        {exportStatus && (
          <p
            role="status"
            className="text-xs text-center font-medium text-slate-700 bg-slate-100 rounded-xl px-3 py-2"
          >
            {exportStatus}
          </p>
        )}
      </div>
    </section>
  );
}
