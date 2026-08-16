// frontend/src/pages/Profile.jsx
// Profile module — user profile view/editor with avatar, role chip, editable fields,
// and an inline change-password flow backed by /auth/change-password.
// Used in: App.jsx /profile route.

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Edit3, Save, Lock, Phone, Briefcase, Building2, AlignLeft, Camera, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Avatar from '../components/common/Avatar';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import { pageVariants, containerVariants, itemVariants } from '../animations/variants';
import { formatDate } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import { toast } from '../components/ui/toastStore';

function Profile() {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuthStore();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    department: user?.department || '',
    company: user?.company || '',
    timezone: user?.timezone || '',
  });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      department: user?.department || '',
      company: user?.company || '',
      timezone: user?.timezone || '',
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required.');
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      department: formData.department,
      company: formData.company,
      timezone: formData.timezone,
    });
    if (result.success) {
      setIsEditing(false);
      toast.success('Profile updated successfully.');
    } else {
      toast.error(result.message);
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }

    setUploadingAvatar(true);
    const result = await uploadAvatar(file);
    if (result.success) {
      toast.success('Avatar updated successfully.');
    } else {
      toast.error(result.message);
    }
    setUploadingAvatar(false);
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar_url) return;
    setRemovingAvatar(true);
    const result = await removeAvatar();
    if (result.success) {
      toast.success('Avatar removed.');
    } else {
      toast.error(result.message);
    }
    setRemovingAvatar(false);
  };

  const handleChangePassword = async () => {
    if (!password.currentPassword || !password.newPassword) {
      toast.error('Please fill in the current and new password.');
      return;
    }
    if (password.newPassword.length < 6 || !/[A-Za-z]/.test(password.newPassword) || !/\d/.test(password.newPassword)) {
      toast.error('New password must be at least 6 characters and include a letter and a number.');
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      toast.success(res.data?.message || 'Password updated successfully.');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    }
    setChangingPassword(false);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        icon={User}
        subtitle="Manage your personal information and preferences."
        badge="Account"
        accent="#8B5CF6"
        actions={
          isEditing
            ? <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                <Save size={14} />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            : <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 size={14} />
                Edit
              </Button>
        }
      />

      <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar + role card */}
        <motion.div variants={itemVariants} className="lg:col-span-1 lg:self-start">
          <Panel title="Profile" icon={User} accent="#8B5CF6">
            <motion.div whileHover={{ scale: 1.02 }} className="relative flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar
                  name={user?.name || 'U'}
                  role={user?.role}
                  src={resolveMediaUrl(user?.avatar_url)}
                  size={80}
                  showStatus
                  isOnline
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  aria-label="Change avatar"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-br from-accent-primary to-accent-highlight text-white shadow-[0_0_12px_rgba(124,58,237,0.6)] hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              {uploadingAvatar && (
                <span className="text-xs text-text-tertiary animate-pulse">Uploading avatar...</span>
              )}
              {user?.avatar_url && !uploadingAvatar && (
                <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} disabled={removingAvatar} className="!mt-1">
                  {removingAvatar ? 'Removing...' : 'Remove Avatar'}
                </Button>
              )}
              <div className="text-center">
                <span className="block text-lg font-display font-bold text-text-primary">{user?.name || '—'}</span>
                <span className="text-xs text-text-secondary/60">{user?.email}</span>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                user?.role === 'admin' ? 'bg-accent-primary/10 text-accent-glow border-accent-primary/20'
                  : user?.role === 'team_lead' ? 'bg-accent-highlight/10 text-accent-highlight border-accent-highlight/20'
                  : 'bg-overlay/5 text-text-secondary border-overlay/10'
              }`}>
                <Shield size={10} />
                {user?.role?.replace('_', ' ') || '—'}
              </span>
            </motion.div>
          </Panel>
        </motion.div>

        {/* Editable fields */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col gap-6">
          <Panel title="Account Details" icon={Edit3} accent="#3B82F6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col gap-4"
            >
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                error={!formData.name ? 'Name is required' : null}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={!isEditing} icon={Mail} />
                <Input label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={!isEditing} icon={Phone} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Department" name="department" value={formData.department} onChange={handleChange} disabled={!isEditing} icon={Briefcase} />
                <Input label="Company" name="company" value={formData.company} onChange={handleChange} disabled={!isEditing} icon={Building2} />
              </div>
              <Input label="Timezone" name="timezone" value={formData.timezone} onChange={handleChange} disabled={!isEditing} icon={Clock} />
              <div>
                <span className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5"><AlignLeft size={12} /> Bio</span>
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="A short bio..."
                  className="w-full rounded-xl glass-deep px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-primary/40 disabled:opacity-60 resize-none"
                />
              </div>
            </motion.div>
          </Panel>

          <Panel title="Security" icon={Lock} accent="#F43F5E">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Current Password" name="currentPassword" type="password" value={password.currentPassword} onChange={handlePasswordChange} icon={Lock} autoComplete="current-password" />
                <Input label="New Password" name="newPassword" type="password" value={password.newPassword} onChange={handlePasswordChange} icon={Lock} autoComplete="new-password" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Confirm New Password" name="confirmPassword" type="password" value={password.confirmPassword} onChange={handlePasswordChange} icon={Lock} autoComplete="new-password" />
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl glass-deep">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-text-tertiary" />
                  <div>
                    <span className="block text-sm font-semibold text-text-primary">Account created</span>
                    <span className="text-xs text-text-secondary/60">{formatDate(user?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Profile;
