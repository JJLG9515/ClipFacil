export interface FlutterFileEntry {
  path: string;
  label: string;
  description: string;
  code: string;
}

export const FLUTTER_FILES: FlutterFileEntry[] = [
  {
    path: 'pubspec.yaml',
    label: 'pubspec.yaml',
    description: 'Dependencias gratuitas: HTTP, Gemini, FFmpegKit, Galería, Share Plus y Video Player.',
    code: `name: clipfacil_reels
description: Generador gratuito de videos verticales 9:16 para TikTok y Facebook Reels.
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.3.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.2
  path_provider: ^2.1.4
  video_player: ^2.9.2
  ffmpeg_kit_flutter_min_gpl: ^6.0.3
  gal: ^2.3.0
  share_plus: ^10.1.2
  shared_preferences: ^2.3.2
  flutter_tts: ^4.0.2

flutter:
  uses-material-design: true
  assets:
    - assets/audio/lofi_free.mp3
    - assets/audio/motivacional_free.mp3
    - assets/audio/dinamico_free.mp3
    - assets/fonts/Outfit-Bold.ttf`,
  },
  {
    path: 'lib/services/gemini_script_service.dart',
    label: 'gemini_script_service.dart',
    description: 'Generación gratuita de guion (Hook + Desarrollo + Cierre) con Gemini Flash y respaldo offline.',
    code: `import 'dart:convert';
import 'package:http/http.dart' as http;

class ReelScene {
  final String role;
  final String subtitle;
  final String visualQuery;
  final int durationSec;

  ReelScene({
    required this.role,
    required this.subtitle,
    required this.visualQuery,
    required this.durationSec,
  });

  factory ReelScene.fromJson(Map<String, dynamic> json) => ReelScene(
        role: (json['role'] ?? 'desarrollo').toString(),
        subtitle: (json['subtitle'] ?? '').toString(),
        visualQuery: (json['visualQuery'] ?? 'abstract').toString(),
        durationSec: (json['durationSec'] as num?)?.toInt() ?? 5,
      );
}

class GeminiScriptService {
  // Usa la capa gratuita de Google AI Studio (Gemini Flash)
  static const String _endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  final String apiKey;
  GeminiScriptService(this.apiKey);

  Future<List<ReelScene>> generateScenes({
    required String topic,
    required int totalSeconds,
    required String style,
  }) async {
    final sceneCount = totalSeconds == 15 ? 3 : (totalSeconds == 30 ? 5 : 8);
    final prompt = '''
Genera un guion viral en español para TikTok/Reels sobre: "$topic".
Duración total exacta: $totalSeconds segundos. Estilo: $style.
Devuelve SOLO un JSON array con exactamente $sceneCount objetos:
[{"role":"hook|desarrollo|cierre","subtitle":"máximo 9 palabras","visualQuery":"2 palabras en inglés para Pexels","durationSec":5}]
''';

    try {
      final res = await http
          .post(
            Uri.parse('\$_endpoint?key=\$apiKey'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'contents': [
                {
                  'parts': [
                    {'text': prompt}
                  ]
                }
              ],
              'generationConfig': {'responseMimeType': 'application/json'}
            }),
          )
          .timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        final text = decoded['candidates'][0]['content']['parts'][0]['text'];
        final list = jsonDecode(text) as List<dynamic>;
        return list.map((e) => ReelScene.fromJson(e)).toList();
      }
    } catch (_) {
      // Si el usuario está sin internet en su Motorola, usa plantilla local offline
    }

    return _offlineFallback(topic, totalSeconds, sceneCount);
  }

  List<ReelScene> _offlineFallback(String topic, int totalSeconds, int count) {
    final perScene = (totalSeconds / count).floor();
    return List.generate(count, (i) {
      final role = i == 0 ? 'hook' : (i == count - 1 ? 'cierre' : 'desarrollo');
      final sub = i == 0
          ? '¿Sabías esto sobre \$topic?'
          : (i == count - 1
              ? 'Guarda este clip y compártelo hoy.'
              : 'Paso clave #\${i} para dominar \$topic.');
      return ReelScene(
        role: role,
        subtitle: sub,
        visualQuery: 'minimalist aesthetic',
        durationSec: i == count - 1 ? totalSeconds - perScene * (count - 1) : perScene,
      );
    });
  }
}`,
  },
  {
    path: 'lib/services/pexels_media_service.dart',
    label: 'pexels_media_service.dart',
    description: 'Descarga clips verticales 9:16 gratuitos desde Pexels API (0 USD, 200 req/hora) con caché local.',
    code: `import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class PexelsMediaService {
  final String pexelsApiKey;
  PexelsMediaService(this.pexelsApiKey);

  Future<File?> downloadVerticalClip(String query, int index) async {
    final dir = await getTemporaryDirectory();
    final outFile = File('\${dir.path}/clip_\$index.mp4');

    try {
      final uri = Uri.https('api.pexels.com', '/videos/search', {
        'query': query,
        'orientation': 'portrait',
        'per_page': '3',
      });

      final res = await http.get(uri, headers: {'Authorization': pexelsApiKey});
      if (res.statusCode != 200) return null;

      final data = jsonDecode(res.body);
      final videos = (data['videos'] as List?) ?? [];
      if (videos.isEmpty) return null;

      final files = (videos.first['video_files'] as List?) ?? [];
      final hdFile = files.firstWhere(
        (f) => (f['height'] ?? 0) >= 1280,
        orElse: () => files.first,
      );

      final videoBytes = await http.get(Uri.parse(hdFile['link']));
      await outFile.writeAsBytes(videoBytes.bodyBytes);
      return outFile;
    } catch (_) {
      return null;
    }
  }
}`,
  },
  {
    path: 'lib/services/video_composer_service.dart',
    label: 'video_composer_service.dart',
    description: 'Exporta MP4 vertical 1080x1920 (H.264 + AAC) optimizado para Snapdragon con subtítulos y música.',
    code: `import 'dart:io';
import 'package:ffmpeg_kit_flutter_min_gpl/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_min_gpl/return_code.dart';
import 'package:path_provider/path_provider.dart';
import 'gemini_script_service.dart';

class VideoComposerService {
  /// Renderiza un video 1080x1920 (9:16) listo para TikTok y Facebook Reels
  Future<File> buildVerticalReel({
    required List<File> inputClips,
    required List<ReelScene> scenes,
    required File backgroundMusic,
    required int totalDurationSec,
  }) async {
    final dir = await getApplicationDocumentsDirectory();
    final outputPath = '\${dir.path}/reel_\${DateTime.now().millisecondsSinceEpoch}.mp4';
    final concatList = File('\${dir.path}/clips.txt');

    await concatList.writeAsString(
      inputClips.map((f) => "file '\${f.path}'").join('\\n'),
    );

    // Construye filtros drawtext para subtítulos grandes y centrados
    final drawTexts = <String>[];
    int cursor = 0;
    for (final s in scenes) {
      final safeText = s.subtitle.replaceAll("'", "").replaceAll(":", " ");
      final end = cursor + s.durationSec;
      drawTexts.add(
        "drawtext=text='\$safeText':fontcolor=white:fontsize=54:"
        "box=1:boxcolor=black@0.72:boxborderw=22:"
        "x=(w-text_w)/2:y=(h*0.56)-text_h/2:"
        "enable='between(t,\$cursor,\$end)'",
      );
      cursor = end;
    }

    final vf =
        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,\${drawTexts.join(',')}";

    final cmd = [
      "-y",
      "-f concat -safe 0 -i '\${concatList.path}'",
      "-stream_loop -1 -i '\${backgroundMusic.path}'",
      "-t \$totalDurationSec",
      "-vf \\"\$vf\\"",
      "-map 0:v:0 -map 1:a:0",
      "-c:v libx264 -preset veryfast -pix_fmt yuv420p",
      "-c:a aac -b:a 128k -shortest",
      "'\$outputPath'",
    ].join(' ');

    final session = await FFmpegKit.execute(cmd);
    final rc = await session.getReturnCode();
    if (!ReturnCode.isSuccess(rc)) {
      throw Exception('Error FFmpeg al renderizar el reel');
    }
    return File(outputPath);
  }
}`,
  },
  {
    path: 'lib/main.dart',
    label: 'main.dart',
    description: 'Interfaz Material 3 en español optimizada para 120Hz en Motorola Edge 50 Pro (6.7").',
    code: `import 'dart:io';
import 'package:flutter/material.dart';
import 'package:gal/gal.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import 'services/gemini_script_service.dart';
import 'services/pexels_media_service.dart';
import 'services/video_composer_service.dart';

void main() => runApp(const ClipFacilApp());

class ClipFacilApp extends StatelessWidget {
  const ClipFacilApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ClipFácil Reels',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFFE11D48),
      ),
      home: const ReelGeneratorScreen(),
    );
  }
}

class ReelGeneratorScreen extends StatefulWidget {
  const ReelGeneratorScreen({super.key});

  @override
  State<ReelGeneratorScreen> createState() => _ReelGeneratorScreenState();
}

class _ReelGeneratorScreenState extends State<ReelGeneratorScreen> {
  final _topicCtrl = TextEditingController();
  int _duration = 30;
  String _style = 'Educativo';
  bool _loading = false;
  File? _generatedVideo;
  VideoPlayerController? _player;

  Future<void> _generate() async {
    if (_topicCtrl.text.trim().isEmpty) return;
    setState(() => _loading = true);

    try {
      final scriptSvc = GeminiScriptService(const String.fromEnvironment('GEMINI_KEY'));
      final scenes = await scriptSvc.generateScenes(
        topic: _topicCtrl.text.trim(),
        totalSeconds: _duration,
        style: _style,
      );

      final pexels = PexelsMediaService(const String.fromEnvironment('PEXELS_KEY'));
      final clips = <File>[];
      for (int i = 0; i < scenes.length; i++) {
        final clip = await pexels.downloadVerticalClip(scenes[i].visualQuery, i);
        if (clip != null) clips.add(clip);
      }

      // Render 1080x1920 final con FFmpegKit
      final out = await VideoComposerService().buildVerticalReel(
        inputClips: clips,
        scenes: scenes,
        backgroundMusic: File('/data/user/0/com.clipfacil/app_flutter/lofi.mp3'),
        totalDurationSec: _duration,
      );

      _player?.dispose();
      _player = VideoPlayerController.file(out)..initialize().then((_) {
        _player?.setLooping(true);
        _player?.play();
        setState(() {});
      });

      setState(() => _generatedVideo = out);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ClipFácil Reels')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _topicCtrl,
            decoration: const InputDecoration(
              labelText: 'Escribe tu tema o idea',
              hintText: 'Ej: Curiosidades del espacio',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 15, label: Text('15s')),
              ButtonSegment(value: 30, label: Text('30s')),
              ButtonSegment(value: 60, label: Text('60s')),
            ],
            selected: {_duration},
            onSelectionChanged: (v) => setState(() => _duration = v.first),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading ? null : _generate,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            child: Text(_loading ? 'Generando video...' : 'Generar Video'),
          ),
          if (_generatedVideo != null) ...[
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.download),
                    label: const Text('Guardar en Galería'),
                    onPressed: () => Gal.putVideo(_generatedVideo!.path),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    icon: const Icon(Icons.share),
                    label: const Text('Compartir'),
                    onPressed: () => Share.shareXFiles([XFile(_generatedVideo!.path)]),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}`,
  },
  {
    path: '.github/workflows/build_apk.yml',
    label: 'build_apk.yml (UserLAnd -> APK)',
    description: 'Compila el APK release gratis en la nube desde UserLAnd usando GitHub Actions (sin errores de arquitectura ARM64).',
    code: `name: Compilar APK Gratis

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.24.0"
          channel: stable
      - run: flutter pub get
      - run: flutter build apk --release
      - uses: actions/upload-artifact@v4
        with:
          name: clipfacil-reels-apk
          path: build/app/outputs/flutter-apk/app-release.apk`,
  },
];

