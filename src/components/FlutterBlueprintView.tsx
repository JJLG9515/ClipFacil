import { Check, Copy, Smartphone, Terminal } from 'lucide-react';
import { useState } from 'react';
import {
  FLUTTER_FILES,
  MOTOROLA_BUILD_STEPS,
  USERLAND_BUILD_STEPS,
  USERLAND_LOCAL_SCRIPT,
} from '../data/flutterBlueprint';

export function FlutterBlueprintView() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [buildTarget, setBuildTarget] = useState<'userland' | 'pc'>('userland');
  const [copiedScript, setCopiedScript] = useState(false);

  const activeFile = FLUTTER_FILES[selectedIdx];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopiedPath(activeFile.path);
      window.setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(USERLAND_LOCAL_SCRIPT);
      setCopiedScript(true);
      window.setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const steps =
    buildTarget === 'userland' ? USERLAND_BUILD_STEPS : MOTOROLA_BUILD_STEPS;

  return (
    <section aria-labelledby="flutter-heading" className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
        <div className="max-w-3xl">
          <h1
            id="flutter-heading"
            className="font-display text-2xl md:text-3xl font-bold text-slate-900"
          >
            Arquitectura Flutter y APK para Motorola Edge 50 Pro
          </h1>
          <p className="text-base text-slate-600 mt-2 leading-relaxed">
            Además de usar esta aplicación directamente desde Chrome en tu teléfono o instalarla como app web, aquí tienes el proyecto nativo completo en Flutter 100% gratuito para compilar tu APK desde UserLAnd o PC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Por qué Flutter + FFmpegKit
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Renderiza la interfaz fluida a 120Hz en la pantalla pOLED de 6.7 pulgadas del Motorola Edge 50 Pro y usa aceleración del procesador Snapdragon para exportar MP4 1080x1920 sin marcas de agua ni pagos.
            </p>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              APIs y recursos 100% gratuitos
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Guiones con la capa gratuita de Gemini Flash (y respaldo local offline), clips verticales con Pexels / Pixabay API (0 USD) y música libre de derechos empaquetada en assets.
            </p>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Salida lista para TikTok y Reels
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Video H.264 + AAC en relación 9:16 con subtítulos centrados en zona segura, guardado directo en la galería con Gal y hoja nativa de Android para compartir con un toque.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div
            role="tablist"
            aria-label="Archivos del proyecto Flutter"
            className="flex flex-wrap gap-2"
          >
            {FLUTTER_FILES.map((file, idx) => (
              <button
                key={file.path}
                type="button"
                role="tab"
                aria-selected={selectedIdx === idx}
                onClick={() => setSelectedIdx(idx)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                  selectedIdx === idx
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {file.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            {copiedPath === activeFile.path ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Código copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>Copiar {activeFile.label}</span>
              </>
            )}
          </button>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="font-mono text-slate-800">{activeFile.path}</span>
          <span>{activeFile.description}</span>
        </div>

        <pre className="p-5 bg-slate-950 text-slate-100 text-xs md:text-sm font-mono overflow-x-auto leading-relaxed max-h-[460px]">
          <code>{activeFile.code}</code>
        </pre>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {buildTarget === 'userland' ? (
              <Terminal className="w-5 h-5 text-rose-600" aria-hidden="true" />
            ) : (
              <Smartphone className="w-5 h-5 text-rose-600" aria-hidden="true" />
            )}
            <h2 className="font-display text-lg font-semibold text-slate-900">
              {buildTarget === 'userland'
                ? 'Compilar el APK desde UserLAnd (en tu teléfono)'
                : 'Compilar desde PC por USB para Motorola Edge 50 Pro'}
            </h2>
          </div>

          <div
            role="group"
            aria-label="Método de compilación"
            className="inline-flex p-1 bg-slate-100 rounded-xl self-start"
          >
            <button
              type="button"
              onClick={() => setBuildTarget('userland')}
              aria-pressed={buildTarget === 'userland'}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                buildTarget === 'userland'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Desde UserLAnd
            </button>
            <button
              type="button"
              onClick={() => setBuildTarget('pc')}
              aria-pressed={buildTarget === 'pc'}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                buildTarget === 'pc'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Desde PC (USB)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((item) => (
            <div key={item.step} className="pt-4 border-t border-slate-100">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                {item.step}
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {buildTarget === 'userland' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs font-mono font-medium text-slate-800">
                setup_userland_arm64.sh
              </span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Script copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copiar script UserLAnd</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[340px]">
              <code>{USERLAND_LOCAL_SCRIPT}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
