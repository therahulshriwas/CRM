// frontend/src/components/deals/DealModal.jsx
// Create-deal form modal — links a deal to an existing lead, sets title, value, stage, close date,
// and optional owner assignment for admin/team_lead.
// Used in: pages/Deals.jsx (New Deal action).

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { dealStages } from '../../config/dealStages';

function DealModal({ isOpen, onClose, leads = [], users = [], currentUser, onSubmit, submitting }) {
  const [formData, setFormData] = useState({
    title: '',
    lead_id: '',
    value: '',
    stage: 'Qualified',
    close_date: '',
    owner_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        lead_id: leads[0] ? String(leads[0].id) : '',
        value: '',
        stage: 'Qualified',
        close_date: '',
        owner_id: currentUser?.id ? String(currentUser.id) : '',
      });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.title.trim()) nextErrors.title = 'Deal title is required';
    if (!formData.lead_id) nextErrors.lead_id = 'Select a lead';
    if (formData.value === '' || Number(formData.value) < 0) nextErrors.value = 'Enter a valid value';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      lead_id: parseInt(formData.lead_id, 10),
      title: formData.title.trim(),
      value: parseFloat(formData.value || 0),
      stage: formData.stage,
      close_date: formData.close_date || null,
    };
    if (currentUser?.role !== 'agent' && formData.owner_id) {
      payload.owner_id = parseInt(formData.owner_id, 10);
    }
    const result = await onSubmit(payload);
    if (result.success) onClose();
  };

  const canAssignOwner = currentUser?.role !== 'agent';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Deal" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Deal Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">Linked Lead *</label>
          <select
            name="lead_id"
            value={formData.lead_id}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
          >
            {leads.length === 0 && <option value="">No leads available</option>}
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id} className="bg-bg-surface">{lead.name}</option>
            ))}
          </select>
          {errors.lead_id && <span className="text-xs text-danger mt-0.5 px-1">{errors.lead_id}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">Value (USD) *</label>
            <input
              type="number"
              name="value"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.value}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary"
            />
            {errors.value && <span className="text-xs text-danger mt-0.5 px-1">{errors.value}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">Close Date</label>
            <input
              type="date"
              name="close_date"
              value={formData.close_date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">Stage</label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl glass text-text-primary text-sm outline-none border border-overlay/5 focus:border-accent-primary cursor-pointer"
            >
              {dealStages.map((s) => (
                <option key={s} value={s} className="bg-bg-surface">{s}</option>
              ))}
            </select>
          </div>

          {canAssignOwner && users.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-secondary font-medium uppercase tracking-wider px-1">Assign Owner</label>
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
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default DealModal;
