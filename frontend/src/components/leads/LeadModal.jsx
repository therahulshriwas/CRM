// frontend/src/components/leads/LeadModal.jsx
// Create/Edit form modal for leads with inline validation and owner assignment for admin/team_lead.
// Used in: pages/Leads.jsx (add/edit), pages/LeadDetail.jsx (edit).

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { leadSources, leadStatuses } from '../../config/leads';

function LeadModal({ isOpen, onClose, initialData = null, users = [], currentUser, onSubmit, submitting }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Website',
    status: 'New',
    owner_id: '',
  });
  const [errors, setErrors] = useState({});

  // Seed the form when opening for edit or reset when opening for create.
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        source: initialData?.source || 'Website',
        status: initialData?.status || 'New',
        owner_id: initialData?.owner_id ? String(initialData.owner_id) : String(currentUser?.id || ''),
      });
      setErrors({});
    }
  }, [isOpen, initialData, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Lead name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (formData.phone && formData.phone.trim().length < 7) {
      nextErrors.phone = 'Phone number looks too short';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      source: formData.source,
      status: formData.status,
    };
    // Only admins/team leads may reassign ownership.
    if (currentUser?.role !== 'agent' && formData.owner_id) {
      payload.owner_id = parseInt(formData.owner_id, 10);
    }
    const result = await onSubmit(payload);
    if (result.success) onClose();
  };

  const canAssignOwner = currentUser?.role !== 'agent';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Lead' : 'New Lead'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">Source</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
            >
              {leadSources.map((s) => (
                <option key={s} value={s} className="bg-bg-surface">{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
            >
              {leadStatuses.map((s) => (
                <option key={s} value={s} className="bg-bg-surface">{s}</option>
              ))}
            </select>
          </div>
        </div>

        {canAssignOwner && users.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">
              Assign Owner
            </label>
            <select
              name="owner_id"
              value={formData.owner_id}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-bg-surface">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default LeadModal;
