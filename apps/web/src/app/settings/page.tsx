'use client';

import { useEffect, useState, useRef } from 'react';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useAudioSettings } from '@/hooks/useAudioSettings';
import { getApiUrl } from '@/utils/api';

// Keybind Capture Component
function KeybindCapture({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatKey = (key: string): string => {
    // Format common keys
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      'Alt': 'Alt',
      'Shift': 'Shift',
      'Enter': 'Enter',
      'Escape': 'Esc',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
    };

    if (keyMap[key]) {
      return keyMap[key];
    }

    // Remove "Key" prefix from keys like "KeyV" -> "V"
    if (key.startsWith('Key')) {
      return key.slice(3);
    }

    // Remove "Digit" prefix from numbers
    if (key.startsWith('Digit')) {
      return key.slice(5);
    }

    return key;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCapturing) return;

    e.preventDefault();
    e.stopPropagation();

    // Get the key
    let key = e.key;
    let keyCode = e.code;

    // Handle modifier keys
    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.metaKey) modifiers.push('Cmd');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    // Format the key
    const formattedKey = formatKey(keyCode || key);

    // Combine modifiers with key
    if (modifiers.length > 0) {
      onChange(`${modifiers.join('+')}+${formattedKey}`);
    } else {
      onChange(formattedKey);
    }

    setIsCapturing(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClick = () => {
    setIsCapturing(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleBlur = () => {
    setIsCapturing(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        readOnly
        value={isCapturing ? 'Press any key...' : (value || 'Not set')}
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-4 py-3 bg-[#0D121E] border rounded-lg text-white cursor-pointer transition ${
          isCapturing
            ? 'border-blue-500 ring-2 ring-blue-500/50'
            : value
            ? 'border-[#283D4D] hover:border-blue-500/50'
            : 'border-[#283D4D] hover:border-blue-500/50'
        }`}
        placeholder="Click to set keybind"
      />
      {value && !isCapturing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#78828C] hover:text-red-400 transition p-1"
          title="Clear keybind"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {isCapturing && (
        <div className="absolute -top-8 left-0 text-xs text-blue-400 font-medium">
          Press any key or key combination...
        </div>
      )}
    </div>
  );
}

interface RiotAccountStatus {
  connected: boolean;
  riotId?: string;
  region?: string;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<RiotAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { inputDevices, outputDevices, loading: devicesLoading } = useAudioDevices();
  const { settings, updateSettings } = useAudioSettings();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/auth/riot/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleConnect = () => {
    const apiUrl = getApiUrl();
    window.location.href = `${apiUrl}/auth/riot/start`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D121E]">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        {/* Riot Account Section */}
        <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded"></span>
            Riot Account
          </h2>
          {status?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Connected</span>
              </div>
              <div className="text-[#B4BEC8] space-y-1">
                <p><span className="text-[#78828C]">Riot ID:</span> {status.riotId || 'N/A'}</p>
                <p><span className="text-[#78828C]">Region:</span> {status.region || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#B4BEC8]">
                <svg className="w-5 h-5 text-[#78828C]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Not connected</span>
              </div>
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                Connect Riot Account
              </button>
            </div>
          )}
        </div>

        {/* Audio Settings Section */}
        <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-purple-500 rounded"></span>
            Audio Settings
          </h2>
          
          <div className="space-y-6">
            {/* Input Device */}
            <div>
              <label className="block text-sm font-medium text-[#B4BEC8] mb-2">
                Microphone (Input Device)
              </label>
              {devicesLoading ? (
                <div className="text-[#78828C] text-sm">Loading devices...</div>
              ) : inputDevices.length === 0 ? (
                <div className="text-[#78828C] text-sm bg-[#0D121E] border border-[#283D4D] rounded-lg px-4 py-3">
                  Audio devices require HTTPS or localhost. Using default device.
                </div>
              ) : (
                <select
                  value={settings.inputDeviceId || ''}
                  onChange={(e) => updateSettings({ inputDeviceId: e.target.value || null })}
                  className="w-full px-4 py-3 bg-[#0D121E] border border-[#283D4D] rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                >
                  <option value="">Default Microphone</option>
                  {inputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId} className="bg-[#0D121E]">
                      {device.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Output Device */}
            <div>
              <label className="block text-sm font-medium text-[#B4BEC8] mb-2">
                Speaker (Output Device)
              </label>
              {devicesLoading ? (
                <div className="text-[#78828C] text-sm">Loading devices...</div>
              ) : outputDevices.length === 0 ? (
                <div className="text-[#78828C] text-sm bg-[#0D121E] border border-[#283D4D] rounded-lg px-4 py-3">
                  Audio devices require HTTPS or localhost. Using default device.
                </div>
              ) : (
                <select
                  value={settings.outputDeviceId || ''}
                  onChange={(e) => updateSettings({ outputDeviceId: e.target.value || null })}
                  className="w-full px-4 py-3 bg-[#0D121E] border border-[#283D4D] rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                >
                  <option value="">Default Speaker</option>
                  {outputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId} className="bg-[#0D121E]">
                      {device.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Auto Join Voice */}
            <div className="flex items-center gap-3 p-4 bg-[#0D121E] border border-[#283D4D] rounded-lg">
              <input
                type="checkbox"
                id="autoJoin"
                checked={settings.autoJoinVoice}
                onChange={(e) => updateSettings({ autoJoinVoice: e.target.checked })}
                className="w-5 h-5 rounded border-[#283D4D] bg-[#161C2A] text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-[#161C2A] cursor-pointer"
              />
              <label htmlFor="autoJoin" className="text-[#B4BEC8] cursor-pointer flex-1">
                Auto-join voice when game starts
              </label>
            </div>

            {/* Push to Talk */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-[#0D121E] border border-[#283D4D] rounded-lg">
                <input
                  type="checkbox"
                  id="pushToTalk"
                  checked={settings.pushToTalk}
                  onChange={(e) => updateSettings({ pushToTalk: e.target.checked })}
                  className="w-5 h-5 rounded border-[#283D4D] bg-[#161C2A] text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-[#161C2A] cursor-pointer"
                />
                <label htmlFor="pushToTalk" className="text-[#B4BEC8] cursor-pointer flex-1">
                  Push to Talk
                </label>
              </div>
              {settings.pushToTalk && (
                <div>
                  <label className="block text-sm font-medium text-[#B4BEC8] mb-2">
                    Keybind
                  </label>
                  <KeybindCapture
                    value={settings.pushToTalkKey || ''}
                    onChange={(key) => updateSettings({ pushToTalkKey: key })}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
