import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  MusicPreset,
  RawSceneInput,
  ReelDuration,
  ReelProject,
  ReelStyle,
} from './src/types/reel';
import {
  getDefaultMusicForStyle,
  getSceneCountForDuration,
  normalizeScenesToDuration,
  slugifyTopic,
} from './src/utils/reelLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const VALID_DURATIONS = new Set<ReelDuration>([15, 30, 60]);
const VALID_STYLES = new Set<ReelStyle>([
  'Educativo',
  'Divertido',
  'Motivacional',
  'Estético',
  'Noticias',
]);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/generate-reel', async (req, res) => {
    try {
      const rawTopic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
      const duration = Number(req.body?.duration) as ReelDuration;
      const style = req.body?.style as ReelStyle;

      if (!rawTopic || rawTopic.length < 2) {
        res.status(400).json({ error: 'Escribe un tema válido de al menos 2 caracteres.' });
        return;
      }
      if (!VALID_DURATIONS.has(duration)) {
        res.status(400).json({ error: 'Duración inválida. Elige 15, 30 o 60 segundos.' });
        return;
      }
      if (!VALID_STYLES.has(style)) {
        res.status(400).json({ error: 'Estilo inválido.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({
          error: 'GEMINI_API_KEY no configurada en el servidor.',
        });
        return;
      }

      const sceneCount = getSceneCountForDuration(duration);
      const prompt = [
        `Crea un guion completo para un video vertical corto (TikTok / Facebook Reels) en español.`,
        `Tema: "${rawTopic}"`,
        `Duración total exacta: ${duration} segundos`,
        `Estilo visual y narrativo: ${style}`,
        `Cantidad exacta de escenas: ${sceneCount}.`,
        `Reglas clave:`,
        `1. La escena 1 debe ser "hook" (gancho inmediato de 2 a 4 segundos).`,
        `2. Las escenas intermedias deben ser "desarrollo" (datos claros, ritmo dinámico).`,
        `3. La última escena debe ser "cierre" (llamado a guardar/compartir).`,
        `4. Cada subtítulo en pantalla ("subtitle") debe ser corto, directo y muy legible (máximo 10 palabras).`,
        `5. "visualQuery" debe estar en inglés corto (2-4 palabras) ideal para buscar fotos/videos gratis en Pexels o Pixabay.`,
        `6. Incluye 5 hashtags relevantes en español sin espacios.`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Eres un productor experto en contenido vertical para TikTok y Facebook Reels en español. Respondes únicamente con JSON válido siguiendo el esquema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Título breve y atractivo para el video.',
              },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de 5 hashtags con # al inicio.',
              },
              musicPreset: {
                type: Type.STRING,
                description: 'Uno de: lofi, motivacional, dinamico, ambient, noticias',
              },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: {
                      type: Type.STRING,
                      description: 'hook, desarrollo o cierre',
                    },
                    subtitle: {
                      type: Type.STRING,
                      description: 'Texto grande en pantalla (máximo 10 palabras).',
                    },
                    narration: {
                      type: Type.STRING,
                      description: 'Frase natural de locución.',
                    },
                    visualQuery: {
                      type: Type.STRING,
                      description: 'Palabras clave en inglés para stock visual gratuito.',
                    },
                    durationSec: {
                      type: Type.NUMBER,
                      description: 'Duración sugerida en segundos.',
                    },
                    transition: {
                      type: Type.STRING,
                      description: 'fade, zoom o slide',
                    },
                  },
                  required: ['role', 'subtitle', 'visualQuery', 'durationSec'],
                },
              },
            },
            required: ['title', 'hashtags', 'scenes'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText) as {
        title?: string;
        hashtags?: string[];
        musicPreset?: MusicPreset;
        scenes?: RawSceneInput[];
      };

      const normalizedScenes = normalizeScenesToDuration(
        Array.isArray(parsed.scenes) ? parsed.scenes : [],
        duration,
        style,
      );

      const validPresets = new Set<MusicPreset>([
        'lofi',
        'motivacional',
        'dinamico',
        'ambient',
        'noticias',
      ]);
      const musicPreset =
        parsed.musicPreset && validPresets.has(parsed.musicPreset)
          ? parsed.musicPreset
          : getDefaultMusicForStyle(style);

      const hashtags =
        Array.isArray(parsed.hashtags) && parsed.hashtags.length > 0
          ? parsed.hashtags
              .slice(0, 6)
              .map((h) => {
                const clean = String(h).trim().replace(/^#+\s*/, '').replace(/\s+/g, '');
                return clean ? `#${clean}` : '';
              })
              .filter(Boolean)
          : [`#${slugifyTopic(rawTopic)}`, '#reels', '#tiktokespanol'];

      const project: ReelProject = {
        id: `reel-${Date.now()}`,
        topic: rawTopic,
        title: (parsed.title ?? `${rawTopic} · ${style}`).trim(),
        duration,
        style,
        musicPreset,
        hashtags,
        hookText: normalizedScenes[0]?.subtitle ?? '',
        developmentText: normalizedScenes
          .slice(1, -1)
          .map((s) => s.subtitle)
          .join(' '),
        closingText: normalizedScenes[normalizedScenes.length - 1]?.subtitle ?? '',
        scenes: normalizedScenes,
        source: 'gemini',
        createdAt: new Date().toISOString(),
      };

      res.json({ project });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo generar el guion con Gemini.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`ClipFácil server running on http://localhost:${port}`);
  });
}

startServer();
