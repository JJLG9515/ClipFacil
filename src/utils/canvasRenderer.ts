import type { ReelProject, SceneRole } from '../types/reel';
import { getActiveSceneAtTime, wrapSubtitleLines } from './reelLogic';

const ROLE_LABELS: Record<SceneRole, string> = {
  hook: 'GANCHO',
  desarrollo: 'IDEA CLAVE',
  cierre: 'CIERRE',
};

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  scale: number,
  offsetX: number,
  offsetY: number,
) {
  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const canvasRatio = width / height;

  let drawW = width;
  let drawH = height;
  if (imgRatio > canvasRatio) {
    drawH = height;
    drawW = height * imgRatio;
  } else {
    drawW = width;
    drawH = width / imgRatio;
  }

  drawW *= scale;
  drawH *= scale;
  const x = (width - drawW) / 2 + offsetX;
  const y = (height - drawH) / 2 + offsetY;
  ctx.drawImage(img, x, y, drawW, drawH);
}

export function drawReelFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  project: ReelProject,
  elapsedSec: number,
  imagesByKey: Record<string, HTMLImageElement | undefined>,
  defaultImageKey: string,
  showSafeZone = false,
): void {
  ctx.clearRect(0, 0, width, height);

  // Dark base fallback
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, height);

  const active = getActiveSceneAtTime(project.scenes, elapsedSec);
  if (!active) return;

  const { scene, index, localProgress, transitionAlpha } = active;
  const img =
    (scene.customImageUrl ? imagesByKey[scene.customImageUrl] : undefined) ??
    imagesByKey[defaultImageKey];

  ctx.save();
  ctx.globalAlpha = 1;

  // Compute smooth Ken Burns motion + transition
  let scale = 1.04 + localProgress * 0.08;
  let tx = Math.sin((index + 1) * 1.4) * (localProgress - 0.5) * 28;
  const ty = Math.cos((index + 1) * 0.9) * (localProgress - 0.5) * 22;

  if (scene.transition === 'zoom') {
    scale += (1 - transitionAlpha) * 0.14;
  } else if (scene.transition === 'slide') {
    tx += (1 - transitionAlpha) * (width * 0.12);
  }

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.globalAlpha = scene.transition === 'fade' ? 0.35 + transitionAlpha * 0.65 : 1;
    drawCoverImage(ctx, img, width, height, scale, tx, ty);
  } else {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E293B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();

  // Measured contrast scrim for 4.5:1+ white subtitle legibility across any frame
  const scrim = ctx.createLinearGradient(0, 0, 0, height);
  scrim.addColorStop(0, 'rgba(15, 23, 42, 0.58)');
  scrim.addColorStop(0.32, 'rgba(15, 23, 42, 0.35)');
  scrim.addColorStop(0.65, 'rgba(15, 23, 42, 0.55)');
  scrim.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  // Subtle top progress bar segments
  const barTop = Math.round(height * 0.036);
  const barMargin = Math.round(width * 0.06);
  const gap = Math.round(width * 0.015);
  const count = project.scenes.length;
  const segWidth = (width - barMargin * 2 - gap * (count - 1)) / count;
  const segHeight = Math.max(4, Math.round(height * 0.005));

  for (let i = 0; i < count; i++) {
    const sx = barMargin + i * (segWidth + gap);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.roundRect(sx, barTop, segWidth, segHeight, segHeight / 2);
    ctx.fill();

    const fillRatio = i < index ? 1 : i === index ? localProgress : 0;
    if (fillRatio > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(sx, barTop, segWidth * fillRatio, segHeight, segHeight / 2);
      ctx.fill();
    }
  }

  // Top topic kicker (clean unboxed text)
  ctx.save();
  ctx.font = `600 ${Math.round(width * 0.033)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `${project.style} · ${ROLE_LABELS[scene.role]}`,
    barMargin,
    barTop + segHeight + Math.round(height * 0.018),
  );
  ctx.restore();

  // Animated subtitle block centered in safe zone (avoids right-side TikTok icons & bottom caption)
  const lines = wrapSubtitleLines(scene.subtitle, 20);
  const fontSize = Math.round(width * 0.068);
  const lineHeight = Math.round(fontSize * 1.24);
  const totalTextHeight = lines.length * lineHeight;
  const centerY = Math.round(height * 0.56);
  const startY = centerY - totalTextHeight / 2;

  ctx.save();
  const popScale = 0.94 + Math.min(1, transitionAlpha * 1.15) * 0.06;
  ctx.translate(width / 2, centerY);
  ctx.scale(popScale, popScale);
  ctx.translate(-width / 2, -centerY);
  ctx.globalAlpha = Math.min(1, transitionAlpha * 1.3);

  ctx.font = `800 ${fontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  lines.forEach((line, lineIdx) => {
    const ly = startY + lineIdx * lineHeight + lineHeight / 2;
    const metrics = ctx.measureText(line);
    const padX = Math.round(width * 0.036);
    const padY = Math.round(fontSize * 0.22);
    const boxW = metrics.width + padX * 2;
    const boxH = fontSize + padY * 1.5;

    ctx.fillStyle = lineIdx === 0 && scene.role === 'hook'
      ? 'rgba(225, 29, 72, 0.94)'
      : 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect((width - boxW) / 2, ly - boxH / 2, boxW, boxH, Math.round(width * 0.02));
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(line, width / 2, ly + 1);
  });
  ctx.restore();

  // Bottom safe-zone title & subtle waveform bars
  const footerY = Math.round(height * 0.82);
  ctx.save();
  ctx.font = `600 ${Math.round(width * 0.035)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  const maxTitleWidth = Math.round(width * 0.72);
  let titleText = project.topic;
  if (ctx.measureText(titleText).width > maxTitleWidth) {
    while (titleText.length > 4 && ctx.measureText(`${titleText}...`).width > maxTitleWidth) {
      titleText = titleText.slice(0, -1);
    }
    titleText = `${titleText}...`;
  }
  ctx.fillText(titleText, barMargin, footerY);

  ctx.font = `500 ${Math.round(width * 0.028)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.fillText(project.hashtags.slice(0, 3).join(' '), barMargin, footerY + Math.round(height * 0.034));
  ctx.restore();

  // Optional TikTok/Reels safe-zone overlay guide
  if (showSafeZone) {
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    // Right interaction bar safe margin
    ctx.strokeRect(
      Math.round(width * 0.05),
      Math.round(height * 0.1),
      Math.round(width * 0.78),
      Math.round(height * 0.7),
    );
    ctx.restore();
  }
}
