// frontend/src/pages/Help.jsx
// Self-service help and keyboard reference for the CRM workspace.
// Used in: App.jsx `/app/help` route.

import React from 'react';
import { HelpCircle, Keyboard, Mail, Sparkles } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import Button from '../components/common/Button';
import { pageVariants } from '../animations/variants';
import { motion } from 'framer-motion';

const SHORTCUTS = [
  ['Ctrl/Cmd + K', 'Open global search'],
  ['Escape', 'Close an open dialog or menu'],
  ['Enter', 'Submit the active form'],
  ['Shift + Enter', 'Add a new line in chat'],
];

function Help() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="flex flex-col gap-6">
      <PageHeader title="Help & Feedback" icon={HelpCircle} subtitle="Find your way around the command deck." badge="Support" accent="#3B82F6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Keyboard shortcuts" subtitle="Move faster without leaving the keyboard." icon={Keyboard} accent="#8B5CF6">
          <div className="flex flex-col divide-y divide-overlay/5">
            {SHORTCUTS.map(([key, description]) => (
              <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="text-sm text-text-secondary">{description}</span>
                <kbd className="rounded-lg border border-overlay/10 bg-overlay/5 px-2 py-1 text-[10px] font-mono text-text-primary whitespace-nowrap">{key}</kbd>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Quick guidance" subtitle="The core workflows at a glance." icon={Sparkles} accent="#10B981">
          <div className="flex flex-col gap-3 text-sm text-text-secondary leading-relaxed">
            <p><strong className="text-text-primary">Leads:</strong> capture and qualify new opportunities, then open a lead for its full activity and deal history.</p>
            <p><strong className="text-text-primary">Pipeline:</strong> drag a deal between stages. Stage changes update dashboard metrics and notify the owner.</p>
            <p><strong className="text-text-primary">AI Copilot:</strong> use the floating sparkle button for role-scoped pipeline questions and follow-up drafts.</p>
          </div>
        </Panel>
      </div>
      <Panel title="Need more help?" subtitle="Send feedback directly to the workspace team." icon={Mail} accent="#F59E0B">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-text-secondary">Tell us what is blocking your workflow and include the page you were using.</p>
          <Button variant="secondary" size="sm" onClick={() => { window.location.href = 'mailto:support@trimaxcrm.local?subject=Trimax-CRM%20feedback'; }}><Mail size={14} /> Contact support</Button>
        </div>
      </Panel>
    </motion.div>
  );
}

export default Help;
