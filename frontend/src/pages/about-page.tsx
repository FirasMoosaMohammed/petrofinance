import { Database, Server } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { HealthStatus } from '@/types/api';

interface AboutPageProps {
  health: HealthStatus | null;
}

export function AboutPage({ health }: AboutPageProps) {
  const isConnected = health?.source_status === 'connected';

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* 1. Infrastructure Overview */}
      <Card className="border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white">
        <CardHeader className="p-6 pb-3 border-b border-zinc-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-900">Data Warehouse</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-200 bg-zinc-50">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-zinc-800">{isConnected ? 'Connected' : 'Active'}</span>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                <Database className="h-4 w-4 text-zinc-600" />
                <span>Google BigQuery Warehouse</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Project:</span>
                  <span className="font-mono font-medium text-zinc-800">{health?.project_id || 'petrofinance'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Dataset:</span>
                  <span className="font-mono font-medium text-zinc-800">{health?.dataset || 'petrofinance_bi'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Mode:</span>
                  <span className="font-medium text-emerald-700">Live BigQuery Queries</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
                <Server className="h-4 w-4 text-zinc-600" />
                <span>Backend Services</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">API Runtime:</span>
                  <span className="font-medium text-zinc-800">Django REST Framework</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span className="text-zinc-500">Currency:</span>
                  <span className="font-medium text-zinc-800">Saudi Riyals (SAR)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Data Grid:</span>
                  <span className="font-medium text-zinc-800">AG Grid Community</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Tables & Schema */}
      <Card className="border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white">
        <CardHeader className="p-6 pb-3 border-b border-zinc-100">
          <CardTitle className="text-sm font-semibold text-zinc-900">Database Tables & Partitioning</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 text-[11px] font-medium">
                <th className="py-2.5 pr-4">Table</th>
                <th className="py-2.5 pr-4">Type</th>
                <th className="py-2.5 pr-4">Record Count</th>
                <th className="py-2.5">Key Attributes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              <tr>
                <td className="py-2.5 pr-4 font-mono font-medium text-zinc-900">fact_financials</td>
                <td className="py-2.5 pr-4">Partitioned Fact</td>
                <td className="py-2.5 pr-4 font-mono">1,656</td>
                <td className="py-2.5 text-zinc-500">period_date, business_unit_id, scenario, amount_sar</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono font-medium text-zinc-900">fact_production</td>
                <td className="py-2.5 pr-4">Partitioned Fact</td>
                <td className="py-2.5 pr-4 font-mono">72</td>
                <td className="py-2.5 text-zinc-500">period_date, field_id, barrels_produced, realized_price</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono font-medium text-zinc-900">dim_business_unit</td>
                <td className="py-2.5 pr-4">Dimension</td>
                <td className="py-2.5 pr-4 font-mono">5</td>
                <td className="py-2.5 text-zinc-500">business_unit_id, business_unit_name, region</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono font-medium text-zinc-900">dim_oil_field</td>
                <td className="py-2.5 pr-4">Dimension</td>
                <td className="py-2.5 pr-4 font-mono">6</td>
                <td className="py-2.5 text-zinc-500">field_id, field_name, region, field_type</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
