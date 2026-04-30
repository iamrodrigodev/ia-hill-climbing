interface ComparisonChartProps {
  hcValues: number[];
  saValues: number[];
  label?: string;
}

export function ComparisonChart({ hcValues, saValues, label }: ComparisonChartProps) {
  if (hcValues.length < 2 && saValues.length < 2) {
    return <p className="muted-copy">Sin suficientes puntos para dibujar la comparativa.</p>;
  }

  const width = 640;
  const height = 300;
  const padding = 40;
  
  const allValues = [...hcValues, ...saValues];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  
  const scaleY = (value: number) => {
    if (max === min) return height / 2;
    return height - padding - ((value - min) / (max - min)) * (height - padding * 2);
  };

  const scaleX = (index: number, length: number) => 
    padding + (index / (length - 1)) * (width - padding * 2);

  const hcPoints = hcValues.length > 0 
    ? hcValues.map((v, i) => `${scaleX(i, hcValues.length)},${scaleY(v)}`).join(" ")
    : "";
    
  const saPoints = saValues.length > 0
    ? saValues.map((v, i) => `${scaleX(i, saValues.length)},${scaleY(v)}`).join(" ")
    : "";

  return (
    <div className="chart-shell">
      {label && <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{label}</p>}
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Comparativa de algoritmos">
        <path d={`M ${padding} ${height - padding} L ${width - padding} ${height - padding}`} className="chart-axis" />
        <path d={`M ${padding} ${padding} L ${padding} ${height - padding}`} className="chart-axis" />
        
        {hcPoints && <polyline points={hcPoints} stroke="#E74C3C" strokeWidth="2" fill="none" />}
        {saPoints && <polyline points={saPoints} stroke="#2980B9" strokeWidth="2" fill="none" />}
        
        <g transform={`translate(${width - 100}, ${padding})`}>
          <rect width="10" height="10" fill="#E74C3C" />
          <text x="15" y="10" fontSize="10">Hill Climbing</text>
          <rect y="15" width="10" height="10" fill="#2980B9" />
          <text x="15" y="25" fontSize="10">Simulated Annealing</text>
        </g>

        <text x={padding - 5} y={scaleY(max)} textAnchor="end" fontSize="10">{max.toFixed(1)}</text>
        <text x={padding - 5} y={scaleY(min)} textAnchor="end" fontSize="10">{min.toFixed(1)}</text>
        <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="10">Iteraciones</text>
      </svg>
    </div>
  );
}
