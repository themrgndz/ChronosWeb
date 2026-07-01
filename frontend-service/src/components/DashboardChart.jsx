import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';

function DashboardChart({ data, visibleLines, selectedTimestamp }) {
  const highlightedPoint = selectedTimestamp ? data.find(p => p.timestamp === selectedTimestamp) : null;

  const formatTooltipValue = (value) => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)} Araç`;
    }
    return value;
  };

  return (
    <div style={{ width: '100%', height: 440 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          
          <XAxis 
            dataKey="timeStr" 
            tick={{ fontSize: 11, fill: '#9ca3af' }} 
            height={60} 
            stroke="#374151"
            angle={-25}          
            textAnchor="end"     
            dy={10}
          />
          
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#374151" />
          
          {/* formatter özelliğini ekleyerek küsürat ameleliğini bitirdik kankam */}
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #374151', color: '#f3f4f6' }}
            itemStyle={{ color: '#f3f4f6' }}
            formatter={formatTooltipValue}
          />
          
          {visibleLines.upperBound && (
            <Line type="monotone" dataKey="upper" stroke="#f59e0b" strokeDasharray="4 4" dot={false} name="Üst Sınır (%95)" isAnimationActive={false} />
          )}
          {visibleLines.lowerBound && (
            <Line type="monotone" dataKey="lower" stroke="#f59e0b" strokeDasharray="4 4" dot={false} name="Alt Sınır (%5)" isAnimationActive={false} />
          )}
          {visibleLines.prediction && (
            <Line type="monotone" dataKey="prediction" stroke="#10b981" strokeDasharray="3 3" dot={false} name="Tahmin (Median)" strokeWidth={2} isAnimationActive={false} />
          )}
          
          {visibleLines.actual && (
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#ef4444" 
              strokeWidth={2.5} 
              // === NOKTALARIN İÇİNİ PARLAK BEYAZ YAPMA DOKUNUŞU ===
              dot={{ r: 3.5, fill: '#ffffff', stroke: '#ef4444', strokeWidth: 2 }} 
              activeDot={{ r: 6, fill: '#ffffff', stroke: '#ef4444', strokeWidth: 2.5 }}
              name="Gerçek Trafik" 
              isAnimationActive={false} 
            />
          )}

          {highlightedPoint && (
            <ReferenceDot
              x={highlightedPoint.timeStr}
              y={highlightedPoint.actual}
              r={12}
              fill="#fbbf24"
              stroke="#ef4444"
              strokeWidth={3}
              isAnimationActive={true}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardChart;