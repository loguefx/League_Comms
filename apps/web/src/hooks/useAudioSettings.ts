import { useState, useEffect } from 'react';

export interface AudioSettings {
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  autoJoinVoice: boolean;
  pushToTalk: boolean;
  pushToTalkKey?: string;
}

const STORAGE_KEY = 'league_voice_audio_settings';

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    if (typeof window === 'undefined') {
      return {
        inputDeviceId: null,
        outputDeviceId: null,
        autoJoinVoice: true,
        pushToTalk: false,
      };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Invalid JSON, use defaults
      }
    }

    return {
      inputDeviceId: null,
      outputDeviceId: null,
      autoJoinVoice: true,
      pushToTalk: false,
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AudioSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
