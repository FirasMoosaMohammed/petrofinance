import { useState, useMemo } from 'react';
import { FinancialAgGrid } from '@/components/financial-grid/financial-ag-grid';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { FinancialRecord } from '@/types/api';

interface FinancialReportPageProps {
  records: FinancialRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedMetricType: string;
  onMetricTypeChange: (type: string) => void;
  summary?: {
    total_budget: number;
    total_actual: number;
    total_variance: number;
  };
}

export function FinancialReportPage({
  records,
  isLoading,
  error,
  onRetry,
  categories,
  selectedCategory,
  onCategoryChange,
}: FinancialReportPageProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'opex' | 'unfavorable'>('all');

  const unfavorableCount = useMemo(() => {
    return records.filter((r) => r.variance_status === 'Unfavorable').length;
  }, [records]);

  // Client-side instant filtering across tabs and category
  const filteredRecords = useMemo(() => {
    let result = records;
    if (activeTab === 'revenue') {
      result = result.filter((r) => r.metric_type === 'Revenue');
    } else if (activeTab === 'opex') {
      result = result.filter((r) => r.metric_type === 'Operating Expense');
    } else if (activeTab === 'unfavorable') {
      result = result.filter((r) => r.variance_status === 'Unfavorable');
    }
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((r) => r.category === selectedCategory);
    }
    return result;
  }, [records, activeTab, selectedCategory]);

  // Recalculate summary metrics dynamically for active filtered records
  const dynamicSummary = useMemo(() => {
    let totBudget = 0;
    let totActual = 0;
    for (const r of filteredRecords) {
      totBudget += r.budget_amount;
      totActual += r.actual_amount;
    }
    return {
      total_budget: totBudget,
      total_actual: totActual,
      total_variance: totActual - totBudget,
    };
  }, [filteredRecords]);

  return (
    <div className="space-y-4 pb-12">
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white dark:bg-zinc-950">
        <CardHeader className="p-6 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Financial Ledger</CardTitle>
            
            {/* Functional Pill Tabs directly controlling AG Grid */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
              <TabsList>
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="opex">Operating Expenses</TabsTrigger>
                <TabsTrigger value="unfavorable" badge={unfavorableCount}>
                  Over Budget
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-56">
              <Select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="h-8 text-xs font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <FinancialAgGrid
            rowData={filteredRecords}
            isLoading={isLoading}
            error={error}
            onRetry={onRetry}
            totalCount={filteredRecords.length}
            summary={dynamicSummary}
          />
        </CardContent>
      </Card>
    </div>
  );
}
