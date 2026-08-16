// frontend/src/pages/Settings.jsx
// Settings module — tabbed preferences for theme, notifications, security, and workspace.
// Used in: App.jsx /settings route.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Palette, Bell, Shield, Users, Save, Moon, Sun, BellRing } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import { pageVariants, containerVariants, itemVariants } from '../animations/variants';
import { toast } from '../components/ui/toastStore';

const SETTINGS_TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'workspace', label: 'Workspace', icon: Users },
];

function Settings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { mode, toggle } = useThemeStore();
  const [activeTab, setActiveTab] = useState('appearance');
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState(() => JSON.parse(localStorage.getItem('crm-preferences') || '{"email":true,"inApp":true,"digest":false}'));

  const handleToggleTheme = () => {
    toggle();
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('crm-preferences', JSON.stringify(preferences));
    setSaving(false);
    toast.success('Preferences saved successfully.');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appearance':
        return (
          <motion.div variants={itemVariants} className="flex flex-col gap-5">
            <div className="flex items-center justify-between p-4 rounded-2xl glass-deep">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-primary/10">
                  {mode === 'dark' ? <Moon size={18} className="text-accent-glow" /> : <Sun size={18} className="text-accent-secondary-glow" />}
                </div>
                <div>
                  <span className="block text-sm font-semibold text-text-primary">Theme</span>
                  <span className="text-xs text-text-secondary">Switch between dark and light mode.</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleToggleTheme}>
                {mode === 'dark' ? 'Light' : 'Dark'}
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl glass-deep">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-success/10">
                  <BellRing size={18} className="text-success" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-text-primary">System theme</span>
                  <span className="text-xs text-text-secondary/60">Currently: {mode === 'dark' ? 'Dark' : 'Light'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 rounded-2xl glass-deep">
              <div>
                <span className="block text-sm font-semibold text-text-primary">Email notifications</span>
                <span className="text-xs text-text-secondary">Receive emails for deal updates and mentions.</span>
              </div>
              <label className="relative inline-flex h-5 w-9 items-center rounded-full">
                <input type="checkbox" checked={preferences.email} onChange={(e) => setPreferences((p) => ({ ...p, email: e.target.checked }))} className="peer sr-only" aria-label="Email notifications" />
                <span className="peer inline-block h-5 w-9 rounded-full bg-accent-primary after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:translate-x-[18px] peer-checked:bg-accent-highlight" />
              </label>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl glass-deep">
              <div>
                <span className="block text-sm font-semibold text-text-primary">In-app alerts</span>
                <span className="text-xs text-text-secondary">Show toast notifications in the browser.</span>
              </div>
              <label className="relative inline-flex h-5 w-9 items-center rounded-full">
                <input type="checkbox" checked={preferences.inApp} onChange={(e) => setPreferences((p) => ({ ...p, inApp: e.target.checked }))} className="peer sr-only" aria-label="In-app alerts" />
                <span className="peer inline-block h-5 w-9 rounded-full bg-accent-primary after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:translate-x-[18px] peer-checked:bg-accent-highlight" />
              </label>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl glass-deep">
              <div>
                <span className="block text-sm font-semibold text-text-primary">Daily digest</span>
                <span className="text-xs text-text-secondary">A summary email of your pipeline each morning.</span>
              </div>
              <label className="relative inline-flex h-5 w-9 items-center rounded-full">
                <input type="checkbox" checked={preferences.digest} onChange={(e) => setPreferences((p) => ({ ...p, digest: e.target.checked }))} className="peer sr-only" aria-label="Daily digest" />
                <span className="peer inline-block h-5 w-9 rounded-full bg-overlay/30 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:translate-x-[18px] peer-checked:bg-accent-primary" />
              </label>
            </div>
          </motion.div>
        );
      case 'security':
        return (
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl glass-deep flex flex-col gap-3">
              <span className="text-sm font-semibold text-text-primary">Password</span>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                 <Shield size={14} />
                 <span>Password changes require a secure reset flow.</span>
               </div>
               <Button variant="ghost" size="sm" onClick={() => navigate('/forgot-password')}>Change password</Button>
             </div>
            <div className="p-4 rounded-2xl glass-deep border border-danger/20">
              <span className="text-sm font-semibold text-danger">Delete account</span>
              <span className="text-xs text-text-secondary/60">Permanently delete your account and all data.</span>
            </div>
          </motion.div>
        );
      case 'workspace':
        return (
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl glass-deep">
              <span className="block text-xs text-text-tertiary uppercase tracking-wider">Current User</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-highlight flex items-center justify-center text-white font-bold text-xs">
                    {user?.name?.split(' ').map((n) => n[0]).join('') || 'U'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-bg-surface" />
                </div>
                <div>
                  <span className="block text-sm font-semibold text-text-primary">{user?.name || '—'}</span>
                  <span className="text-xs text-text-secondary">{user?.email || '—'}</span>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-2xl glass-deep">
              <span className="block text-xs text-text-tertiary uppercase tracking-wider mb-2">Roles</span>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                user?.role === 'admin' ? 'bg-accent-primary/10 text-accent-glow border-accent-primary/20'
                  : user?.role === 'team_lead' ? 'bg-accent-highlight/10 text-accent-highlight border-accent-highlight/20'
                  : 'bg-overlay/5 text-text-secondary border-overlay/10'
              }`}>
                {user?.role?.replace('_', ' ') || '—'}
              </span>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        icon={SettingsIcon}
        subtitle="Configure your preferences and workspace."
        badge="Preferences"
        accent="#8B5CF6"
        actions={
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab nav */}
        <Panel title="Tabs" icon={SettingsIcon} accent="#8B5CF6" className="!pb-1 lg:self-start">
          <div className="flex flex-col gap-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium
                    transition-all duration-200 cursor-pointer outline-none
                    ${isActive
                      ? 'bg-accent-primary/15 text-accent-glow border border-accent-primary/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-overlay/5'}
                  `}
                >
                  <Icon size={15} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </Panel>

        {/* Tab content */}
        <div className="lg:col-span-3">
          <Panel accent="#8B5CF6">
            <div className="p-1 border-b border-overlay/5">
              <h3 className="text-text-primary font-display font-semibold text-sm px-4 py-2.5">
                {SETTINGS_TABS.find((t) => t.id === activeTab)?.label}
              </h3>
            </div>
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </Panel>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Settings;
