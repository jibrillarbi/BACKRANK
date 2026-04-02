import { useState } from 'react';
import { Settings, User, Bell, Lock, Trash2, Upload, Check, X } from 'lucide-react';

type Section = 'profile' | 'preferences' | 'notifications' | 'account';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile state
  const [username, setUsername] = useState('TradingMaster92');
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [bio, setBio] = useState('📈 Algo trader | Strategy backtest enthusiast | Always learning');
  const [avatar, setAvatar] = useState('👤');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Preferences state
  const [defaultAsset, setDefaultAsset] = useState('AAPL');
  const [defaultTimeframe, setDefaultTimeframe] = useState('1D');
  const [defaultSL, setDefaultSL] = useState(1);
  const [defaultTP, setDefaultTP] = useState(2);

  // Notifications state
  const [notifications, setNotifications] = useState({
    newFollowers: true,
    votes: true,
    comments: true,
    replies: true,
    clones: true
  });

  // Account state
  const [email, setEmail] = useState('trader@example.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Handlers
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    // Simulate availability check
    setUsernameAvailable(!value.includes('admin'));
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings size={32} className="text-blue-500" />
            <h1 className="text-4xl font-bold">Settings</h1>
          </div>
          <p className="text-base-content/70">Manage your profile, preferences, and account settings.</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-48">
            <div className="bg-base-200 border border-base-300 rounded-xl overflow-hidden sticky top-8">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'preferences', label: 'Preferences', icon: Settings },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'account', label: 'Account', icon: Lock }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id as Section)}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors border-l-4 ${
                    activeSection === id
                      ? 'bg-base-300 border-l-blue-500 text-blue-400'
                      : 'border-l-transparent text-base-content/70 hover:bg-base-300/50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="bg-base-200 border border-base-300 rounded-xl p-8 max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div>
                    <label className="block text-sm font-semibold mb-4">Avatar</label>
                    <div className="flex items-end gap-6">
                      <div className="text-6xl">{avatar}</div>
                      <div>
                        <label htmlFor="avatar-upload" className="flex items-center gap-2 px-4 py-2 bg-base-300 hover:bg-base-300 rounded-lg cursor-pointer transition-colors">
                          <Upload size={16} />
                          Upload Image
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        <p className="text-xs text-base-content/60 mt-2">or paste emoji above</p>
                      </div>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Username</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        className="w-full px-4 py-2 bg-base-300 border border-base-300 rounded-lg text-base-content focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <div className="absolute right-3 top-3">
                        {usernameAvailable ? (
                          <Check size={18} className="text-emerald-400" />
                        ) : (
                          <X size={18} className="text-red-400" />
                        )}
                      </div>
                    </div>
                    {!usernameAvailable && (
                      <p className="text-xs text-red-400 mt-1">Username not available</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the community about yourself..."
                      rows={4}
                      maxLength={160}
                      className="w-full px-4 py-2 bg-base-300 border border-base-300 rounded-lg text-base-content placeholder-base-content/50 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-base-content/60 mt-1">{bio.length}/160</p>
                  </div>

                  {/* Preview */}
                  <div className="pt-6 border-t border-base-300">
                    <p className="text-sm font-semibold mb-4">Preview</p>
                    <div className="bg-base-300/50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-4xl">{avatar}</div>
                        <div>
                          <p className="font-semibold">{username}</p>
                          <p className="text-sm text-base-content/70">{bio}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-3">
                    <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors">
                      Save Changes
                    </button>
                    <button className="px-6 py-2 border border-base-300 hover:bg-base-300 rounded-lg font-semibold transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="bg-base-200 border border-base-300 rounded-xl p-8 max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">Default Backtest Parameters</h2>

                <p className="text-base-content/70 mb-6">
                  Set your preferred default values to speed up backtesting. You can always change these when running a backtest.
                </p>

                <div className="space-y-6">
                  {/* Default Asset */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Default Asset</label>
                    <select
                      value={defaultAsset}
                      onChange={(e) => setDefaultAsset(e.target.value)}
                      className="w-full px-4 py-2 bg-base-300 border border-base-300 rounded-lg text-base-content focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option>AAPL</option>
                      <option>MSFT</option>
                      <option>NVDA</option>
                      <option>TSLA</option>
                      <option>SPY</option>
                      <option>BTC</option>
                      <option>ETH</option>
                    </select>
                  </div>

                  {/* Default Timeframe */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Default Timeframe</label>
                    <select
                      value={defaultTimeframe}
                      onChange={(e) => setDefaultTimeframe(e.target.value)}
                      className="w-full px-4 py-2 bg-base-300 border border-base-300 rounded-lg text-base-content focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option>1M</option>
                      <option>5M</option>
                      <option>15M</option>
                      <option>1H</option>
                      <option>4H</option>
                      <option>1D</option>
                    </select>
                  </div>

                  {/* Stop Loss */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Default Stop Loss: {defaultSL}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={defaultSL}
                      onChange={(e) => setDefaultSL(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Take Profit */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Default Take Profit: {defaultTP}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={defaultTP}
                      onChange={(e) => setDefaultTP(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex gap-3 pt-6 border-t border-base-300">
                    <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors">
                      Save Preferences
                    </button>
                    <button className="px-6 py-2 border border-base-300 hover:bg-base-300 rounded-lg font-semibold transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="bg-base-200 border border-base-300 rounded-xl p-8 max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

                <p className="text-base-content/70 mb-8">
                  Control which notifications you receive via email and in-app alerts.
                </p>

                <div className="space-y-4">
                  {[
                    { key: 'newFollowers', label: 'New Followers', description: 'When someone follows your profile' },
                    { key: 'votes', label: 'Votes on Your Posts', description: 'When someone upvotes or downvotes your strategy' },
                    { key: 'comments', label: 'Comments on Your Posts', description: 'When someone comments on your strategy' },
                    { key: 'replies', label: 'Replies to Your Comments', description: 'When someone replies to your comment' },
                    { key: 'clones', label: 'Strategy Clones', description: 'When someone clones your strategy' }
                  ].map(({ key, label, description }) => (
                    <label
                      key={key}
                      className="flex items-center gap-4 p-4 bg-base-300/50 rounded-lg hover:bg-base-300 transition-colors cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={notifications[key as keyof typeof notifications]}
                        onChange={() => toggleNotification(key as keyof typeof notifications)}
                        className="w-5 h-5 rounded bg-base-300 border-base-300/50 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-semibold group-hover:text-blue-400 transition-colors">{label}</p>
                        <p className="text-sm text-base-content/60">{description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-base-300">
                  <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors">
                    Save Preferences
                  </button>
                  <button className="px-6 py-2 border border-base-300 hover:bg-base-300 rounded-lg font-semibold transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="bg-base-200 border border-base-300 rounded-xl p-8 max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

                <div className="space-y-8">
                  {/* Change Email */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Email Address</h3>
                    <div className="bg-base-300/50 rounded-lg p-4 mb-4">
                      <p className="text-base-content">{email}</p>
                    </div>
                    <button className="px-6 py-2 bg-base-300 hover:bg-base-300 rounded-lg font-semibold transition-colors">
                      Change Email
                    </button>
                  </div>

                  {/* Change Password */}
                  <div className="border-t border-base-300 pt-8">
                    <h3 className="text-lg font-semibold mb-4">Password</h3>

                    {!showPasswordChange ? (
                      <button
                        onClick={() => setShowPasswordChange(true)}
                        className="px-6 py-2 bg-base-300 hover:bg-base-300 rounded-lg font-semibold transition-colors"
                      >
                        Change Password
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-base-300 border border-base-300 rounded-lg text-base-content focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-base-300 border border-base-300 rounded-lg text-base-content focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-base-300 border border-base-300 rounded-lg text-base-content focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors">
                            Update Password
                          </button>
                          <button
                            onClick={() => setShowPasswordChange(false)}
                            className="px-6 py-2 border border-base-300 hover:bg-base-300 rounded-lg font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Danger Zone */}
                  <div className="border-t border-base-300 pt-8">
                    <h3 className="text-lg font-semibold mb-2 text-red-400">Danger Zone</h3>
                    <p className="text-sm text-base-content/70 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg font-semibold transition-colors"
                    >
                      <Trash2 size={18} />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-base-200 border border-base-300 rounded-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-red-400 mb-2">Delete Account?</h2>
              <p className="text-base-content/70 mb-6">
                This will permanently delete your account and all your data. This action cannot be undone.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors"
                >
                  Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full px-6 py-2 border border-base-300 hover:bg-base-300 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
