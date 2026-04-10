interface RouteCostChartProps {
  values: number[];
}

export function RouteCostChart({ values }: RouteCostChartProps) {
  if (values.length < 2) {
    return <p className="muted-copy">Sin suficientes puntos para dibujar la curva de costos.</p>;
  }

  const width = 640;
  const height = 220;
  const padding = 26;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scaleY = (value: number) => {
    if (max === min) return height / 2;
    return height - padding - ((value - min) / (max - min)) * (height - padding * 2);
  };

  const scaleX = (index: number) => padding + (index / (values.length - 1)) * (width - padding * 2);
  const points = values.map((value, index) => `${scaleX(index)},${scaleY(value)}`).join(" ");

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución de costo por iteración">
        <path d={`M ${padding} ${height - padding} L ${width - padding} ${height - padding}`} className="chart-axis" />
        <polyline points={points} className="chart-line" />
        {values.map((value, index) => (
          <g key={`${value}-${index}`}>
            <circle cx={scaleX(index)} cy={scaleY(value)} r={4} className="chart-dot" />
            <text x={scaleX(index)} y={scaleY(value) - 10} className="chart-label">
              {value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
