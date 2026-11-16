export type ReelDuration = 15 | 30 | 60;

export type ReelStyle =
  | 'Educativo'
  | 'Divertido'
  | 'Motivacional'
  | 'Estético'
  | 'Noticias';

export type MusicPreset =
  | 'lofi'
  | 'motivacional'
  | 'dinamico'
  | 'ambient'
  | 'noticias';

export type TransitionKind = 'fade' | 'zoom' | 'slide';

export type SceneRole = 'hook' | 'desarrollo' | 'cierre';

export interface RawSceneInput {
  role?: SceneRole;
  subtitle: string;
  narration?: string;
  visualQuery?: string;
  durationSec?: number;
  transition?: TransitionKind;
}

export interface SceneSegment {
  id: string;
  role: SceneRole;
  subtitle: string;
  narration: string;
  visualQuery: string;
  durationSec: number;
  startTime: number;
  endTime: number;
  transition: TransitionKind;
  accentHex: string;
  customImageUrl?: string;
}

export interface ReelProject {
  id: string;
  topic: string;
  title: string;
  duration: ReelDuration;
  style: ReelStyle;
  musicPreset: MusicPreset;
  hashtags: string[];
  hookText: string;
  developmentText: string;
  closingText: string;
  scenes: SceneSegment[];
  source: 'gemini' | 'offline';
  createdAt: string;
}

export interface ActiveSceneState {
  scene: SceneSegment;
  index: number;
  localElapsed: number;
  localProgress: number;
  transitionAlpha: number;
}
