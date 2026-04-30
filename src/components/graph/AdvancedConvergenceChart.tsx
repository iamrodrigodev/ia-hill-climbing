import React, { useMemo } from "react";

interface AdvancedConvergenceChartProps {
  historyBest: number[];
  historyCurrent: number[];
  smooth?: boolean;
  width?: number;
  height?: number;
}

export function AdvancedConvergenceChart({
  historyBest,
  historyCurrent,
  smooth = true,
  width = 700,
  height = 350,
}: AdvancedConvergenceChartProps) {
  if (historyBest.length === 0) return null;

  const padding = 50;

  // Media móvil para suavizar el historial actual de SA
  const smoothedCurrent = useMemo(() => {
    if (!smooth || historyCurrent.length < 50) return historyCurrent;
    const windowSize = 50;
    const result = [];
    for (let i = 0; i < historyCurrent.length; i++) {
      const start = Math.max(0, i - windowSize / 2);
      const end = Math.min(historyCurrent.length, i + windowSize / 2);
      const window = historyCurrent.slice(start, end);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      result.push(avg);
    }
    return result;
  }, [historyCurrent, smooth]);

  const allValues = [...historyBest, ...historyCurrent];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const scaleX = (i: number) => padding + (i / (historyBest.length - 1)) * (width - padding * 2);
  const scaleY = (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);

  const bestPoints = historyBest
    .map((v, i) => `${scaleX(i)},${scaleY(v)}`)
    .join(" ");
  
  const currentPoints = historyCurrent
    .map((v, i) => `${scaleX(i)},${scaleY(v)}`)
    .join(" ");

  const smoothedPoints = smoothedCurrent
    .map((v, i) => `${scaleX(i)},${scaleY(v)}`)
    .join(" ");

  return (
    <div className="bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Convergencia y Exploración
        </h3>
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Mejor Fitness</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-300 rounded-full" />
            <span>Solución Actual</span>
          </div>
          {smooth && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-600 rounded-full" />
              <span>Tendencia (SA)</span>
            </div>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Ejes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="1" opacity="0.2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeWidth="1" opacity="0.2" />

        {/* Rejilla horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={padding}
            y1={scaleY(min + p * range)}
            x2={width - padding}
            y2={scaleY(min + p * range)}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4 4"
            opacity="0.1"
          />
        ))}

        {/* Línea de historial actual (ruido de exploración) */}
        <polyline
          points={currentPoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="0.5"
          opacity="0.3"
        />

        {/* Línea suavizada (tendencia) */}
        {smooth && (
          <polyline
            points={smoothedPoints}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {/* Línea del mejor fitness (monótona) */}
        <polyline
          points={bestPoints}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
        />

        {/* Etiquetas de los ejes */}
        <text x={padding - 10} y={scaleY(max)} textAnchor="end" fontSize="10" className="fill-muted-foreground">{max.toFixed(0)}</text>
        <text x={padding - 10} y={scaleY(min)} textAnchor="end" fontSize="10" className="fill-muted-foreground">{min.toFixed(0)}</text>
        <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="10" className="fill-muted-foreground">Iteraciones</text>
      </svg>
    </div>
  );
}
