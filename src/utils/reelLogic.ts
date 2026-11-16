import type {
  ActiveSceneState,
  MusicPreset,
  RawSceneInput,
  ReelDuration,
  ReelProject,
  ReelStyle,
  SceneRole,
  SceneSegment,
  TransitionKind,
} from '../types/reel';

export const REEL_DURATIONS: ReelDuration[] = [15, 30, 60];

export const REEL_STYLES: ReelStyle[] = [
  'Educativo',
  'Divertido',
  'Motivacional',
  'Estético',
  'Noticias',
];

export const EXAMPLE_TOPICS: string[] = [
  'Motivación para estudiar',
  'Recetas fáciles de cena',
  'Curiosidades del espacio',
  'Tips de productividad',
];

export const MUSIC_PRESET_LABELS: Record<MusicPreset, string> = {
  lofi: 'Lo-Fi Concentración (Sin copyright)',
  motivacional: 'Pulso Épico Ascendente',
  dinamico: 'Ritmo Pop Dinámico',
  ambient: 'Ambient Minimalista',
  noticias: 'Base Informativa Moderna',
};

const STYLE_ACCENTS: Record<ReelStyle, string> = {
  Educativo: '#F59E0B',
  Divertido: '#FB7185',
  Motivacional: '#F97316',
  Estético: '#10B981',
  Noticias: '#38BDF8',
};

const STYLE_MUSIC: Record<ReelStyle, MusicPreset> = {
  Educativo: 'lofi',
  Divertido: 'dinamico',
  Motivacional: 'motivacional',
  Estético: 'ambient',
  Noticias: 'noticias',
};

export function getDefaultMusicForStyle(style: ReelStyle): MusicPreset {
  return STYLE_MUSIC[style];
}

export function getSceneCountForDuration(duration: ReelDuration): number {
  if (duration === 15) return 3;
  if (duration === 30) return 5;
  return 8;
}

export function formatTimecode(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function slugifyTopic(topic: string): string {
  return (
    topic
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'reel-clipfacil'
  );
}

export function wrapSubtitleLines(text: string, maxCharsPerLine = 22): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export function normalizeScenesToDuration(
  rawScenes: RawSceneInput[],
  targetDuration: ReelDuration,
  style: ReelStyle,
): SceneSegment[] {
  const expectedCount = getSceneCountForDuration(targetDuration);
  const safeRaw = rawScenes.slice(0, expectedCount);
  while (safeRaw.length < expectedCount) {
    const idx = safeRaw.length;
    safeRaw.push({
      role: idx === 0 ? 'hook' : idx === expectedCount - 1 ? 'cierre' : 'desarrollo',
      subtitle:
        idx === expectedCount - 1
          ? 'Guarda este video y compártelo hoy.'
          : 'Aplica este paso clave desde ahora.',
      visualQuery: style.toLowerCase(),
      transition: idx % 2 === 0 ? 'zoom' : 'fade',
    });
  }

  const rawWeights = safeRaw.map((s) =>
    typeof s.durationSec === 'number' && s.durationSec > 0 ? s.durationSec : 1,
  );
  const weightSum = rawWeights.reduce((acc, n) => acc + n, 0) || safeRaw.length;

  let allocated = 0;
  const durations = rawWeights.map((w, idx) => {
    if (idx === safeRaw.length - 1) {
      return Math.max(2, Number((targetDuration - allocated).toFixed(2)));
    }
    const sec = Math.max(2, Math.round((w / weightSum) * targetDuration * 10) / 10);
    allocated += sec;
    return sec;
  });

  // Ensure exact total equals targetDuration even after rounding
  const finalSum = durations.reduce((a, b) => a + b, 0);
  const diff = Number((targetDuration - finalSum).toFixed(2));
  durations[durations.length - 1] = Math.max(
    1.5,
    Number((durations[durations.length - 1] + diff).toFixed(2)),
  );

  const transitions: TransitionKind[] = ['fade', 'zoom', 'slide'];
  const accentHex = STYLE_ACCENTS[style];
  let cursor = 0;

  return safeRaw.map((scene, index) => {
    const dur = durations[index];
    const startTime = Number(cursor.toFixed(2));
    const endTime = Number((cursor + dur).toFixed(2));
    cursor = endTime;

    const inferredRole: SceneRole =
      scene.role ??
      (index === 0 ? 'hook' : index === safeRaw.length - 1 ? 'cierre' : 'desarrollo');

    return {
      id: `scene-${index + 1}`,
      role: inferredRole,
      subtitle: scene.subtitle.trim() || 'Idea clave del video',
      narration: (scene.narration ?? scene.subtitle).trim(),
      visualQuery: (scene.visualQuery ?? style).trim(),
      durationSec: dur,
      startTime,
      endTime,
      transition: scene.transition ?? transitions[index % transitions.length],
      accentHex,
    };
  });
}

export function getActiveSceneAtTime(
  scenes: SceneSegment[],
  elapsedSec: number,
): ActiveSceneState | null {
  if (scenes.length === 0) return null;
  const clamped = Math.max(0, elapsedSec);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (clamped < scene.endTime || i === scenes.length - 1) {
      const localElapsed = Math.max(0, Math.min(scene.durationSec, clamped - scene.startTime));
      const localProgress = scene.durationSec > 0 ? localElapsed / scene.durationSec : 1;
      const fadeWindow = Math.min(0.45, scene.durationSec * 0.25);
      const transitionAlpha =
        fadeWindow > 0 ? Math.min(1, localElapsed / fadeWindow) : 1;
      return {
        scene,
        index: i,
        localElapsed,
        localProgress,
        transitionAlpha,
      };
    }
  }
  return null;
}

