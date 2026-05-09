import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { format } from 'date-fns';
import { Search, Filter, Download, Printer, FileText, Trash2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export function TradeJournal() {
  const { state, updateTrade, clearJournal } = useApp();
  const { sessions } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Flatten all trades and attach session info
  const allTrades = sessions.flatMap((session) =>
    session.trades.map((trade) => ({
      ...trade,
      sessionId: session.id,
      sessionDate: session.startTime,
      sessionStartingBalance: session.startingBalance,
    }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  const filteredTrades = allTrades.filter((trade) =>
    trade.asset.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Session ID', 'Trade #', 'Asset', 'Payout %', 'Direction', 'Amount', 'Result', 'Profit/Loss', 'Balance After', 'Next Amount', 'P/L Total'];
    const rows = allTrades.map(t => [
      format(t.timestamp, 'yyyy-MM-dd'),
      format(t.timestamp, 'HH:mm:ss'),
      t.sessionId,
      t.tradeNumber,
      t.asset,
      t.payout,
      t.direction,
      t.tradeAmount.toFixed(2),
      t.result,
      t.profit.toFixed(2),
      t.balanceAfter.toFixed(2),
      t.nextTradeAmount.toFixed(2),
      (t.balanceAfter - t.sessionStartingBalance).toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trade_journal_${format(Date.now(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePDF = async () => {
    const element = document.getElementById('journal-content');
    if (!element) return;
    
    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        backgroundColor: '#18181b', // zinc-950
        pixelRatio: 2
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: 'letter'
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`trade_journal_${format(Date.now(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    }
  };

  const handleClearJournal = () => {
    clearJournal();
    setShowConfirmClear(false);
  };

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Trade Journal</h1>
          <p className="text-zinc-400 mt-1">Review and manage all your historical trades.</p>
        </div>
        <div className="flex gap-2">
          {showConfirmClear ? (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 rounded-md p-1 px-3">
              <span className="text-sm text-zinc-300 mr-2">Are you sure?</span>
              <button
                onClick={handleClearJournal}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 bg-red-500 text-zinc-950 hover:bg-red-500/90 h-8 px-3 py-1"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 border border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 h-8 px-3 py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 border border-red-900/50 bg-red-500/10 text-red-500 hover:bg-red-500/20 h-10 px-4 py-2"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Journal
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 border border-amber-900/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 h-10 px-4 py-2"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </button>
          <button
            onClick={handleSavePDF}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 border border-amber-900/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 h-10 px-4 py-2"
          >
            <FileText className="mr-2 h-4 w-4" />
            Save as PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 h-10 px-4 py-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div id="journal-content" className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden print:border-none print:bg-transparent">
        <div className="p-4 border-b border-zinc-800 flex gap-4 print:hidden">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 pl-10 pr-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 border border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 h-10 px-4 py-2">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="p-0 overflow-x-auto">
          {filteredTrades.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No trades found matching your criteria.</div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/80 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Date & Time</th>
                  <th className="px-6 py-3 font-medium">Asset</th>
                  <th className="px-6 py-3 font-medium">Direction</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Result</th>
                  <th className="px-6 py-3 font-medium">P/L</th>
                  <th className="px-6 py-3 font-medium">Bal After</th>
                  <th className="px-6 py-3 font-medium">P/L Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredTrades.map((trade) => {
                  const tradePL = trade.balanceAfter - trade.sessionStartingBalance;
                  return (
                    <tr key={trade.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-zinc-300">
                        <div className="font-medium">{format(trade.timestamp, 'MMM d, yyyy')}</div>
                        <div className="text-xs text-zinc-500">{format(trade.timestamp, 'HH:mm:ss')}</div>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {trade.asset} <span className="text-zinc-500 text-xs ml-1">{trade.payout}%</span>
                      </td>
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
                      <td className={`px-6 py-4 font-medium ${tradePL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tradePL >= 0 ? '+' : ''}{tradePL.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
