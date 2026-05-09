import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TradeDirection = 'Call' | 'Put';
export type TradeResult = 'Win' | 'Loss';
export type SessionStatus = 'active' | 'completed' | 'stopped_loss_limit' | 'stopped_win_limit';

export interface Trade {
  id: string;
  tradeNumber: number;
  timestamp: number;
  asset: string;
  payout: number;
  direction: TradeDirection;
  result: TradeResult;
  tradeAmount: number;
  profit: number;
  balanceAfter: number;
  nextTradeAmount: number;
}

export interface Session {
  id: string;
  startTime: number;
  endTime: number | null;
  status: SessionStatus;
  startingBalance: number;
  currentBalance: number;
  trades: Trade[];
}

export interface Settings {
  startingBalance: number;
  minTradeAmount: number;
  defaultPayout: number;
  maxConsecutiveLosses: number;
  maxWins: number;
}

interface AppState {
  settings: Settings;
  sessions: Session[];
  activeSessionId: string | null;
}

interface AppContextType {
  state: AppState;
  updateSettings: (settings: Partial<Settings>) => void;
  startSession: () => void;
  endSession: () => void;
  resumeSession: () => void;
  addTrade: (trade: Omit<Trade, 'id' | 'tradeNumber' | 'profit' | 'balanceAfter' | 'nextTradeAmount'>) => void;
  updateTrade: (sessionId: string, tradeId: string, updates: Partial<Trade>) => void;
  deleteSession: (sessionId: string) => void;
  clearAllData: () => void;
  clearJournal: () => void;
}

const defaultSettings: Settings = {
  startingBalance: 100,
  minTradeAmount: 1,
  defaultPayout: 85,
  maxConsecutiveLosses: 5,
  maxWins: 10,
};

