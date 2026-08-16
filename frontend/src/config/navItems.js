// frontend/src/config/navItems.js
// Single source of truth for sidebar navigation items and their page titles.
// Used in: Sidebar.jsx and AppLayout.jsx (page title resolution).

import {
  LayoutDashboard,
  Users2,
  GitBranch,
  MessageSquare,
  BarChart3,
  Users,
  Calendar,
  FileSpreadsheet,
  Briefcase,
  Settings,
  HelpCircle,
  CheckSquare,
  FolderKanban,
   PieChart,
   Search,
  Bell,
  User,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

// Functional modules — fully built and routed. All live under the protected /app tree.
export const coreNavItems = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard, title: 'Dashboard' },
  { label: 'Leads', path: '/app/leads', icon: Users2, title: 'Leads' },
  { label: 'Deals Pipeline', path: '/app/deals', icon: GitBranch, title: 'Deals Pipeline' },
  { label: 'Customers', path: '/app/customers', icon: Users, title: 'Customers' },
  { label: 'Calendar', path: '/app/calendar', icon: Calendar, title: 'Calendar' },
  { label: 'Tasks', path: '/app/tasks', icon: CheckSquare, title: 'Tasks' },
  { label: 'Projects', path: '/app/projects', icon: FolderKanban, title: 'Projects' },
  { label: 'Chat', path: '/app/chat', icon: MessageSquare, title: 'Team Chat' },
  { label: 'Invoices', path: '/app/invoices', icon: FileSpreadsheet, title: 'Invoices' },
  { label: 'Employees', path: '/app/employees', icon: Briefcase, title: 'Employees' },
];

// Analytics group
export const analyticsNavItems = [
  { label: 'Reports', path: '/app/reports', icon: BarChart3, title: 'Reports' },
  { label: 'Analytics', path: '/app/analytics', icon: PieChart, title: 'Analytics' },
];

// Tools group
export const toolsNavItems = [
  { label: 'AI Workspace', path: '/app/ai-workspace', icon: Sparkles, title: 'AI Workspace' },
  { label: 'Search', path: '/app/search', icon: Search, title: 'Search' },
  { label: 'Notifications', path: '/app/notifications', icon: Bell, title: 'Notifications' },
  { label: 'Profile', path: '/app/profile', icon: User, title: 'Profile' },
  { label: 'Admin', path: '/app/admin', icon: ShieldCheck, title: 'Admin', adminOnly: true },
];

// Secondary navigation — settings/utility. Appears at the bottom of the sidebar
// in a visually separated "Workspace" group (Settings / Help), matching Attio's
// pattern of surfacing non-core tools at the bottom.
export const utilityNavItems = [
  { label: 'Settings', path: '/app/settings', icon: Settings, title: 'Settings' },
  { label: 'Help & Feedback', path: '/app/help', icon: HelpCircle, title: 'Help & Feedback' },
];

// Resolves the topbar heading for a given pathname.
export function getPageTitle(pathname) {
  const match = [...coreNavItems, ...analyticsNavItems, ...toolsNavItems, ...utilityNavItems].find((item) => item.path === pathname);
  if (match) return match.title;
  if (pathname.startsWith('/app/leads')) return 'Lead Details';
  return 'Antigravity CRM';
}
