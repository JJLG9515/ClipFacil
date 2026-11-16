import type { ReelProject } from '../types/reel';
import { drawReelFrame } from './canvasRenderer';
import { RoyaltyFreeMusicEngine } from './musicEngine';
import { slugifyTopic } from './reelLogic';

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

function getSupportedVideoMime(): { mimeType: string; extension: string } {
  const candidates = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
    { mimeType: 'video/mp4', extension: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
    { mimeType: 'video/webm', extension: 'webm' },
  ];

  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: 'video/webm', extension: 'webm' };
}

export async function exportReelToVideo(
  project: ReelProject,
  imagesByKey: Record<string, HTMLImageElement | undefined>,
  defaultImageKey: string,
  includeMusic: boolean,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ExportResult> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('Tu navegador no soporta MediaRecorder para exportar video.');
  }

  // 720x1280 crisp HD 9:16 vertical export (fast & compatible on Snapdragon mobile browsers)
  const width = 720;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el lienzo de exportación.');
  }

  const videoStream = canvas.captureStream(30);
  const musicEngine = new RoyaltyFreeMusicEngine();
  let combinedStream: MediaStream = videoStream;

  if (includeMusic) {
    const audioStream = musicEngine.start(project.musicPreset, {
      muteSpeakers: true,
      captureStream: true,
    });
    if (audioStream) {
      combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
    }
  }

  const { mimeType, extension } = getSupportedVideoMime();
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 3_500_000,
  });

  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  return new Promise<ExportResult>((resolve, reject) => {
    let rafId = 0;
    const totalMs = project.duration * 1000;
    const startTs = performance.now();

    const cleanup = () => {
      if (rafId) cancelAnimationFrame(rafId);
      musicEngine.stop();
      videoStream.getTracks().forEach((t) => t.stop());
    };

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          cleanup();
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          reject(new Error('Exportación cancelada.'));
        },
        { once: true },
      );
    }

    recorder.onerror = () => {
      cleanup();
      reject(new Error('Error durante la codificación del video.'));
    };

    recorder.onstop = () => {
      cleanup();
      const blob = new Blob(chunks, { type: mimeType });
      const filename = `clipfacil-${slugifyTopic(project.topic)}-${project.duration}s.${extension}`;
      onProgress(100);
      resolve({ blob, filename, mimeType });
    };

    recorder.start(250);

    const renderTick = (now: number) => {
      if (signal?.aborted) return;
      const elapsedMs = now - startTs;
      const elapsedSec = Math.min(project.duration, elapsedMs / 1000);

      drawReelFrame(ctx, width, height, project, elapsedSec, imagesByKey, defaultImageKey, false);
      onProgress(Math.min(99, Math.round((elapsedMs / totalMs) * 100)));

      if (elapsedMs >= totalMs) {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
        return;
      }
      rafId = requestAnimationFrame(renderTick);
    };

    rafId = requestAnimationFrame(renderTick);
  });
}
