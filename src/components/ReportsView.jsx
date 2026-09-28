import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Filter, 
  Calendar, 
  ArrowUpRight, 
  Award,
  Layers,
  Building2,
  FileCheck
} from 'lucide-react';
import { initialAgencyData, initialUsers } from '../data/mockData';

export default function ReportsView() {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('MTD'); // MTD, Q3, YTD

  const destinationMetrics = [
    { destination: 'Dubai, UAE', bookings: 28, revenuePKR: 4200000, costPKR: 3570000, marginPKR: 630000, marginPct: '15.0%', visaApproval: '98.5%' },
    { destination: 'Saudi Arabia (Umrah)', bookings: 19, revenuePKR: 3850000, costPKR: 3270000, marginPKR: 580000, marginPct: '15.1%', visaApproval: '99.4%' },
    { destination: 'United Kingdom', bookings: 11, revenuePKR: 2100000, costPKR: 1780000, marginPKR: 320000, marginPct: '15.2%', visaApproval: '89.2%' },
    { destination: 'Baku, Azerbaijan', bookings: 14, revenuePKR: 1450000, costPKR: 1210000, marginPKR: 240000, marginPct: '16.5%', visaApproval: '99.8%' },
    { destination: 'Schengen / Europe', bookings: 6, revenuePKR: 1350000, costPKR: 1120000, marginPKR: 230000, marginPct: '17.0%', visaApproval: '84.0%' },
    { destination: 'Malaysia & Thailand', bookings: 8, revenuePKR: 980000, costPKR: 825000, marginPKR: 155000, marginPct: '15.8%', visaApproval: '97.0%' }
  ];

  const consultantLeaderboard = [
    { name: 'Hamza Tariq', role: 'Senior Consultant', branch: 'Islamabad (Blue Area)', closed: 18, revenuePKR: 4850000, targetPct: 121, commissionPKR: 121250 },
    { name: 'Ayesha Khan', role: 'Visa Specialist & Consultant', branch: 'Lahore HQ', closed: 15, revenuePKR: 3950000, targetPct: 98, commissionPKR: 98750 },
    { name: 'Fatima Noor', role: 'Operations & Sales', branch: 'Karachi (Clifton)', closed: 12, revenuePKR: 3100000, targetPct: 103, commissionPKR: 77500 },
    { name: 'Zubair Siddiqui', role: 'Branch Manager', branch: 'Karachi (Clifton)', closed: 8, revenuePKR: 1950000, targetPct: 85, commissionPKR: 48750 }
  ];

  const totalRevenue = destinationMetrics.reduce((acc, d) => acc + d.revenuePKR, 0);
  const totalCost = destinationMetrics.reduce((acc, d) => acc + d.costPKR, 0);
  const totalMargin = totalRevenue - totalCost;
  const overallYield = ((totalMargin / totalRevenue) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] font-display">
              Operations & Financial Analytics
            </h1>
            <span className="badge-mint text-[10px] px-2 py-0.5 rounded-full font-mono font-medium">
              README §23
            </span>
          </div>
          <p className="text-xs text-[var(--text-2)] font-body mt-0.5">
            Gross margin yields by destination, sales leaderboard, visa embassy success rates, and branch performance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)] font-body"
          >
            <option value="ALL">All Agency Branches</option>
            {initialAgencyData.branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--surface-2)] border border-[var(--line-2)] text-[var(--text)] focus:outline-none focus:border-[var(--mint)] font-body font-mono"
          >
            <option value="MTD">Month to Date (Sep 2026)</option>
            <option value="Q3">Q3 2026</option>
            <option value="YTD">Year to Date (2026)</option>
          </select>
        </div>
      </div>

      {/* Top 4 KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sd-card p-5 space-y-2">
          <span className="mono-eyebrow text-[10px] text-[var(--cyan)]">Total Bookings Volume</span>
          <div className="text-2xl font-bold font-mono text-[var(--text)]">
            PKR {(totalRevenue / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-[var(--mint)] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.8% vs last month</span>
          </div>
        </div>

        <div className="sd-card p-5 space-y-2">
          <span className="mono-eyebrow text-[10px] text-[var(--mint)]">Gross Margin Yield</span>
          <div className="text-2xl font-bold font-mono text-[var(--mint)]">
            PKR {(totalMargin / 1000000).toFixed(2)}M ({overallYield}%)
          </div>
          <div className="text-[11px] text-[var(--text-3)] font-body">Target: 14.5% yield achieved</div>
        </div>

        <div className="sd-card p-5 space-y-2">
          <span className="mono-eyebrow text-[10px] text-[var(--cyan)]">Visa Approval Success</span>
          <div className="text-2xl font-bold font-mono text-[var(--cyan)]">96.8%</div>
          <div className="text-[11px] text-[var(--text-3)] font-body">142 visa files granted</div>
        </div>

        <div className="sd-card p-5 space-y-2">
          <span className="mono-eyebrow text-[10px] text-[var(--amber)]">Sales Conversion Rate</span>
          <div className="text-2xl font-bold font-mono text-[var(--amber)]">68.4%</div>
          <div className="text-[11px] text-[var(--text-3)] font-body">Leads converted to bookings</div>
        </div>
      </div>

      {/* Destination Volume, Cost & Margin Matrix */}
      <div className="sd-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] font-display">
              Destination Profitability & Margin Matrix
            </h3>
            <p className="text-xs text-[var(--text-3)] font-body">
              Customer revenue collected vs consolidator costs and gross margin per corridor
            </p>
          </div>
          <Layers className="w-5 h-5 text-[var(--mint)]" />
        </div>

        <div className="border border-[var(--line)] rounded-xl overflow-hidden text-xs font-body divide-y divide-[var(--line)]">
          <div className="grid grid-cols-12 p-3 font-semibold text-[var(--text-3)] bg-[var(--surface-2)]">
            <div className="col-span-3">Destination Corridor</div>
            <div className="col-span-1 text-center">Pax / Bookings</div>
            <div className="col-span-2 text-right">Revenue (PKR)</div>
            <div className="col-span-2 text-right">Supplier Cost</div>
            <div className="col-span-2 text-right">Gross Margin</div>
            <div className="col-span-2 text-right">Visa Yield</div>
          </div>

          {destinationMetrics.map((d, i) => (
            <div key={i} className="grid grid-cols-12 p-3 items-center hover:bg-[var(--surface-2)]/60 transition-colors">
              <div className="col-span-3">
                <div className="font-semibold text-[var(--text)]">{d.destination}</div>
              </div>
              <div className="col-span-1 text-center font-mono font-medium text-[var(--text-2)]">
                {d.bookings}
              </div>
              <div className="col-span-2 text-right font-mono font-semibold text-[var(--text)]">
                ₨{(d.revenuePKR / 1000).toLocaleString()}k
              </div>
              <div className="col-span-2 text-right font-mono text-[var(--text-3)]">
                ₨{(d.costPKR / 1000).toLocaleString()}k
              </div>
              <div className="col-span-2 text-right font-mono font-bold text-[var(--mint)]">
                ₨{(d.marginPKR / 1000).toLocaleString()}k ({d.marginPct})
              </div>
              <div className="col-span-2 text-right font-mono font-bold text-emerald-400">
                {d.visaApproval}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consultant Sales Leaderboard */}
      <div className="sd-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text)] font-display">
              Consultant Performance & Commission Leaderboard
            </h3>
            <p className="text-xs text-[var(--text-3)] font-body">
              Sales achievements, closed volume, and earned monthly commissions
            </p>
          </div>
          <Award className="w-5 h-5 text-[var(--amber)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {consultantLeaderboard.map((c, i) => (
            <div key={i} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[var(--text)] font-display">{c.name}</h4>
                  <div className="text-[10px] text-[var(--text-3)] font-body">{c.role}</div>
                  <div className="text-[10px] text-[var(--cyan)] font-body mt-0.5">{c.branch}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  c.targetPct >= 100 ? 'bg-[var(--mint-dim)] text-[var(--mint)] border border-[rgba(31,229,163,0.3)]' :
                  'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(229,176,74,0.3)]'
                }`}>
                  {c.targetPct}% Target
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[var(--line)] text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-3)]">Closed Bookings:</span>
                  <span className="font-mono font-bold text-[var(--text)]">{c.closed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-3)]">Sales Volume:</span>
                  <span className="font-mono font-semibold text-[var(--text)]">PKR {(c.revenuePKR / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-3)]">Incentive Earned:</span>
                  <span className="font-mono font-bold text-[var(--mint)]">PKR {c.commissionPKR.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
