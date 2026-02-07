import { useState, useEffect } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export function useAudioDevices() {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the browser and mediaDevices is available
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      console.warn('MediaDevices API not available. This may require HTTPS or a secure context.');
      setLoading(false);
      return;
    }

    const loadDevices = async () => {
      try {
        // Request permission to access devices
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream

        // Get all devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const inputs: AudioDevice[] = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
            kind: 'audioinput' as const,
          }));

        const outputs: AudioDevice[] = devices
          .filter(device => device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`,
            kind: 'audiooutput' as const,
          }));

        setInputDevices(inputs);
        setOutputDevices(outputs);
        setLoading(false);
      } catch (error) {
        console.error('Error loading audio devices:', error);
        // Set empty arrays on error so UI can still render
        setInputDevices([]);
        setOutputDevices([]);
        setLoading(false);
      }
    };

    loadDevices();

    // Listen for device changes (only if mediaDevices exists)
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', loadDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
      };
    }
  }, []);

  return { inputDevices, outputDevices, loading };
}
