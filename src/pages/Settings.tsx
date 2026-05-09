import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { state, updateSettings, clearAllData } = useApp();
  const { settings } = state;

  const [startingBalance, setStartingBalance] = useState(settings.startingBalance.toString());
  const [minTradeAmount, setMinTradeAmount] = useState(settings.minTradeAmount.toString());
  const [defaultPayout, setDefaultPayout] = useState(settings.defaultPayout.toString());
  const [maxLosses, setMaxLosses] = useState(settings.maxConsecutiveLosses?.toString() || '5');
  const [maxWins, setMaxWins] = useState(settings.maxWins?.toString() || '10');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const navigate = useNavigate();

  // Auto-save settings when they change
  useEffect(() => {
    const newSettings = {
      startingBalance: parseFloat(startingBalance) || settings.startingBalance,
      minTradeAmount: parseFloat(minTradeAmount) || settings.minTradeAmount,
      defaultPayout: parseFloat(defaultPayout) || settings.defaultPayout,
      maxConsecutiveLosses: parseInt(maxLosses) || (settings.maxConsecutiveLosses || 5),
      maxWins: parseInt(maxWins) || (settings.maxWins || 10),
    };
    // Only update if there's an actual change to prevent infinite loops if state objects change
    if (
      newSettings.startingBalance !== settings.startingBalance ||
      newSettings.minTradeAmount !== settings.minTradeAmount ||
      newSettings.defaultPayout !== settings.defaultPayout ||
      newSettings.maxConsecutiveLosses !== settings.maxConsecutiveLosses ||
      newSettings.maxWins !== settings.maxWins
    ) {
      updateSettings(newSettings);
    }
  }, [startingBalance, minTradeAmount, defaultPayout, maxLosses, maxWins, settings, updateSettings]);

  const handleClearData = () => {
    clearAllData();
    setShowConfirmClear(false);
    // Reset local state to defaults
    setStartingBalance('100');
    setMinTradeAmount('1');
    setDefaultPayout('85');
    setMaxLosses('5');
    setMaxWins('10');
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Settings</h1>
        <p className="text-zinc-400 mt-1">Configure your trading parameters and preferences.</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-zinc-50">Trading Parameters</h3>
          <p className="text-sm text-zinc-400 mt-1">These settings apply to new sessions and trades.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Default Starting Balance ($)</label>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-zinc-500">The initial balance when starting a new session.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Minimum Trade Amount ($)</label>
              <input
                type="number"
                value={minTradeAmount}
                onChange={(e) => setMinTradeAmount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-zinc-500">The base amount for your first trade in a sequence.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Default Payout (%)</label>
              <input
                type="number"
                value={defaultPayout}
                onChange={(e) => setDefaultPayout(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-zinc-500">Pre-filled payout percentage for new trades.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Max Consecutive Losses</label>
              <input
                type="number"
                value={maxLosses}
                onChange={(e) => setMaxLosses(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-zinc-500">Session stops after this many consecutive losses.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Session Win Target</label>
              <input
                type="number"
                value={maxWins}
                onChange={(e) => setMaxWins(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-zinc-500">Session stops after reaching this many total wins.</p>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 h-10 px-6 py-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </button>
            <span className="text-sm text-zinc-500 italic">Settings are saved automatically.</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-900/30 bg-red-950/10 overflow-hidden">
        <div className="p-6 border-b border-red-900/30">
          <h3 className="text-lg font-medium text-red-400 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Danger Zone
          </h3>
          <p className="text-sm text-zinc-400 mt-1">Irreversible actions that affect your data.</p>
        </div>
        <div className="p-6">
          {showConfirmClear ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-zinc-300">Are you absolutely sure? This will reset all settings to their default values. Your trade journal will not be affected.</p>
              <div className="flex gap-4">
                <button
                  onClick={handleClearData}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 bg-red-500 text-zinc-950 hover:bg-red-500/90 h-10 px-6 py-2"
                >
                  Yes, Reset Settings
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 border border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 h-10 px-6 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-300">Reset Settings</h4>
                <p className="text-xs text-zinc-500 mt-1">Reset all trading parameters to their default values.</p>
              </div>
              <button
                onClick={() => setShowConfirmClear(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 border border-red-900/50 bg-transparent text-red-400 hover:bg-red-900/30 h-10 px-4 py-2"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
