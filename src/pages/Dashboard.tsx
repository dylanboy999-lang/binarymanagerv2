import React from 'react';
import { useApp } from '../store/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { Play, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { state, startSession } = useApp();
  const { sessions, activeSessionId, settings } = state;

  const activeSession = sessions.find((s) => s.id === activeSessionId && s.status === 'active');
  const completedSessions = sessions.filter((s) => s.status !== 'active');

  const totalTrades = sessions.reduce((acc, s) => acc + s.trades.length, 0);
  const totalWins = sessions.reduce((acc, s) => acc + s.trades.filter((t) => t.result === 'Win').length, 0);
  const totalLosses = totalTrades - totalWins;
  const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';

  const currentBalance = activeSession ? activeSession.currentBalance : settings.startingBalance;
  const totalProfit = sessions.reduce((acc, s) => acc + (s.currentBalance - s.startingBalance), 0);
  const balanceColor = totalProfit > 0 ? 'text-emerald-400' : totalProfit < 0 ? 'text-red-400' : 'text-zinc-50';

  const navigate = useNavigate();

  const handleStartSession = () => {
    startSession();
    navigate('/session');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Overview of your trading performance.</p>
        </div>
        {activeSession ? (
          <Link
            to="/session"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 h-10 px-4 py-2"
          >
            <Activity className="mr-2 h-4 w-4" />
            Go to Active Session
          </Link>
        ) : (
          <button
            onClick={handleStartSession}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 bg-amber-500 text-zinc-950 hover:bg-amber-500/90 h-10 px-4 py-2"
          >
            <Play className="mr-2 h-4 w-4" />
            Start New Session
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-zinc-400">Current Balance</h3>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold ${balanceColor}`}>${currentBalance.toFixed(2)}</div>
          <p className="text-xs text-zinc-500 mt-1">
            {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} all time
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-zinc-400">Win Rate</h3>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-50">{winRate}%</div>
          <p className="text-xs text-zinc-500 mt-1">
            {totalWins}W - {totalLosses}L
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-zinc-400">Total Trades</h3>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-50">{totalTrades}</div>
          <p className="text-xs text-zinc-500 mt-1">Across {sessions.length} sessions</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-zinc-400">Recent Sessions</h3>
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-50">{completedSessions.length}</div>
          <p className="text-xs text-zinc-500 mt-1">Completed sessions</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-zinc-50">Recent Sessions</h3>
        </div>
        <div className="p-0">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No sessions recorded yet.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/80 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Trades</th>
                  <th className="px-6 py-3 font-medium">Start Bal</th>
                  <th className="px-6 py-3 font-medium">End Bal</th>
                  <th className="px-6 py-3 font-medium">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sessions.slice(0, 5).map((session) => {
                  const pl = session.currentBalance - session.startingBalance;
                  return (
                    <tr key={session.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-zinc-300">
                        {format(session.startTime, 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          session.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                          session.status === 'stopped_win_limit' ? 'bg-blue-500/10 text-blue-400' :
                          session.status === 'stopped_loss_limit' ? 'bg-red-500/10 text-red-400' :
                          'bg-zinc-500/10 text-zinc-400'
                        }`}>
                          {session.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{session.trades.length}</td>
                      <td className="px-6 py-4 text-zinc-300">${session.startingBalance.toFixed(2)}</td>
                      <td className="px-6 py-4 text-zinc-300">${session.currentBalance.toFixed(2)}</td>
                      <td className={`px-6 py-4 font-medium ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pl >= 0 ? '+' : ''}{pl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
