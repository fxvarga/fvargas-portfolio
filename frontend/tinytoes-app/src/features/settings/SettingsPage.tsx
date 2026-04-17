import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, Smartphone, ShoppingBag, ChevronRight, Smile, Meh, Frown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useEntries } from '@/hooks/useEntries';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useThemeContext } from '@/components/ThemeProvider';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Input } from '@/components/Input';
import { InstallPrompt } from '@/components/InstallPrompt';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { exportData, importData } from '@/lib/exportImport';
import { clearAllData } from '@/lib/db';
import { themes } from '@/lib/themes';
import type { ThemeName, AgeRange } from '@/types';
import { AGE_RANGES, CORE_PRODUCT_SLUGS } from '@/types';

export function SettingsPage() {
  const navigate = useNavigate();
  const { session, logout, isAuthenticated } = useAuth();
  const { profile, updateProfile, resetProfile } = useProfile();
  const { stats, loadEntries } = useEntries();
  const { products: ownedProducts } = useEntitlements(isAuthenticated);
  const { isInstalled } = useInstallPrompt();
  const { theme, setTheme } = useThemeContext();

  const ownedCoreCount = ownedProducts.filter(p => CORE_PRODUCT_SLUGS.includes(p as any)).length;
  const ownsAll = ownedCoreCount >= CORE_PRODUCT_SLUGS.length;

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit profile state
  const [editName, setEditName] = useState(profile.name);
  const [editAge, setEditAge] = useState<AgeRange>(profile.ageRange);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportData();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus(null);

    try {
      const result = await importData(file);
      await updateProfile(result.profile);
      setTheme(result.profile.theme);
      await loadEntries();
      setImportStatus(`Imported ${result.entryCount} entries successfully.`);
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : 'Import failed.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = async () => {
    await updateProfile({ name: editName.trim(), ageRange: editAge });
    setShowEditProfile(false);
  };

  const handleReset = async () => {
    await clearAllData();
    await resetProfile();
    setShowResetConfirm(false);
    navigate('/onboarding', { replace: true });
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/claim', { replace: true });
  };

  return (
    <PageShell bottomPad="pb-8">
      <PageHeader title="Settings" backButton />

      <div className="px-4 pb-8 space-y-4">
        {/* Account info */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-theme-primary-light">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <Baby size={20} className="text-theme-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-theme-text">
                {profile.name}
              </p>
              <p className="text-sm text-theme-muted">
                {session?.email || 'Logged in'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => {
              setEditName(profile.name);
              setEditAge(profile.ageRange);
              setShowEditProfile(true);
            }}>
              Edit
            </Button>
          </div>
        </Card>

        {/* Theme selector */}
        <Card padding="md">
          <h3 className="text-sm font-semibold mb-3 text-theme-text">
            Theme
          </h3>
          <div className="flex gap-3">
            {(Object.keys(themes) as ThemeName[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  updateProfile({ theme: t });
                }}
                className={`flex-1 py-3 rounded-xl border-2 text-center transition-all duration-200 ${
                  theme === t ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: theme === t ? themes[t].primary : 'var(--color-accent)',
                  backgroundColor: themes[t].primaryLight,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-1.5"
                  style={{ backgroundColor: themes[t].primary }}
                />
                <span className="text-xs font-medium" style={{
                  color: theme === t ? themes[t].primary : 'var(--color-muted)',
                }}>
                  {t}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <Card padding="md">
          <h3 className="text-sm font-semibold mb-2 text-theme-text">
            Food Stats
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-theme-muted">Total entries</div>
            <div className="text-right font-medium text-theme-text">{stats.total}</div>
            <div className="text-theme-muted">Loved</div>
            <div className="text-right font-medium text-theme-text flex items-center justify-end gap-1">
              <Smile size={14} className="text-theme-primary" /> {stats.loved}
            </div>
            <div className="text-theme-muted">Not sure</div>
            <div className="text-right font-medium text-theme-text flex items-center justify-end gap-1">
              <Meh size={14} className="text-theme-muted" /> {stats.notSure}
            </div>
            <div className="text-theme-muted">No thanks</div>
            <div className="text-right font-medium text-theme-text flex items-center justify-end gap-1">
              <Frown size={14} className="text-theme-secondary" /> {stats.noThanks}
            </div>
          </div>
        </Card>

        {/* Data management */}
        <Card padding="md">
          <h3 className="text-sm font-semibold mb-3 text-theme-text">
            Data
          </h3>
          <div className="space-y-3">
            <Button variant="secondary" fullWidth onClick={handleExport} loading={isExporting}>
              Export Backup (JSON)
            </Button>
            <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>
              Import Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
            {importStatus && (
              <p className="text-sm text-center" style={{
                color: importStatus.includes('success') ? 'var(--color-primary)' : '#ef4444',
              }}>
                {importStatus}
              </p>
            )}
          </div>
        </Card>

        {/* Install App */}
        {!isInstalled && (
          <Card padding="md" hoverable onClick={() => setShowInstallPrompt(true)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-theme-primary-light">
                <Smartphone size={20} className="text-theme-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-theme-text">
                  Install App
                </p>
                <p className="text-xs text-theme-muted">
                  Add to your home screen for quick access
                </p>
              </div>
              <ChevronRight size={16} className="text-theme-muted" />
            </div>
          </Card>
        )}

        {/* Get More Modules */}
        {!ownsAll && (
          <Card padding="md" hoverable onClick={() => navigate('/store')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-theme-primary-light">
                <ShoppingBag size={20} className="text-theme-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-theme-text">
                  Get More Modules
                </p>
                <p className="text-xs text-theme-muted">
                  You own {ownedCoreCount} of {CORE_PRODUCT_SLUGS.length} — explore the store
                </p>
              </div>
              <ChevronRight size={16} className="text-theme-muted" />
            </div>
          </Card>
        )}

        {/* Danger zone */}
        <div className="pt-4 space-y-3">
          <Button variant="ghost" fullWidth onClick={() => setShowResetConfirm(true)}>
            <span className="text-red-500">Reset All Data</span>
          </Button>
          <Button variant="ghost" fullWidth onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* Version */}
        <p className="text-center text-xs pt-4 text-theme-muted">
          TinyToesAndUs v1.0.0
        </p>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile"
      >
        <div className="space-y-5">
          <Input
            label="Baby's Name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium mb-2 text-theme-text">
              Age Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AGE_RANGES.map(age => (
                <button
                  key={age}
                  onClick={() => setEditAge(age)}
                  className="py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: editAge === age ? 'var(--color-primary)' : 'var(--color-accent)',
                    backgroundColor: editAge === age ? 'var(--color-primary-light)' : 'transparent',
                    color: editAge === age ? 'var(--color-primary)' : 'var(--color-muted)',
                  }}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
          <Button fullWidth onClick={handleSaveProfile} disabled={!editName.trim()}>
            Save
          </Button>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset All Data"
      >
        <div className="space-y-4">
          <p className="text-sm text-theme-muted">
            This will permanently delete all entries and your profile. 
            You'll need to go through onboarding again. This cannot be undone.
          </p>
          <p className="text-sm font-medium text-red-500">
            We recommend exporting a backup first.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleReset}
              className="!bg-red-500"
              style={{ backgroundColor: '#ef4444' }}
            >
              Reset Everything
            </Button>
          </div>
        </div>
      </Modal>

      {/* Install Prompt */}
      <InstallPrompt
        isOpen={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
      />
    </PageShell>
  );
}