export function generateOfflineReel(
  rawTopic: string,
  duration: ReelDuration,
  style: ReelStyle,
): ReelProject {
  const topic = rawTopic.trim();
  if (!topic) {
    throw new Error('El tema no puede estar vacío.');
  }

  const count = getSceneCountForDuration(duration);
  const templates: Record<ReelStyle, (t: string) => RawSceneInput[]> = {
    Educativo: (t) => [
      {
        role: 'hook',
        subtitle: `¿Sabías esto sobre ${t}?`,
        narration: `Pocos conocen este dato clave sobre ${t}.`,
        visualQuery: `${t} ciencia estudio`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'Primero: entiende la regla base que lo explica todo.',
        visualQuery: `${t} cuaderno notas`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Segundo: aplica bloques cortos de 20 minutos.',
        visualQuery: `${t} enfoque reloj`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'Tercero: elimina distracciones y mide tu avance.',
        visualQuery: `${t} escritorio minimal`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'Así multiplicas tu retención sin esfuerzo extra.',
        visualQuery: `${t} aprendizaje`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Prueba este método hoy mismo durante 7 días.',
        visualQuery: `${t} calendario`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'Notarás resultados claros desde la primera semana.',
        visualQuery: `${t} progreso`,
        transition: 'zoom',
      },
      {
        role: 'cierre',
        subtitle: 'Guarda este clip y compártelo con alguien que lo necesite.',
        visualQuery: `${t} comunidad`,
        transition: 'fade',
      },
    ],
    Divertido: (t) => [
      {
        role: 'hook',
        subtitle: `Nadie te contó la verdad sobre ${t}.`,
        visualQuery: `${t} sorpresa`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'Empiezas con mil ganas... y a los 5 minutos miras el celular.',
        visualQuery: `${t} humor`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'El truco real es hacerlo tan fácil que dé risa fallar.',
        visualQuery: `${t} colores`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Paso uno: empieza en 60 segundos sin pensarlo.',
        visualQuery: `${t} energia`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'Paso dos: prémiate cada vez que termines.',
        visualQuery: `${t} celebracion`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'Si te cuesta, ríete del caos y sigue adelante.',
        visualQuery: `${t} diversion`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'La constancia gana aunque empieces improvisando.',
        visualQuery: `${t} ritmo`,
        transition: 'zoom',
      },
      {
        role: 'cierre',
        subtitle: 'Etiqueta a tu amigo que necesita ver esto ya.',
        visualQuery: `${t} amigos`,
        transition: 'slide',
      },
    ],
    Motivacional: (t) => [
      {
        role: 'hook',
        subtitle: `Deja de esperar el momento perfecto para ${t}.`,
        visualQuery: `${t} amanecer`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'La disciplina vence al talento cuando nadie está mirando.',
        visualQuery: `${t} montaña`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Un avance pequeño hoy vale más que mil planes mañana.',
        visualQuery: `${t} camino`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'Construye el hábito en silencio y deja que el resultado hable.',
        visualQuery: `${t} esfuerzo`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'Cada día que cumples contigo aumenta tu confianza.',
        visualQuery: `${t} cima`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'No negocies tus metas cuando llegue el cansancio.',
        visualQuery: `${t} enfoque`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'En 30 días te vas a agradecer haber empezado hoy.',
        visualQuery: `${t} victoria`,
        transition: 'zoom',
      },
      {
        role: 'cierre',
        subtitle: 'Guarda este video y empieza tu primer paso hoy.',
        visualQuery: `${t} accion`,
        transition: 'fade',
      },
    ],
    Estético: (t) => [
      {
        role: 'hook',
        subtitle: `Pequeños rituales para disfrutar ${t}.`,
        visualQuery: `${t} luz natural`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Baja el ritmo, ordena tu espacio y respira profundo.',
        visualQuery: `${t} minimalismo`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'La calma visual transforma tu enfoque en segundos.',
        visualQuery: `${t} arquitectura`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Elige una sola cosa importante y hazla con intención.',
        visualQuery: `${t} ceramica`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'Menos ruido digital, más presencia en cada detalle.',
        visualQuery: `${t} naturaleza`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Convierte tu rutina diaria en un momento para ti.',
        visualQuery: `${t} cafe`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'La belleza está en la simplicidad constante.',
        visualQuery: `${t} sombra`,
        transition: 'fade',
      },
      {
        role: 'cierre',
        subtitle: 'Guarda esta vibra para tu día y síguenos para más.',
        visualQuery: `${t} calma`,
        transition: 'fade',
      },
    ],
    Noticias: (t) => [
      {
        role: 'hook',
        subtitle: `Lo último que debes saber sobre ${t} en segundos.`,
        visualQuery: `${t} ciudad`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'Dato clave 1: el cambio ya está impactando hábitos diarios.',
        visualQuery: `${t} datos`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'Dato clave 2: expertos recomiendan adaptarse cuanto antes.',
        visualQuery: `${t} analisis`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'Dato clave 3: las herramientas gratuitas lideran la tendencia.',
        visualQuery: `${t} tecnologia`,
        transition: 'slide',
      },
      {
        role: 'desarrollo',
        subtitle: 'Lo más importante: verifica fuentes antes de compartir.',
        visualQuery: `${t} prensa`,
        transition: 'fade',
      },
      {
        role: 'desarrollo',
        subtitle: 'El impacto se verá con mayor fuerza los próximos meses.',
        visualQuery: `${t} futuro`,
        transition: 'zoom',
      },
      {
        role: 'desarrollo',
        subtitle: 'Mantente informado sin perder horas leyendo resúmenes largos.',
        visualQuery: `${t} resumen`,
        transition: 'slide',
      },
      {
        role: 'cierre',
        subtitle: 'Comenta qué opinas y comparte este resumen rápido.',
        visualQuery: `${t} debate`,
        transition: 'fade',
      },
    ],
  };

  const fullList = templates[style](topic);
  // Always keep hook (first), middle slices, and closing (last)
  const selected: RawSceneInput[] =
    count === 3
      ? [fullList[0], fullList[1], fullList[fullList.length - 1]]
      : count === 5
        ? [fullList[0], fullList[1], fullList[2], fullList[3], fullList[fullList.length - 1]]
        : fullList;

  const scenes = normalizeScenesToDuration(selected, duration, style);
  const tagBase = slugifyTopic(topic).replace(/-/g, '');
  const hashtags = [
    `#${tagBase || 'reels'}`,
    `#${style.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`,
    '#tiktokespanol',
    '#reelsviral',
    '#contenido',
  ];

  return {
    id: `reel-${Date.now()}`,
    topic,
    title: `${topic} · ${style}`,
    duration,
    style,
    musicPreset: getDefaultMusicForStyle(style),
    hashtags,
    hookText: scenes[0]?.subtitle ?? '',
    developmentText: scenes
      .slice(1, -1)
      .map((s) => s.subtitle)
      .join(' '),
    closingText: scenes[scenes.length - 1]?.subtitle ?? '',
    scenes,
    source: 'offline',
    createdAt: new Date().toISOString(),
  };
}
