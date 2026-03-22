import React, { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = {
  win: '#34d399', // emerald-400
  loss: '#f87171', // red-400
  neutral: '#a1a1aa', // zinc-400
  accent: '#10b981', // emerald-500
};

export function Reports() {
  const { state } = useApp();
  const { sessions } = state;

  const allTrades = useMemo(() => {
    return sessions
      .flatMap((s) => s.trades.map(t => ({ ...t, sessionDate: s.startTime })))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [sessions]);

  // Balance Over Time Data
  const balanceData = useMemo(() => {
    if (allTrades.length === 0) return [];
    
    // Start with initial balance of the first session
    const firstSession = sessions.sort((a, b) => a.startTime - b.startTime)[0];
    const data = [{
      name: 'Start',
      balance: firstSession.startingBalance,
      timestamp: firstSession.startTime - 1000,
    }];

    allTrades.forEach((trade, index) => {
      data.push({
        name: `T${index + 1}`,
        balance: trade.balanceAfter,
        timestamp: trade.timestamp,
      });
    });

    return data;
  }, [allTrades, sessions]);

  // Win/Loss Ratio Data
  const winLossData = useMemo(() => {
    const wins = allTrades.filter(t => t.result === 'Win').length;
    const losses = allTrades.filter(t => t.result === 'Loss').length;
    return [
      { name: 'Wins', value: wins, color: COLORS.win },
      { name: 'Losses', value: losses, color: COLORS.loss },
    ];
  }, [allTrades]);

  // Payout Usage Data
  const payoutData = useMemo(() => {
    const counts: Record<number, number> = {};
    allTrades.forEach(t => {
      counts[t.payout] = (counts[t.payout] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([payout, count]) => ({
        name: `${payout}%`,
        count,
      }))
      .sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
  }, [allTrades]);

  // Session Performance Data
  const sessionPerformanceData = useMemo(() => {
    return sessions.slice().sort((a, b) => a.startTime - b.startTime).map((s, i) => {
      const pl = s.currentBalance - s.startingBalance;
      return {
        name: `S${i + 1}`,
        date: format(s.startTime, 'MMM d'),
        profit: pl > 0 ? pl : 0,
        loss: pl < 0 ? Math.abs(pl) : 0,
        net: pl,
      };
    });
  }, [sessions]);

  if (allTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-50">No Data Available</h2>
          <p className="text-zinc-400 mt-2 max-w-md mx-auto">
            Complete some trades to see your performance reports and charts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Reports</h1>
        <p className="text-zinc-400 mt-1">Visualize your trading performance over time.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Over Time */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-zinc-50 mb-6">Balance Over Time</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                  itemStyle={{ color: '#34d399' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                />
                <Line type="monotone" dataKey="balance" stroke={COLORS.accent} strokeWidth={2} dot={false} activeDot={{ r: 6, fill: COLORS.accent }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Ratio */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <h3 className="text-lg font-medium text-zinc-50 mb-6">Win/Loss Ratio</h3>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payout Usage */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <h3 className="text-lg font-medium text-zinc-50 mb-6">Payout Usage</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payoutData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                  formatter={(value: number) => [value, 'Trades']}
                />
                <Bar dataKey="count" fill={COLORS.neutral} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Performance */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-lg font-medium text-zinc-50 mb-6">Session Performance (P/L)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionPerformanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'P/L']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return `${label} (${payload[0].payload.date})`;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="profit" stackId="a" fill={COLORS.win} radius={[4, 4, 0, 0]} />
                <Bar dataKey="loss" stackId="a" fill={COLORS.loss} radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
