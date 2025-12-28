'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Settings, Calendar, Mail, User, Check, X, Link as LinkIcon } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';

export default function SettingsPage() {
  const user = useUser();
  const searchParams = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Check if HR has Google Calendar connected
  useEffect(() => {
    checkGoogleConnection();
  }, []);

  // Show success/error messages from OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_connected') {
      alert('Google Calendar connected successfully!');
      checkGoogleConnection();
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard/settings');
    }

    if (error) {
      alert(`Google Calendar connection failed: ${error}`);
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams]);

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.connected);
        setGoogleEmail(data.google_email || '');
      }
    } catch (error) {
      console.error('Error checking Google connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/google/connect';
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? You will not be able to create Google Meet links until you reconnect.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setGoogleConnected(false);
        setGoogleEmail('');
        alert('Google Calendar disconnected successfully');
      } else {
        alert('Failed to disconnect Google Calendar');
      }
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      alert('Error disconnecting Google Calendar');
    } finally {
      setDisconnecting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Settings size={32} className="text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-base-content/70">Manage your account and integrations</p>
          </div>
        </div>

        {/* Account Information */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <User size={20} />
              Account Information
            </h2>
            <div className="divider mt-0"></div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-base-content/60" />
                  <span className="text-base-content/70">Name:</span>
                </div>
                <span className="font-semibold">{user.name || 'Not set'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-base-content/60" />
                  <span className="text-base-content/70">Email:</span>
                </div>
                <span className="font-semibold">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Google Calendar Integration */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title flex items-center gap-2">
              <Calendar size={20} />
              Google Calendar Integration
            </h2>
            <div className="divider mt-0"></div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : (
              <>
                <div className="alert alert-info mb-4">
                  <div>
                    <h3 className="font-semibold">Why connect Google Calendar?</h3>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Automatically create Google Meet links for interviews</li>
                      <li>• Interviews appear in your Google Calendar</li>
                      <li>• Get email reminders before interviews</li>
                      <li>• Sync across all your devices</li>
                    </ul>
                  </div>
                </div>

                {googleConnected ? (
                  <div className="space-y-4">
                    <div className="alert alert-success">
                      <Check size={24} />
                      <div>
                        <div className="font-semibold">Google Calendar Connected</div>
                        <div className="text-sm">Connected as: {googleEmail}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDisconnectGoogle}
                        disabled={disconnecting}
                        className="btn btn-error btn-outline"
                      >
                        {disconnecting ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <>
                            <X size={18} />
                            Disconnect Google Calendar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="alert alert-warning">
                      <X size={24} />
                      <div>
                        <div className="font-semibold">Google Calendar Not Connected</div>
                        <div className="text-sm">
                          Connect your Google account to enable automatic interview scheduling
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleConnectGoogle}
                      className="btn btn-primary gap-2"
                    >
                      <LinkIcon size={18} />
                      Connect Google Calendar
                    </button>

                    <div className="text-sm text-base-content/60">
                      <strong>Note:</strong> You'll be redirected to Google to authorize calendar access.
                      We only request permission to create events and meetings.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Future Settings Sections */}
        <div className="mt-6 text-center text-base-content/50 text-sm">
          More settings coming soon...
        </div>
      </div>
    </div>
  );
}