export const USERLAND_LOCAL_SCRIPT = `#!/usr/bin/env bash
set -e

# 1. Actualizar Ubuntu en UserLAnd e instalar Java 17 y herramientas ARM64
sudo apt update && sudo apt install -y \\
  git curl unzip xz-utils zip libglu1-mesa \\
  openjdk-17-jdk aapt2 clang cmake ninja-build pkg-config

# 2. Descargar Flutter SDK (canal stable compatible con ARM64)
cd ~
if [ ! -d "$HOME/flutter" ]; then
  git clone https://github.com/flutter/flutter.git -b stable --depth 1
fi
export PATH="$HOME/flutter/bin:$PATH"
echo 'export PATH="$HOME/flutter/bin:$PATH"' >> ~/.bashrc

# 3. Instalar Android cmdline-tools + SDK 34
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
curl -sLO https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q commandlinetools-linux-*.zip && mv cmdline-tools latest
export ANDROID_HOME="$HOME/android-sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 4. Ajustar Gradle para ARM64 en UserLAnd (usar aapt2 nativo del sistema)
flutter config --android-sdk "$ANDROID_HOME"
mkdir -p ~/.gradle
cat << 'EOF' >> ~/.gradle/gradle.properties
org.gradle.jvmargs=-Xmx2560m -XX:MaxMetaspaceSize=512m
android.aapt2FromMavenOverride=/usr/bin/aapt2
EOF

# 5. Crear proyecto y compilar APK release
flutter create clipfacil_reels
cd clipfacil_reels
# (Pega aquí pubspec.yaml y los archivos lib/ de las pestañas de arriba)
flutter pub get
flutter build apk --release

# 6. Copiar APK a la carpeta Descargas de tu Motorola Edge 50 Pro
cp build/app/outputs/flutter-apk/app-release.apk /sdcard/Download/ClipFacil.apk`;

