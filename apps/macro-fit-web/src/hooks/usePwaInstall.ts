import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detectar si ya está en modo Standalone (PWA instalada y ejecutándose en pantalla completa)
    const checkStandalone = () => {
      const matchMediaStandalone =
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
          ? window.matchMedia('(display-mode: standalone)').matches
          : false;
      const navStandalone =
        typeof window !== 'undefined' &&
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const refStandalone =
        typeof document !== 'undefined' &&
        document.referrer &&
        document.referrer.includes('android-app://');

      const isStandaloneMode = Boolean(matchMediaStandalone || navStandalone || refStandalone);
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // 2. Detectar si el dispositivo es iOS (iPhone / iPad / iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isAppleDevice);

    // 3. Capturar el evento estándar del navegador (Android Chrome, Edge, Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Capturar cuando la app se instala con éxito
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('MacroFit PWA fue instalada exitosamente en el dispositivo.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Función para disparar la instalación nativa o abrir la guía de iOS
  const promptInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos && !isStandalone) {
      setShowIosGuide(true);
    }
  };

  return {
    canInstall: (deferredPrompt !== null || (isIos && !isStandalone)) && !isInstalled,
    isInstalled,
    isStandalone,
    isIos,
    showIosGuide,
    setShowIosGuide,
    promptInstall,
  };
}
