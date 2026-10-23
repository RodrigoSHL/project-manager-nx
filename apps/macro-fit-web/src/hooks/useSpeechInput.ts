import { useEffect, useRef, useState } from 'react';

// Web Speech is still prefixed in some browsers and isn't part of TypeScript's DOM types.
interface RecognitionResult {
  readonly length: number;
  [index: number]: {
    readonly 0: { transcript: string };
    readonly isFinal: boolean;
  };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: RecognitionResult }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
function recognitionConstructor() {
  if (typeof window === 'undefined' || !window.isSecureContext)
    return undefined;
  const browser = window as SpeechWindow;
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed':
    'Permite el micrófono en tu navegador para dictar. También puedes escribir.',
  'service-not-allowed':
    'El navegador no permite el dictado. Puedes escribir o usar el micrófono del teclado.',
  'audio-capture':
    'No se encontró un micrófono disponible. Puedes escribir tu comida.',
  'no-speech':
    'No se escuchó una frase. Intenta nuevamente o escribe tu comida.',
  network:
    'Se perdió la conexión del dictado. Tu texto se conserva; puedes seguir escribiendo.',
  'language-not-supported':
    'El navegador no admite este idioma de dictado. Puedes usar el micrófono del teclado.',
};

export function useSpeechInput(onTranscript: (text: string) => void) {
  const [phase, setPhase] = useState<
    'idle' | 'starting' | 'listening' | 'stopping'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const release = () => {
    clearTimeout(stopTimer.current);
    const current = recognition.current;
    recognition.current = null;
    if (current) {
      current.onstart =
        current.onresult =
        current.onerror =
        current.onend =
          null;
      current.abort();
    }
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        release();
        setPhase('idle');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      release();
    };
  }, []);

  const start = () => {
    if (recognition.current) return;
    const Constructor = recognitionConstructor();
    if (!Constructor) return;
    setError(null);
    const current = new Constructor();
    recognition.current = current;
    current.lang = 'es-CL';
    current.continuous = true;
    current.interimResults = true;
    current.onstart = () => setPhase('listening');
    current.onresult = (event) => {
      // Rebuild this session's transcript: interim results replace rather than duplicate words.
      const parts: string[] = [];
      for (let i = 0; i < event.results.length; i++)
        parts.push(event.results[i][0].transcript);
      onTranscriptRef.current(parts.join(' ').trim());
    };
    current.onerror = (event) => {
      if (event.error !== 'aborted') {
        setError(
          ERROR_MESSAGES[event.error] ??
            'No se pudo completar el dictado. Puedes continuar escribiendo.'
        );
      }
      release();
      setPhase('idle');
    };
    current.onend = () => {
      release();
      setPhase('idle');
    };
    setPhase('starting');
    try {
      current.start();
    } catch {
      release();
      setPhase('idle');
      setError(
        'No se pudo iniciar el micrófono. Puedes continuar escribiendo.'
      );
    }
  };

  const stop = () => {
    if (!recognition.current) return;
    setPhase('stopping');
    // Give the engine time to emit its final words before enabling analysis.
    stopTimer.current = setTimeout(() => {
      release();
      setPhase('idle');
    }, 3000);
    try {
      recognition.current.stop();
    } catch {
      release();
      setPhase('idle');
    }
  };

  return {
    supported: Boolean(recognitionConstructor()),
    phase,
    error,
    start,
    stop,
  };
}
