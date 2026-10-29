import React, { useState } from 'react';
import { Sidebar, type NavPage } from './sidebar';
import { Header } from './header';
import type { HealthStatus, BusinessUnitOption } from '@/types/api';
import { X } from 'lucide-react';

interface ShellProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  health: HealthStatus | null;
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
  pageTitle: string;
  pageSubtitle?: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
  children: React.ReactNode;
}

export function Shell({
  activePage,
  onPageChange,
  health,
  businessUnits,
  selectedBuId,
  onBuChange,
  selectedPeriodPreset,
  onPeriodPresetChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  isRefreshing,
  pageTitle,
  pageSubtitle,
  isDark = false,
  onToggleTheme,
  children
}: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const isBigQueryConnected = health?.source_status === 'connected';

  return (
    <div className="flex h-screen w-full bg-[#fbfbfb] dark:bg-[#09090b] overflow-hidden font-sans antialiased text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Desktop Sidebar */}
      {desktopSidebarOpen && (
        <div className="hidden md:flex md:shrink-0 transition-all">
          <Sidebar
            activePage={activePage}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Sheet */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full">
          <Sidebar
            activePage={activePage}
            onPageChange={onPageChange}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-3.5 right-3.5 p-1 rounded-lg text-zinc-400 hover:text-zinc-900"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitle}
          subtitle={pageSubtitle}
          businessUnits={businessUnits}
          selectedBuId={selectedBuId}
          onBuChange={onBuChange}
          selectedPeriodPreset={selectedPeriodPreset}
          onPeriodPresetChange={onPeriodPresetChange}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onToggleSidebar={() => setDesktopSidebarOpen((prev) => !prev)}
          isBigQueryConnected={isBigQueryConnected}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
