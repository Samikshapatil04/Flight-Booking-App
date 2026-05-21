'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div className="glass-strong rounded-2xl p-4 border border-sky-500/30 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
            <span className="text-lg">✈️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Install SkyWave</p>
            <p className="text-xs text-sky-300/60 mt-0.5">
              Add to your home screen for a native app experience
            </p>
          </div>
          <button onClick={handleDismiss} className="text-sky-300/40 hover:text-sky-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleDismiss} className="flex-1 btn-secondary py-2 text-xs">
            Not now
          </button>
          <button onClick={handleInstall} className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
