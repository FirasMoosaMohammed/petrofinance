import {
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  Activity
} from 'lucide-react';
export type NavPage = 'overview' | 'financial-report' | 'production' | 'about';

interface SidebarProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  className?: string;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activePage,
  onPageChange,
  className = '',
  onCloseMobile
}: SidebarProps) {
  const handleSelect = (page: NavPage) => {
    onPageChange(page);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800 w-64 select-none ${className}`}>
      {/* 1. Brand / Workspace Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">PetroFinance</span>
        </div>
      </div>

      {/* 2. Primary Navigation Group */}
      <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <button
          onClick={() => handleSelect('overview')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activePage === 'overview'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => handleSelect('financial-report')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activePage === 'financial-report'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Financial Report</span>
        </button>

        <button
          onClick={() => handleSelect('production')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activePage === 'production'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Activity className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Production & Costs</span>
        </button>
      </div>
    </aside>
  );
}
