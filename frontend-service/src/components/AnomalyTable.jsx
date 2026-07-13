import React, { useEffect, useRef } from 'react';
import { ShieldAlert, ActivitySquare } from 'lucide-react';

function AnomalyTable({ anomalies, liveLogs, onLogSelect, selectedTimestamp }) {
  const liveConsoleRef = useRef(null);

  useEffect(() => {
    if (liveConsoleRef.current) {
      liveConsoleRef.current.scrollTop = liveConsoleRef.current.scrollHeight;
    }
  }, [liveLogs]);

  const renderLogLine = (log, isAnomalyOnly) => {
    const isSelected = selectedTimestamp === log.timestamp;
    
    let baseColor = 'text-gray-500 dark:text-gray-400';
    let highlightColor = 'text-gray-800 dark:text-gray-200';
    let badgeStyle = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';

    if (log.type === 'AŞIRI YOĞUN') {
      baseColor = 'text-red-500 dark:text-red-400';
      highlightColor = 'text-red-600 dark:text-red-300';
      badgeStyle = 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
    } else if (log.type === 'AŞIRI TENHA') {
      baseColor = 'text-blue-500 dark:text-blue-400';
      highlightColor = 'text-blue-600 dark:text-blue-300';
      badgeStyle = 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    }

    return (
      <div 
        key={`${log.timestamp}-${log.type}-${isAnomalyOnly ? 'anomaly' : 'live'}`}
        className={`
          flex items-center justify-between p-3 rounded-lg border border-transparent
          transition-all duration-200 group
          ${isSelected ? 'bg-gray-100 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 shadow-inner' : 'hover:bg-gray-50 dark:hover:bg-white/5'}
        `}
      >
        <div className={`flex-1 font-mono text-sm ${baseColor} flex items-center gap-3`}>
          <span className="text-gray-400 dark:text-gray-500 w-32 shrink-0">[{log.timeStr}]</span>
          
          <div className="flex items-center gap-4 flex-1">
             <span className="flex items-center gap-1">
               <span className="text-gray-400 dark:text-gray-500 text-xs uppercase">Trf</span>
               <span className={`font-bold ${highlightColor}`}>{String(log.value).padEnd(2)}</span>
             </span>
             
             <span className="flex items-center gap-1">
               <span className="text-gray-400 dark:text-gray-500 text-xs uppercase">Bkl</span>
               <span className="text-emerald-500 font-medium">{String(Math.round(log.prediction)).padEnd(2)}</span>
             </span>

             <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${badgeStyle}`}>
               {log.type}
             </span>
          </div>
        </div>

        {log.type !== 'NORMAL' && (
          <button
            onClick={() => onLogSelect(isSelected ? null : log.timestamp)}
            className={`
              px-3 py-1 rounded-md text-xs font-bold transition-all
              ${isSelected 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' 
                : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-500 hover:text-yellow-900 dark:hover:text-gray-900 border border-yellow-200 dark:border-yellow-500/30'
              }
            `}
          >
            {isSelected ? 'Kaldır' : 'İncele'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      
      {/* SOL PANEL */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-red-500 dark:text-red-400 font-bold text-sm uppercase tracking-wide">
          <ShieldAlert className="w-4 h-4" /> Sabitlenmiş İhlaller ({anomalies.length})
        </div>
        <div className="bg-white dark:bg-[#05070f] border border-gray-200 dark:border-gray-800 rounded-xl p-2 h-[320px] overflow-y-auto shadow-inner custom-scrollbar transition-colors duration-500">
          {anomalies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 font-mono text-sm">
               <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
               Henüz anomali olayı yakalanmadı.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {anomalies.map(log => renderLogLine(log, true))}
            </div>
          )}
        </div>
      </div>

      {/* SAĞ PANEL */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-sm uppercase tracking-wide">
          <ActivitySquare className="w-4 h-4" /> Canlı Sunucu Akışı (Maks 40)
        </div>
        <div 
          ref={liveConsoleRef}
          className="bg-white dark:bg-[#05070f] border border-gray-200 dark:border-gray-800 rounded-xl p-2 h-[320px] overflow-y-auto shadow-inner custom-scrollbar relative transition-colors duration-500"
        >
          <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white dark:from-[#05070f] to-transparent pointer-events-none z-10"></div>
          <div className="flex flex-col gap-1 pt-2">
            {liveLogs.map(log => renderLogLine(log, false))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default AnomalyTable;