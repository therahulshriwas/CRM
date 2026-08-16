// frontend/src/pages/Admin.jsx
// Admin module — user management: directory, role assignment, suspend/activate,
// password reset, and force logout. Admin role only.
// Used in: App.jsx /app/admin route.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, UserPlus, KeyRound, LogOut, Ban, CheckCircle2, Search, RefreshCw, Pencil, Trash2, Upload, X, Phone, Building2, Briefcase, Globe } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/ui/Select';
import Modal from '../components/common/Modal';
import Avatar from '../components/common/Avatar';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import StatusState from '../components/ui/StatusState';
import { pageVariants, containerVariants, itemVariants } from '../animations/variants';
import { formatDate } from '../utils/format';
import { resolveMediaUrl } from '../utils/media';
import { toast } from '../components/ui/toastStore';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'agent', label: 'Agent' },
];

function Admin() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agent' });

  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', bio: '', department: '', timezone: '', company: '' });
  const editAvatarRef = useRef(null);

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      bio: u.bio || '',
      department: u.department || '',
      timezone: u.timezone || '',
      company: u.company || '',
    });
  };

  const closeEdit = () => {
    if (editing) return;
    setEditUser(null);
    setEditForm({ name: '', email: '', phone: '', bio: '', department: '', timezone: '', company: '' });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    if (!editUser) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    setEditing(true);
    try {
      const res = await api.put(`/users/admin/${editUser.id}`, editForm);
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...res.data.user } : u)));
      if (res.data.user?.id === me?.id) {
        // If the admin edited their own record, refresh the local session user too.
        const meRes = await api.get('/auth/me');
        if (meRes.data?.user) useAuthStore.setState({ user: meRes.data.user });
      }
      toast.success(`${editUser.name}'s profile updated.`);
      setEditUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    }
    setEditing(false);
  };

  const handleEditAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!editUser || !file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post(`/uploads/avatar?userId=${editUser.id}`, formData);
      const updated = res.data.user || editUser;
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, avatar_url: updated.avatar_url } : u)));
      setEditUser((prev) => (prev ? { ...prev, avatar_url: updated.avatar_url } : prev));
      toast.success('Avatar updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update avatar.');
    }
  };

  const removeEditAvatar = async () => {
    if (!editUser) return;
    try {
      const res = await api.delete(`/uploads/avatar?userId=${editUser.id}`);
      const updated = res.data.user || { ...editUser, avatar_url: null };
      setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, avatar_url: updated.avatar_url || null } : u)));
      setEditUser((prev) => (prev ? { ...prev, avatar_url: updated.avatar_url || null } : prev));
      toast.success('Avatar removed.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove avatar.');
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users/admin');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [retryKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, query]);

  const isSelf = (id) => id === me?.id;

  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/admin/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
      toast.success('Role updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const toggleStatus = async (user) => {
    const next = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.put(`/users/admin/${user.id}/status`, { status: next });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)));
      toast.success(next === 'suspended' ? `${user.name} suspended.` : `${user.name} reactivated.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const forceLogout = async (user) => {
    try {
      await api.post(`/users/admin/${user.id}/force-logout`);
      toast.success(`${user.name} signed out from all devices.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to force sign out.');
    }
  };

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Name, email, and password are required.');
      return;
    }
    setCreating(true);
    try {
      const res = await api.post('/users/admin', newUser);
      setUsers((prev) => [...prev, res.data.user]);
      setCreateOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'agent' });
      toast.success('User created.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    }
    setCreating(false);
  };

  const handleReset = async () => {
    if (!resetUser) return;
    if (resetPassword.length < 6 || !/[A-Za-z]/.test(resetPassword) || !/\d/.test(resetPassword)) {
      toast.error('Password must be at least 6 characters and include a letter and a number.');
      return;
    }
    setResetting(true);
    try {
      await api.post(`/users/admin/${resetUser.id}/reset-password`, { newPassword: resetPassword });
      toast.success(`Password reset for ${resetUser.name}.`);
      setResetUser(null);
      setResetPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    }
    setResetting(false);
  };

  if (me?.role !== 'admin') {
    return (
      <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <PageHeader title="Admin" icon={ShieldCheck} subtitle="User and workspace administration." badge="Admin" accent="#8B5CF6" />
        <Panel accent="#F43F5E" className="border-danger/20">
          <StatusState type="error" title="Administrator access required" message="Only administrators can manage workspace users." />
        </Panel>
      </motion.div>
    );
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        icon={ShieldCheck}
        subtitle="Manage team members, roles, and account access."
        badge="Admin"
        accent="#8B5CF6"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRetryKey((k) => k + 1)} aria-label="Refresh">
              <RefreshCw size={14} />
            </Button>
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <UserPlus size={14} />
              Add User
            </Button>
          </div>
        }
      />

      <motion.div variants={containerVariants} initial="initial" animate="animate">
        <Panel title="Team Directory" icon={ShieldCheck} accent="#8B5CF6">
          <div className="pb-4 border-b border-overlay/5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email..."
                aria-label="Search users"
                className="w-full pl-9 pr-3 py-2 rounded-xl glass text-sm text-text-primary placeholder:text-text-tertiary outline-none border border-overlay/8 focus:border-accent-primary/50"
              />
            </div>
            <span className="text-xs text-text-tertiary sm:ml-auto">{filtered.length} user{filtered.length === 1 ? '' : 's'}</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : error ? (
            <div>
              <StatusState type="error" title="Unable to load users" message={error} onRetry={() => setRetryKey((k) => k + 1)} />
            </div>
          ) : filtered.length === 0 ? (
            <div>
              <StatusState compact type="empty" title="No users found" message="Adjust your search or add a new team member." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-text-tertiary border-b border-overlay/5">
                      <th className="px-5 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Last Login</th>
                      <th className="px-4 py-3 font-semibold">Member Since</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <motion.tr
                        key={u.id}
                        variants={itemVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.03 * i }}
                        className="border-b border-overlay/5 last:border-0 hover:bg-overlay/3"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name || 'U'} role={u.role} size={34} src={resolveMediaUrl(u.avatar_url)} />
                            <div className="min-w-0">
                              <span className="block text-text-primary font-medium truncate">
                                {u.name}
                                {isSelf(u.id) && <span className="ml-2 text-[9px] uppercase tracking-wider text-accent-glow">You</span>}
                              </span>
                              <span className="block text-xs text-text-tertiary truncate">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <Select
                              value={u.role}
                              options={ROLE_OPTIONS}
                              onChange={(role) => changeRole(u.id, role)}
                              disabled={isSelf(u.id)}
                              placeholder="Role"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            u.status === 'active'
                              ? 'bg-success/10 text-success border-success/25'
                              : 'bg-danger/10 text-danger border-danger/25'
                          }`}>
                            {u.status === 'active' ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(u.last_login_at, true) || 'Never'}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="xs" onClick={() => openEdit(u)} aria-label={`Edit ${u.name} profile`}>
                              <Pencil size={13} />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => setResetUser(u)} disabled={isSelf(u.id)} aria-label={`Reset password for ${u.name}`}>
                              <KeyRound size={13} />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => forceLogout(u)} disabled={isSelf(u.id)} aria-label={`Sign out ${u.name}`}>
                              <LogOut size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => toggleStatus(u)}
                              disabled={isSelf(u.id)}
                              aria-label={u.status === 'active' ? `Suspend ${u.name}` : `Activate ${u.name}`}
                            >
                              {u.status === 'active' ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Panel>
      </motion.div>

      {/* Create user modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Team Member" maxWidth="max-w-md">
        <div className="flex flex-col gap-4">
          <Input label="Full Name" name="name" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="Email" name="email" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} required />
          <Input label="Temporary Password" name="password" type="text" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} required />
          <Select label="Role" value={newUser.role} options={ROLE_OPTIONS} onChange={(role) => setNewUser((p) => ({ ...p, role }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating} loading={creating}>
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal isOpen={!!resetUser} onClose={() => { setResetUser(null); setResetPassword(''); }} title={`Reset Password — ${resetUser?.name || ''}`} maxWidth="max-w-md">
        <div className="flex flex-col gap-4">
          <Input label="New Temporary Password" name="resetPassword" type="text" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required />
          <p className="text-xs text-text-tertiary">The user will be signed out everywhere and must use this password on their next login.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => { setResetUser(null); setResetPassword(''); }}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleReset} disabled={resetting} loading={resetting}>
              {resetting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit profile modal (admin CRUD on any user) */}
      <Modal isOpen={!!editUser} onClose={closeEdit} title={`Edit Profile — ${editUser?.name || ''}`} maxWidth="max-w-lg">
        {editUser && (
          <div className="flex flex-col gap-4">
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar name={editUser.name || 'U'} role={editUser.role} size={64} src={resolveMediaUrl(editUser.avatar_url)} />
                <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border mt-1.5 ${
                  editUser.role === 'admin' ? 'bg-accent-primary/10 text-accent-glow border-accent-primary/20'
                    : editUser.role === 'team_lead' ? 'bg-accent-highlight/10 text-accent-highlight border-accent-highlight/20'
                    : 'bg-overlay/5 text-text-secondary border-overlay/10'
                }`}>
                  {editUser.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={editAvatarRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleEditAvatar}
                  className="hidden"
                />
                <Button variant="primary" size="sm" onClick={() => editAvatarRef.current?.click()}>
                  <Upload size={14} />
                  Upload Avatar
                </Button>
                <Button variant="ghost" size="sm" onClick={removeEditAvatar} disabled={!editUser.avatar_url}>
                  <Trash2 size={14} />
                  Remove Avatar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" name="name" value={editForm.name} onChange={handleEditFormChange} required />
              <Input label="Email" name="email" type="email" value={editForm.email} onChange={handleEditFormChange} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Phone" name="phone" type="tel" value={editForm.phone} onChange={handleEditFormChange} icon={Phone} />
              <Input label="Department" name="department" value={editForm.department} onChange={handleEditFormChange} icon={Briefcase} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Company" name="company" value={editForm.company} onChange={handleEditFormChange} icon={Building2} />
              <Input label="Timezone" name="timezone" value={editForm.timezone} onChange={handleEditFormChange} icon={Globe} />
            </div>
            <div>
              <span className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center gap-1.5">Bio</span>
              <textarea
                name="bio"
                rows={3}
                value={editForm.bio}
                onChange={handleEditFormChange}
                placeholder="A short bio..."
                className="w-full rounded-xl glass-deep px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent-primary/40 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={closeEdit} disabled={editing}>
                <X size={14} />
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={saveEdit} disabled={editing} loading={editing}>
                {editing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

export default Admin;
