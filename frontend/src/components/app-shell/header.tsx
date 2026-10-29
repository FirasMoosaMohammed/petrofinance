import { Menu, PanelLeft, RefreshCw, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import type { BusinessUnitOption } from '@/types/api';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  businessUnits: BusinessUnitOption[];
  selectedBuId: string;
  onBuChange: (buId: string) => void;
  selectedPeriodPreset: string;
  onPeriodPresetChange: (preset: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleMobileMenu: () => void;
  onToggleSidebar?: () => void;
  isBigQueryConnected: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function Header({
  title,
  businessUnits,
  selectedBuId,
  onBuChange,
  selectedPeriodPreset,
  onPeriodPresetChange,
  onRefresh,
  isRefreshing,
  onToggleMobileMenu,
  onToggleSidebar,
  isBigQueryConnected,
  isDark = false,
  onToggleTheme
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      {/* Left Breadcrumb & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:flex p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Toggle Sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Connection status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className={`h-2 w-2 rounded-full ${isBigQueryConnected ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
          <span className="font-medium text-[11px]">{isBigQueryConnected ? 'Online' : 'Offline'}</span>
        </div>

        {/* Business Unit Selector */}
        <div className="w-36 sm:w-44">
          <Select
            value={selectedBuId}
            onChange={(e) => onBuChange(e.target.value)}
            className="h-8 text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          >
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Period Preset */}
        <div className="w-32 sm:w-36">
          <Select
            value={selectedPeriodPreset}
            onChange={(e) => onPeriodPresetChange(e.target.value)}
            className="h-8 text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          >
            <option value="FY2025">Full Year 2025</option>
            <option value="H1_2025">H1 2025</option>
            <option value="H2_2025">H2 2025</option>
            <option value="Q1_2025">Q1 2025</option>
            <option value="Q2_2025">Q2 2025</option>
            <option value="Q3_2025">Q3 2025</option>
            <option value="Q4_2025">Q4 2025</option>
          </Select>
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 shadow-2xs cursor-pointer"
            title={isDark ? "Switch to light theme" : "Switch to dark theme"}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-zinc-600" />
            )}
          </Button>
        )}

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 shadow-2xs"
          title="Refresh BigQuery data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </header>
  );
}
