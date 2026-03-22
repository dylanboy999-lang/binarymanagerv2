import React, { useState, useEffect } from 'react';
import { useApp, TradeDirection, TradeResult } from '../store/AppContext';
import { AlertCircle, CheckCircle2, XCircle, StopCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function ActiveSession() {
  const { state, addTrade, endSession, startSession } = useApp();
  const navigate = useNavigate();
  const { activeSessionId, sessions, settings } = state;
  const session = sessions.find((s) => s.id === activeSessionId);

  const [asset, setAsset] = useState('EUR/USD');
  const [payout, setPayout] = useState(settings.defaultPayout.toString());
  const [direction, setDirection] = useState<TradeDirection>('Call');
  const [notes, setNotes] = useState('');

  // Auto-redirect if no active session
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
          <StopCircle className="w-8 h-8 text-zinc-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-50">No Active Session</h2>
          <p className="text-zinc-400 mt-2 max-w-md mx-auto">
            You don't have an active trading session. Start a new one to begin logging trades.
          </p>
        </div>
        <button
          onClick={() => {
            startSession();
          }}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 bg-amber-500 text-zinc-950 hover:bg-amber-500/90 h-10 px-6 py-2"
        >
          Start New Session
        </button>
      </div>
    );
  }

  const trades = session.trades;
  const lastTrade = trades[trades.length - 1];
  
  // Calculate next trade amount
  const nextTradeAmount = lastTrade ? lastTrade.nextTradeAmount : settings.minTradeAmount;

  // Calculate stats
  const wins = trades.filter((t) => t.result === 'Win').length;
  
  // Calculate streak
  let currentStreak = 0;
  let streakType: 'Win' | 'Loss' | null = null;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (streakType === null) {
      streakType = trades[i].result;
      currentStreak = 1;
    } else if (trades[i].result === streakType) {
      currentStreak++;
    } else {
      break;
    }
  }

  const consecutiveLosses = streakType === 'Loss' ? currentStreak : 0;
  const pl = session.currentBalance - session.startingBalance;
  const balanceColor = pl > 0 ? 'text-emerald-400' : pl < 0 ? 'text-red-400' : 'text-zinc-50';

  // Calculate how many loss trades the balance can place
  let simulatedBalance = session.currentBalance;
  let simulatedNextAmount = nextTradeAmount;
  let lossTradesPossible = 0;

  while (simulatedBalance >= simulatedNextAmount && lossTradesPossible < 20) { // cap at 20 to prevent infinite loop
    simulatedBalance -= simulatedNextAmount;
    simulatedNextAmount *= 2.3;
    lossTradesPossible++;
  }

  const handleLogTrade = (result: TradeResult) => {
    const numPayout = parseFloat(payout);
    if (isNaN(numPayout)) return;

    addTrade({
      asset,
      payout: numPayout,
      direction,
      result,
      tradeAmount: nextTradeAmount,
      notes,
      timestamp: Date.now(),
    });

    setNotes('');
  };

  const payoutNum = parseFloat(payout);
  const isPayoutWarning = !isNaN(payoutNum) && (payoutNum < 80 || payoutNum > 95);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Active Session</h1>
          <p className="text-zinc-400 mt-1">Log your trades and track your progress.</p>
        </div>
        <button
          onClick={endSession}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 h-10 px-4 py-2"
        >
          <StopCircle className="mr-2 h-4 w-4" />
          End Session
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="text-sm font-medium text-zinc-400">Current Balance</div>
          <div className={`text-2xl font-bold mt-1 ${balanceColor}`}>${session.currentBalance.toFixed(2)}</div>
          <div className={`text-xs mt-1 font-medium ${pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pl >= 0 ? '+' : ''}{pl.toFixed(2)} Session P/L
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="text-sm font-medium text-zinc-400">Next Trade Amount</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">${nextTradeAmount.toFixed(2)}</div>
          <div className="text-xs text-zinc-500 mt-1">Calculated automatically</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="text-sm font-medium text-zinc-400">Session Rules</div>
          <div className="text-xl font-bold text-zinc-50 mt-1">
            <span className="text-emerald-400">{wins}/10 W</span>
            <span className="text-zinc-600 mx-2">|</span>
            <span className="text-red-400">{consecutiveLosses}/5 L</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">Auto-stops at limits</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="text-sm font-medium text-zinc-400">Current Streak</div>
          <div className={`text-2xl font-bold mt-1 ${streakType === 'Win' ? 'text-emerald-400' : streakType === 'Loss' ? 'text-red-400' : 'text-zinc-50'}`}>
            {currentStreak} {streakType || '-'}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Consecutive results</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="text-sm font-medium text-zinc-400">Buffer</div>
          <div className="text-2xl font-bold text-zinc-50 mt-1">{lossTradesPossible}</div>
          <div className="text-xs text-zinc-500 mt-1">Loss trades possible</div>
        </div>
      </div>

      {/* Trade Entry Form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-zinc-50">Log Next Trade</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Asset Pair</label>
              <input
                type="text"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. EUR/USD"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Payout %</label>
              <input
                type="number"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                className={`flex h-10 w-full rounded-md border ${isPayoutWarning ? 'border-yellow-500/50 focus:ring-yellow-500' : 'border-zinc-800 focus:ring-emerald-500'} bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2`}
                placeholder="85"
              />
              {isPayoutWarning && (
                <p className="text-xs text-yellow-500 flex items-center mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Payout outside 80-95% range
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Direction</label>
              <div className="flex rounded-md border border-zinc-800 bg-zinc-950 p-1">
                <button
                  onClick={() => setDirection('Call')}
                  className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                    direction === 'Call' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  Call
                </button>
                <button
                  onClick={() => setDirection('Put')}
                  className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                    direction === 'Put' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  Put
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Strategy, mood, etc."
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => handleLogTrade('Win')}
              className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 bg-emerald-500 text-zinc-950 hover:bg-emerald-500/90 h-12 px-8"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Log Win (+${(nextTradeAmount * (payoutNum / 100)).toFixed(2)})
            </button>
            <button
              onClick={() => handleLogTrade('Loss')}
              className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 bg-red-500 text-zinc-950 hover:bg-red-500/90 h-12 px-8"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Log Loss (-${nextTradeAmount.toFixed(2)})
            </button>
          </div>
        </div>
      </div>

      {/* Session Trades */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-medium text-zinc-50">Session Trades</h3>
          <span className="text-sm text-zinc-400">{trades.length} trades logged</span>
        </div>
        <div className="p-0 overflow-x-auto">
          {trades.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No trades logged in this session yet.</div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/80 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium">#</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Asset</th>
                  <th className="px-6 py-3 font-medium">Dir</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Result</th>
                  <th className="px-6 py-3 font-medium">P/L</th>
                  <th className="px-6 py-3 font-medium">Bal After</th>
                  <th className="px-6 py-3 font-medium">Next Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {[...trades].reverse().map((trade) => (
                  <tr key={trade.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-zinc-300 font-medium">{trade.tradeNumber}</td>
                    <td className="px-6 py-4 text-zinc-400">{format(trade.timestamp, 'HH:mm:ss')}</td>
                    <td className="px-6 py-4 text-zinc-300">{trade.asset} <span className="text-zinc-500 text-xs ml-1">{trade.payout}%</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trade.direction === 'Call' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">${trade.tradeAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trade.result === 'Win' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {trade.result}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-medium ${trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">${trade.balanceAfter.toFixed(2)}</td>
                    <td className="px-6 py-4 text-zinc-400 flex items-center">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      ${trade.nextTradeAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
