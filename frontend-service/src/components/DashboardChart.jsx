import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';
import { useTheme } from './ThemeProvider';

function DashboardChart({ data, visibleLines, selectedTimestamp }) {
  const highlightedPoint = selectedTimestamp ? data.find(p => p.timestamp === selectedTimestamp) : null;
  
  // Custom hook usage (or check document class)
  // Recharts doesn't natively support dynamic Tailwind classes well, so we pass explicit colors
  const isDark = document.documentElement.classList.contains('dark');
  
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const tooltipBg = isDark ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.9)';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f3f4f6' : '#111827';
  const pointFill = isDark ? '#111827' : '#ffffff';

  const formatTooltipValue = (value) => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)} Araç`;
    }
    return value;
  };

  return (
    <div className="w-full h-[440px] font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          
          <XAxis 
            dataKey="timeStr" 
            tick={{ fontSize: 11, fill: axisColor }} 
            height={60} 
            stroke={gridColor}
            angle={-25}          
            textAnchor="end"     
            dy={10}
            tickLine={false}
          />
          
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{ fontSize: 12, fill: axisColor }} 
            stroke={gridColor}
            tickLine={false}
            axisLine={false}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              backdropFilter: 'blur(12px)',
              borderRadius: '12px', 
              border: `1px solid ${tooltipBorder}`, 
              color: tooltipText,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            itemStyle={{ color: tooltipText, fontWeight: '600' }}
            formatter={formatTooltipValue}
          />
          
          {visibleLines.upperBound && (
            <Line type="monotone" dataKey="upper" stroke="#eab308" strokeDasharray="4 4" dot={false} name="Üst Sınır (%95)" isAnimationActive={false} />
          )}
          {visibleLines.lowerBound && (
            <Line type="monotone" dataKey="lower" stroke="#eab308" strokeDasharray="4 4" dot={false} name="Alt Sınır (%5)" isAnimationActive={false} />
          )}
          {visibleLines.prediction && (
            <Line type="monotone" dataKey="prediction" stroke="#10b981" strokeDasharray="4 4" dot={false} name="Tahmin (Median)" strokeWidth={2.5} isAnimationActive={false} />
          )}
          
          {visibleLines.actual && (
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#ef4444" 
              strokeWidth={3} 
              dot={{ r: 4, fill: pointFill, stroke: '#ef4444', strokeWidth: 2 }} 
              activeDot={{ r: 7, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
              name="Gerçek Trafik" 
              isAnimationActive={false} 
            />
          )}

          {highlightedPoint && (
            <ReferenceDot
              x={highlightedPoint.timeStr}
              y={highlightedPoint.actual}
              r={12}
              fill="rgba(239, 68, 68, 0.2)"
              stroke="#ef4444"
              strokeWidth={2}
              isAnimationActive={true}
            />
          )}
          {highlightedPoint && (
             <ReferenceDot
             x={highlightedPoint.timeStr}
             y={highlightedPoint.actual}
             r={6}
             fill="#ef4444"
             stroke="#fff"
             strokeWidth={2}
             isAnimationActive={true}
           />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardChart;