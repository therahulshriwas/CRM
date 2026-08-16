// frontend/src/components/dashboard/rightPanel/AIAssistantPanel.jsx
// AI CRM copilot panel in the dashboard right panel — wired to real AI endpoints (Phase 3).
// Reuses the shared AIAssistantChat (message log + composer) plus insight quick-prompts.
// Used in: Dashboard persistent right panel.

import React, { useMemo, useCallback } from 'react';
import { ArrowUpRight, AlertCircle, Clock } from 'lucide-react';
import { useAiStore } from '../../../store/aiStore';
import AIAssistantChat from '../../ai/AIAssistantChat';

function AIAssistantPanel() {
  const sendMessage = useAiStore((s) => s.sendMessage);

  // Memoize insights array so it's not recreated every render.
  const insights = useMemo(() => [
    {
      title: 'Conversion Trend',
      prompt: 'What is my current conversion trend across deals?',
      icon: ArrowUpRight,
      color: '#10B981',
    },
    {
      title: 'Attention Needed',
      prompt: 'Which deals need attention and why?',
      icon: AlertCircle,
      color: '#F43F5E',
    },
    {
      title: 'Suggested Follow-up',
      prompt: 'Suggest follow-up actions for my leads.',
      icon: Clock,
      color: '#F59E0B',
    },
  ], []);

  // Memoize the click handler to prevent unnecessary re-renders of children.
  const handleInsightClick = useCallback((prompt) => {
    sendMessage(prompt);
  }, [sendMessage]);

  return (
    <div className="flex flex-col gap-4 select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-secondary/40 font-bold uppercase tracking-wider">AI Assistant</span>
        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-secondary-glow border border-accent-primary/20 scale-95 tracking-wide">
          BETA
        </span>
      </div>

      {/* Chat body (message log + composer) */}
      <div className="flex flex-col max-h-[300px] min-h-[180px]">
        <AIAssistantChat />
      </div>

      {/* Insight quick-prompt cards */}
      <div className="flex flex-col gap-2 border-t border-overlay/5 pt-2.5">
        <span className="text-[9px] text-[#B7B8C5]/50 font-bold uppercase tracking-wider">Suggested Insights</span>
        {insights.map((ins) => {
          const Icon = ins.icon;
          return (
            <button
              key={ins.title}
              onClick={() => handleInsightClick(ins.prompt)}
              className="glass p-3 rounded-xl border border-overlay/5 flex flex-col gap-1 hover:bg-overlay/5 transition-all text-left cursor-pointer outline-none"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold select-none">
                <Icon size={12} color={ins.color} />
                <span className="text-text-primary text-[11px]">{ins.title}</span>
              </div>
              <span className="text-[10px] text-text-secondary leading-normal select-text">{ins.prompt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AIAssistantPanel;
