import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, Settings, User, WalletCards } from 'lucide-react';
import { api } from '../api';
import { getCurrentUser, useLogout } from '../api/useAuth';

export default function SettingsPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const { mutate: logout, isPending: loggingOut } = useLogout();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profilePath = `/profile/${(currentUser?.username || username || 'user').toLowerCase()}`;

  const handleSave = async () => {
    const nextUsername = username.trim();
    if (!nextUsername) {
      setMessage({ type: 'error', text: 'Username cannot be empty.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.updateProfile({ username: nextUsername });
      localStorage.setItem('username', updated.username);
      localStorage.setItem('email', updated.email);
      localStorage.setItem('uid', updated.uid);
      setUsername(updated.username);
      setMessage({ type: 'success', text: 'Name updated.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update name.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/landing'),
    });
  };

  return (
    <div className="min-h-screen bg-black p-4 pt-24 md:p-8 md:pt-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-300">
            <Settings size={14} />
            Settings
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white">Account Settings</h1>
          <p className="mt-2 text-base-content/70">
            Manage the account details BackRank currently stores.
          </p>
        </header>

        {message && (
          <div className={`rounded-lg border px-4 py-3 ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <section className="rounded-xl border border-base-300 bg-base-100/40 p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <User size={20} className="text-blue-300" />
            Profile
          </h2>

          <div className="mt-6 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-base-content/80">Display Name</span>
              <input
                type="text"
                value={username}
                maxLength={40}
                onChange={(event) => setUsername(event.target.value)}
                className="input input-bordered w-full bg-base-200"
              />
            </label>

            <div className="rounded-lg bg-base-300/40 p-4">
              <p className="text-xs text-base-content/60">Email</p>
              <p className="mt-1 break-words font-semibold text-white">{currentUser?.email || 'Unknown'}</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || username.trim() === (currentUser?.username || '')}
              className="btn btn-primary w-full sm:w-auto"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Name'}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-base-300 bg-base-100/40 p-5 md:p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <WalletCards size={20} className="text-emerald-300" />
            Account Shortcuts
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button onClick={() => navigate(profilePath)} className="btn btn-outline">
              My Profile
            </button>
            <button onClick={() => navigate('/strategies')} className="btn btn-outline">
              My Strategies
            </button>
            <button onClick={() => navigate('/create-post')} className="btn btn-outline">
              Create Post
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-base-300 bg-base-100/40 p-5 md:p-6">
          <h2 className="text-xl font-semibold text-white">Session</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Sign out of this browser session.
          </p>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn mt-5 border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          >
            <LogOut size={16} />
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </section>
      </div>
    </div>
  );
}
