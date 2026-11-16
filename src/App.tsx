import { useEffect, useRef, useState } from 'react';
import { CreatorForm } from './components/CreatorForm';
import { FlutterBlueprintView } from './components/FlutterBlueprintView';
import { ReelPreviewPlayer } from './components/ReelPreviewPlayer';
import { SavedReelsView } from './components/SavedReelsView';
import { ScriptEditorPanel } from './components/ScriptEditorPanel';
import { type AppTab, TopBar } from './components/TopBar';
import type {
  MusicPreset,
  ReelDuration,
  ReelProject,
  ReelStyle,
} from './types/reel';
import { generateOfflineReel } from './utils/reelLogic';

const STORAGE_KEY = 'clipfacil_saved_reels_v1';

function loadSavedProjects(): ReelProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('estudio');
  const [topic, setTopic] = useState('Curiosidades del espacio');
  const [duration, setDuration] = useState<ReelDuration>(15);
  const [style, setStyle] = useState<ReelStyle>('Educativo');
  const [includeMusic, setIncludeMusic] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [customImages, setCustomImages] = useState<string[]>([]);

  const [currentProject, setCurrentProject] = useState<ReelProject>(() =>
    generateOfflineReel('Curiosidades del espacio', 15, 'Educativo'),
  );
  const [savedProjects, setSavedProjects] = useState<ReelProject[]>(loadSavedProjects);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [seekRequestSec, setSeekRequestSec] = useState<number | null>(null);

  const topicInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
    } catch {
      // Storage quota exceeded ignored cleanly
    }
  }, [savedProjects]);

  const applyCustomImagesToProject = (
    proj: ReelProject,
    images: string[],
  ): ReelProject => {
    if (images.length === 0) return proj;
    return {
      ...proj,
      scenes: proj.scenes.map((scene, idx) => ({
        ...scene,
        customImageUrl: images[idx % images.length],
      })),
    };
  };

  const handleUploadPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const urls = Array.from(files)
      .slice(0, 8)
      .map((f) => URL.createObjectURL(f));
    setCustomImages(urls);
    setCurrentProject((prev) => applyCustomImagesToProject(prev, urls));
  };

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (trimmed.length < 2) {
      setValidationError('Escribe un tema o idea de al menos 2 caracteres.');
      topicInputRef.current?.focus();
      return;
    }

    setValidationError(null);
    setGenerationNotice(null);
    setIsGenerating(true);

    try {
      if (offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        const offlineProject = applyCustomImagesToProject(
          generateOfflineReel(trimmed, duration, style),
          customImages,
        );
        setCurrentProject(offlineProject);
        setGenerationNotice('Video creado en modo offline sin consumo de datos.');
        return;
      }

      const res = await fetch('/api/generate-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmed, duration, style }),
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'No se pudo conectar con Gemini.');
      }

      const data = (await res.json()) as { project: ReelProject };
      setCurrentProject(applyCustomImagesToProject(data.project, customImages));
      setGenerationNotice('Guion y escenas generados automáticamente con IA.');
    } catch {
      const fallback = applyCustomImagesToProject(
        generateOfflineReel(trimmed, duration, style),
        customImages,
      );
      setCurrentProject(fallback);
      setGenerationNotice(
        'Se usó el generador local offline para crear tu video al instante.',
      );
    } finally {
      setIsGenerating(false);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        window.setTimeout(() => {
          document
            .getElementById('preview-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    }
  };

  const handleUpdateSubtitle = (sceneId: string, newSubtitle: string) => {
    setCurrentProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === sceneId ? { ...s, subtitle: newSubtitle } : s,
      ),
    }));
  };

  const handleChangeMusicPreset = (musicPreset: MusicPreset) => {
    setCurrentProject((prev) => ({ ...prev, musicPreset }));
  };

  const handleSaveProject = (project: ReelProject) => {
    setSavedProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      if (exists) {
        return prev.map((p) => (p.id === project.id ? project : p));
      }
      return [project, ...prev];
    });
  };

  const handleDeleteProject = (id: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLoadProject = (project: ReelProject) => {
    setCurrentProject(project);
    setTopic(project.topic);
    setDuration(project.duration);
    setStyle(project.style);
    setActiveTab('estudio');
  };

  const handleFocusCreate = () => {
    setActiveTab('estudio');
    window.setTimeout(() => {
      topicInputRef.current?.focus();
      topicInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const isCurrentSaved = savedProjects.some((p) => p.id === currentProject.id);

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-12">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedProjects.length}
        onFocusCreate={handleFocusCreate}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-8">
        {activeTab === 'estudio' && (
          <div className="space-y-6">
            <div className="max-w-3xl">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 text-balance">
                Crea videos cortos 9:16 listos para TikTok y Reels
              </h1>
              <p className="text-sm md:text-base text-slate-600 mt-1.5">
                100% gratuito, sin anuncios ni marcas de agua. Optimizado para pantalla de 6.7&quot; y 120Hz en Motorola Edge 50 Pro.
              </p>
            </div>

            {generationNotice && (
              <div
                role="status"
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700"
              >
                {generationNotice}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-6">
                <CreatorForm
                  topic={topic}
                  onTopicChange={(val) => {
                    setTopic(val);
                    if (validationError) setValidationError(null);
                  }}
                  duration={duration}
                  onDurationChange={setDuration}
                  style={style}
                  onStyleChange={setStyle}
                  includeMusic={includeMusic}
                  onToggleMusic={setIncludeMusic}
                  offlineMode={offlineMode}
                  onToggleOffline={setOfflineMode}
                  customPhotoCount={customImages.length}
                  onUploadPhotos={handleUploadPhotos}
                  onSubmit={handleGenerate}
                  isGenerating={isGenerating}
                  validationError={validationError}
                  inputRef={topicInputRef}
                />

                <ScriptEditorPanel
                  project={currentProject}
                  onUpdateSubtitle={handleUpdateSubtitle}
                  onChangeMusicPreset={handleChangeMusicPreset}
                  onJumpToTime={(sec) => setSeekRequestSec(sec)}
                />
              </div>

              <div className="lg:col-span-5 lg:sticky lg:top-20">
                <ReelPreviewPlayer
                  project={currentProject}
                  includeMusic={includeMusic}
                  onToggleMusic={setIncludeMusic}
                  seekRequestSec={seekRequestSec}
                  onClearSeekRequest={() => setSeekRequestSec(null)}
                  onSaveProject={handleSaveProject}
                  isSaved={isCurrentSaved}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'biblioteca' && (
          <SavedReelsView
            projects={savedProjects}
            onLoadProject={handleLoadProject}
            onDeleteProject={handleDeleteProject}
            onGoToStudio={() => setActiveTab('estudio')}
          />
        )}

        {activeTab === 'flutter' && <FlutterBlueprintView />}
      </main>
    </div>
  );
}
