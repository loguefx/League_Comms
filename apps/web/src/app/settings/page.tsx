'use client';

import { useEffect, useState } from 'react';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { useAudioSettings } from '@/hooks/useAudioSettings';

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

    fetch('http://localhost:4000/auth/riot/status', {
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
    window.location.href = 'http://localhost:4000/auth/riot/start';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Riot Account Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Riot Account</h2>
        {status?.connected ? (
          <div>
            <p className="text-green-500 mb-2">✓ Connected</p>
            <p>Riot ID: {status.riotId}</p>
            <p>Region: {status.region}</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-4">Not connected</p>
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Connect Riot Account
            </button>
          </div>
        )}
      </div>

      {/* Audio Settings Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Audio Settings</h2>
        
        {/* Input Device */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Microphone (Input Device)</label>
          {devicesLoading ? (
            <p className="text-gray-500">Loading devices...</p>
          ) : (
            <select
              value={settings.inputDeviceId || ''}
              onChange={(e) => updateSettings({ inputDeviceId: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Default Microphone</option>
              {inputDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Output Device */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Speaker (Output Device)</label>
          {devicesLoading ? (
            <p className="text-gray-500">Loading devices...</p>
          ) : (
            <select
              value={settings.outputDeviceId || ''}
              onChange={(e) => updateSettings({ outputDeviceId: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Default Speaker</option>
              {outputDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Auto Join Voice */}
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.autoJoinVoice}
              onChange={(e) => updateSettings({ autoJoinVoice: e.target.checked })}
              className="w-4 h-4"
            />
            <span>Auto-join voice when game starts</span>
          </label>
        </div>

        {/* Push to Talk */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.pushToTalk}
              onChange={(e) => updateSettings({ pushToTalk: e.target.checked })}
              className="w-4 h-4"
            />
            <span>Push to Talk</span>
          </label>
          {settings.pushToTalk && (
            <input
              type="text"
              placeholder="Keybind (e.g., V)"
              value={settings.pushToTalkKey || ''}
              onChange={(e) => updateSettings({ pushToTalkKey: e.target.value })}
              className="mt-2 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          )}
        </div>
      </div>
    </div>
  );
}