const initialState: AppState = {
  settings: defaultSettings,
  sessions: [],
  activeSessionId: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('binary-trading-manager');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem('binary-trading-manager', JSON.stringify(state));
  }, [state]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setState((prev) => {
      const updatedSettings = { ...prev.settings, ...newSettings };
      let updatedSessions = prev.sessions;

      if (prev.activeSessionId) {
        updatedSessions = prev.sessions.map((session) => {
          if (session.id === prev.activeSessionId && session.status === 'active') {
            let consecutiveLosses = 0;
            for (let i = session.trades.length - 1; i >= 0; i--) {
              if (session.trades[i].result === 'Loss') {
                consecutiveLosses++;
              } else {
                break;
              }
            }
            const wins = session.trades.filter((t) => t.result === 'Win').length;
            
            if (consecutiveLosses >= updatedSettings.maxConsecutiveLosses) {
              return { ...session, status: 'stopped_loss_limit', endTime: Date.now() };
            } else if (wins >= updatedSettings.maxWins) {
              return { ...session, status: 'stopped_win_limit', endTime: Date.now() };
            }
          }
          return session;
        });
      }

      return {
        ...prev,
        settings: updatedSettings,
        sessions: updatedSessions,
      };
    });
  };

  const startSession = () => {
    setState((prev) => {
      const activeSession = prev.sessions.find(s => s.id === prev.activeSessionId);
      if (activeSession && activeSession.status === 'active') return prev; // Already active

      const newSession: Session = {
        id: crypto.randomUUID(),
        startTime: Date.now(),
        endTime: null,
        status: 'active',
        startingBalance: prev.settings.startingBalance,
        currentBalance: prev.settings.startingBalance,
        trades: [],
      };

      return {
        ...prev,
        sessions: [newSession, ...prev.sessions],
        activeSessionId: newSession.id,
      };
    });
  };

  const endSession = () => {
    setState((prev) => {
      if (!prev.activeSessionId) return prev;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === prev.activeSessionId
            ? { ...s, endTime: Date.now(), status: s.status === 'active' ? 'completed' : s.status }
            : s
        ),
      };
    });
  };

  const resumeSession = () => {
    setState((prev) => {
      if (!prev.activeSessionId) return prev;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === prev.activeSessionId
            ? { ...s, status: 'active', endTime: null }
            : s
        ),
      };
    });
  };

  const addTrade = (tradeInput: Omit<Trade, 'id' | 'tradeNumber' | 'profit' | 'balanceAfter' | 'nextTradeAmount'>) => {
    setState((prev) => {
      if (!prev.activeSessionId) return prev;

      const sessionIndex = prev.sessions.findIndex((s) => s.id === prev.activeSessionId);
      if (sessionIndex === -1) return prev;

      const session = prev.sessions[sessionIndex];
      if (session.status !== 'active') return prev;

      const tradeNumber = session.trades.length + 1;
      
      let profit = 0;
      let balanceAfter = session.currentBalance;
      let nextTradeAmount = prev.settings.minTradeAmount;

      let state = 'Step1';
      for (const t of session.trades) {
        if (t.result === 'Loss') {
          state = 'Recovery';
        } else if (t.result === 'Win') {
          if (state === 'Recovery') {
            state = 'Step1';
          } else if (state === 'Step1') {
            state = 'Step2';
          } else if (state === 'Step2') {
            state = 'Step1';
          }
        }
      }

      const isMaxTrade = tradeInput.tradeAmount === session.currentBalance;

      if (tradeInput.result === 'Win') {
        profit = tradeInput.tradeAmount * (tradeInput.payout / 100);
        balanceAfter = session.currentBalance + profit;
        
        if (isMaxTrade) {
          nextTradeAmount = prev.settings.minTradeAmount;
        } else if (state === 'Step1') {
          nextTradeAmount = tradeInput.tradeAmount + (0.5 * tradeInput.tradeAmount);
        } else {
          nextTradeAmount = prev.settings.minTradeAmount;
        }
      } else {
        profit = -tradeInput.tradeAmount;
        balanceAfter = session.currentBalance - tradeInput.tradeAmount;
        if (isMaxTrade) {
          nextTradeAmount = prev.settings.minTradeAmount;
        } else {
          nextTradeAmount = tradeInput.tradeAmount * 2.3;
        }
      }

      const newTrade: Trade = {
        ...tradeInput,
        id: crypto.randomUUID(),
        tradeNumber,
        profit,
        balanceAfter,
        nextTradeAmount,
      };

      const newTrades = [...session.trades, newTrade];
      
      // Check rules
      let consecutiveLosses = 0;
      for (let i = newTrades.length - 1; i >= 0; i--) {
        if (newTrades[i].result === 'Loss') {
          consecutiveLosses++;
        } else {
          break;
        }
      }
      const wins = newTrades.filter(t => t.result === 'Win').length;
      
      let newStatus = session.status;
      let activeSessionId = prev.activeSessionId;
      let endTime = session.endTime;

      if (consecutiveLosses >= prev.settings.maxConsecutiveLosses) {
        newStatus = 'stopped_loss_limit';
        endTime = Date.now();
      } else if (wins >= prev.settings.maxWins) {
        newStatus = 'stopped_win_limit';
        endTime = Date.now();
      }

      const updatedSession: Session = {
        ...session,
        currentBalance: balanceAfter,
        trades: newTrades,
        status: newStatus,
        endTime,
      };

      const newSessions = [...prev.sessions];
      newSessions[sessionIndex] = updatedSession;

      return {
        ...prev,
        sessions: newSessions,
        activeSessionId,
      };
    });
  };

  const updateTrade = (sessionId: string, tradeId: string, updates: Partial<Trade>) => {
    // For simplicity, we only allow updating notes or non-calculated fields.
    // Recalculating the whole session if a past trade changes is complex, so we'll just allow simple edits.
    setState((prev) => {
      const newSessions = prev.sessions.map(s => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          trades: s.trades.map(t => t.id === tradeId ? { ...t, ...updates } : t)
        };
      });
      return { ...prev, sessions: newSessions };
    });
  };

  const deleteSession = (sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId),
      activeSessionId: prev.activeSessionId === sessionId ? null : prev.activeSessionId
    }));
  };

  const clearAllData = () => {
    setState((prev) => ({
      ...prev,
      settings: defaultSettings,
    }));
  };

  const clearJournal = () => {
    setState((prev) => ({
      ...prev,
      sessions: [],
      activeSessionId: null,
    }));
  };

  return (
    <AppContext.Provider value={{ state, updateSettings, startSession, endSession, resumeSession, addTrade, updateTrade, deleteSession, clearAllData, clearJournal }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