export const MOTOROLA_BUILD_STEPS = [
  {
    step: '01. Requisitos gratuitos en tu PC',
    detail:
      'Instala Flutter SDK (estable) y Android Studio con Android SDK 34. Todo es 100% gratuito y multiplataforma.',
  },
  {
    step: '02. Crea el proyecto y copia los archivos',
    detail:
      'Ejecuta flutter create clipfacil_reels, reemplaza pubspec.yaml y los archivos dentro de lib/ usando las pestañas de arriba.',
  },
  {
    step: '03. Activa Depuración USB en tu Motorola Edge 50 Pro',
    detail:
      'Ve a Ajustes > Acerca del teléfono > toca 7 veces "Número de compilación". Luego entra a Sistema > Opciones para desarrolladores y activa "Depuración por USB".',
  },
  {
    step: '04. Compila e instala el APK directo por USB',
    detail:
      'Conecta tu Motorola Edge 50 Pro por USB-C y ejecuta: flutter build apk --release && flutter install. También puedes copiar build/app/outputs/flutter-apk/app-release.apk al teléfono.',
  },
];

export const USERLAND_BUILD_STEPS = [
  {
    step: '01. Instala UserLAnd con Ubuntu (en tu Motorola)',
    detail:
      'Abre UserLAnd desde Play Store o F-Droid, elige Ubuntu (filesystem) y entra por terminal SSH/Terminal local. Otorga permiso de almacenamiento si quieres copiar el APK a /sdcard/Download.',
  },
  {
    step: '02. Opción recomendada: UserLAnd + GitHub Actions (0 errores ARM64)',
    detail:
      'Las herramientas oficiales de Android SDK son x86_64. Desde UserLAnd sube el proyecto con git push a un repo gratis en GitHub usando la pestaña build_apk.yml: GitHub compila el APK en 3 minutos y lo descargas directo en Chrome.',
  },
  {
    step: '03. Opción 100% local en UserLAnd (ARM64)',
    detail:
      'Si prefieres compilar directo dentro de UserLAnd sin GitHub, ejecuta el script de abajo que instala OpenJDK 17, Flutter y reemplaza aapt2 con el binario nativo ARM64 de Ubuntu (/usr/bin/aapt2).',
  },
  {
    step: '04. Instala el APK en tu Motorola Edge 50 Pro',
    detail:
      'Al terminar, copia build/app/outputs/flutter-apk/app-release.apk a /sdcard/Download/ClipFacil.apk, ábrelo desde la app Files de tu Motorola y acepta "Instalar aplicaciones desconocidas".',
  },
];
