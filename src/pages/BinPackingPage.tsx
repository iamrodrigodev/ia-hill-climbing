import { useState } from "react";
import { Play, RotateCcw, Settings2 } from "lucide-react";
import * as Label from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { genBP, bpFitness, bpNeighbor, BIN_CAPACITY } from "@/lib/bin-packing";
import { simulatedAnnealing, hillClimbingGeneric, type ResultadoAlgoritmo } from "@/lib/algorithms-generic";
import { ComparisonChart } from "@/components/graph/ComparisonChart";
import { motion } from "framer-motion";

export function BinPackingPage() {
  const [n, setN] = useState<number>(20);
  const [weights, setWeights] = useState<number[]>(() => genBP(20));
  const [weightsText, setWeightsText] = useState<string>(() => weights.join(", "));
  const [resultadoHC, setResultadoHC] = useState<ResultadoAlgoritmo | null>(null);
  const [resultadoSA, setResultadoSA] = useState<ResultadoAlgoritmo | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [saParams, setSaParams] = useState({
    T0: 50,
    alpha: 0.99,
    L: 50,
    maxIter: 5000,
    Tmin: 0.1
  });

  const reiniciarProblema = () => {
    const newWeights = genBP(n);
    setWeights(newWeights);
    setWeightsText(newWeights.join(", "));
    setResultadoHC(null);
    setResultadoSA(null);
  };

  const actualizarPesosManual = (value: string) => {
    setWeightsText(value);
    const newWeights = value
      .split(/[\s,]+/)
      .map((v) => parseInt(v, 10))
      .filter((v) => Number.isFinite(v) && v > 0);

    if (newWeights.length === 0) return;

    setWeights(newWeights);
    setN(newWeights.length);
    setResultadoHC(null);
    setResultadoSA(null);
  };

  const ejecutarAlgoritmos = () => {
    setIsRunning(true);
    const init = Array.from({ length: weights.length }, (_, i) => i);
    
    const hcRes = hillClimbingGeneric(
      init,
      (s) => bpFitness(s, weights, BIN_CAPACITY),
      (s) => bpNeighbor(s, weights, BIN_CAPACITY),
      saParams.maxIter
    );
    
    const saRes = simulatedAnnealing(
      init,
      (s) => bpFitness(s, weights, BIN_CAPACITY),
      (s) => bpNeighbor(s, weights, BIN_CAPACITY),
      saParams
    );
    
    setResultadoHC(hcRes);
    setResultadoSA(saRes);
    setIsRunning(false);
  };

  const getBinLoads = (assignment: number[]) => {
    const loads: Record<number, { load: number; count: number; slack: number }> = {};
    assignment.forEach((binIdx, itemIdx) => {
      if (!loads[binIdx]) loads[binIdx] = { load: 0, count: 0, slack: BIN_CAPACITY };
      loads[binIdx].load += weights[itemIdx];
      loads[binIdx].count += 1;
      loads[binIdx].slack = BIN_CAPACITY - loads[binIdx].load;
    });
    return Object.entries(loads)
      .map(([binIdx, data]) => ({ binIdx: Number(binIdx), ...data }))
      .sort((a, b) => a.binIdx - b.binIdx);
  };

  const getPackingMetrics = (result: ResultadoAlgoritmo) => {
    const loads = getBinLoads(result.solutionRoute);
    const usedCapacity = loads.reduce((sum, bin) => sum + bin.load, 0);
    const totalCapacity = loads.length * BIN_CAPACITY;
    const utilization = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
    const avgSlack = loads.length > 0 ? loads.reduce((sum, bin) => sum + bin.slack, 0) / loads.length : 0;
    const loadValues = loads.map((bin) => bin.load);
    const maxLoad = loadValues.length > 0 ? Math.max(...loadValues) : 0;
    const minLoad = loadValues.length > 0 ? Math.min(...loadValues) : 0;

    return {
      loads,
      bins: loads.length,
      utilization,
      avgSlack,
      balanceGap: maxLoad - minLoad,
      maxLoad,
      improvementPct: result.startCost > 0 ? ((result.startCost - result.solutionCost) / result.startCost) * 100 : 0
    };
  };

  const renderMetricCards = () => {
    if (!resultadoHC || !resultadoSA) return null;
    const hc = getPackingMetrics(resultadoHC);
    const sa = getPackingMetrics(resultadoSA);
    const rows = [
      { label: "Bins usados", hc: hc.bins.toFixed(0), sa: sa.bins.toFixed(0) },
      { label: "Uso promedio", hc: `${hc.utilization.toFixed(1)}%`, sa: `${sa.utilization.toFixed(1)}%` },
      { label: "Holgura media", hc: hc.avgSlack.toFixed(1), sa: sa.avgSlack.toFixed(1) },
      { label: "Diferencia carga", hc: hc.balanceGap.toFixed(0), sa: sa.balanceGap.toFixed(0) },
      { label: "Mejora vs inicial", hc: `${hc.improvementPct.toFixed(1)}%`, sa: `${sa.improvementPct.toFixed(1)}%` }
    ];

    return (
      <div className="metric-grid">
        {rows.map((row) => (
          <div className="metric-compare" key={row.label}>
            <span>{row.label}</span>
            <strong>HC {row.hc}</strong>
            <strong>SA {row.sa}</strong>
          </div>
        ))}
      </div>
    );
  };

  const renderLoadComparisonChart = () => {
    if (!resultadoHC || !resultadoSA) return null;
    const hc = getPackingMetrics(resultadoHC);
    const sa = getPackingMetrics(resultadoSA);
    const maxLoad = Math.max(1, hc.maxLoad, sa.maxLoad, BIN_CAPACITY);
    const maxBins = Math.max(hc.loads.length, sa.loads.length);

    return (
      <div className="comparison-bars">
        {Array.from({ length: maxBins }, (_, index) => {
          const hcLoad = hc.loads[index]?.load ?? 0;
          const saLoad = sa.loads[index]?.load ?? 0;
          return (
            <div className="comparison-row" key={index}>
              <span>Bin {index}</span>
              <div className="comparison-track" aria-label={`HC bin ${index} carga ${hcLoad}`}>
                <i className="bar-hc" style={{ width: `${(hcLoad / maxLoad) * 100}%` }} />
                <b>{hcLoad || "-"}</b>
              </div>
              <div className="comparison-track" aria-label={`SA bin ${index} carga ${saLoad}`}>
                <i className="bar-sa" style={{ width: `${(saLoad / maxLoad) * 100}%` }} />
                <b>{saLoad || "-"}</b>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSlackChart = () => {
    if (!resultadoHC || !resultadoSA) return null;
    const hc = getPackingMetrics(resultadoHC);
    const sa = getPackingMetrics(resultadoSA);
    const maxSlack = Math.max(1, ...hc.loads.map((bin) => bin.slack), ...sa.loads.map((bin) => bin.slack));
    const maxBins = Math.max(hc.loads.length, sa.loads.length);

    return (
      <div className="slack-grid">
        {Array.from({ length: maxBins }, (_, index) => {
          const hcSlack = hc.loads[index]?.slack ?? 0;
          const saSlack = sa.loads[index]?.slack ?? 0;
          return (
            <div className="slack-item" key={index}>
              <span>Bin {index}</span>
              <div className="mini-bars">
                <i className="bar-hc" style={{ height: `${Math.max(6, (hcSlack / maxSlack) * 100)}%` }} title={`HC: ${hcSlack}`} />
                <i className="bar-sa" style={{ height: `${Math.max(6, (saSlack / maxSlack) * 100)}%` }} title={`SA: ${saSlack}`} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVisualSolution = (assignment: number[]) => {
    const bins: Record<number, number[]> = {};
    assignment.forEach((binIdx, itemIdx) => {
      if (!bins[binIdx]) bins[binIdx] = [];
      bins[binIdx].push(weights[itemIdx]);
    });

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        {Object.entries(bins).map(([binIdx, items]) => {
          const totalLoad = items.reduce((a, b) => a + b, 0);
          return (
            <motion.div
              key={binIdx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                width: '100px',
                height: '150px',
                border: '2px solid #333',
                borderRadius: '8px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column-reverse',
                background: '#f9f9f9',
                overflow: 'hidden'
              }}
            >
              {items.map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: `${(w / BIN_CAPACITY) * 150}px`,
                    background: `hsl(${(i * 50) % 360}, 70%, 60%)`,
                    borderTop: '1px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {w}
                </div>
              ))}
              <div style={{
                position: 'absolute',
                top: 0,
                width: '100%',
                textAlign: 'center',
                fontSize: '10px',
                background: 'rgba(255,255,255,0.8)',
                fontWeight: 'bold'
              }}>
                Bin {binIdx} ({totalLoad})
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container page-stack">
      <section className="hero-lite">
        <h1>Bin Packing Problem</h1>
        <p>Empaqueta objetos en la menor cantidad de contenedores de capacidad {BIN_CAPACITY}.</p>
      </section>

      <section className="builder-layout">
        <Card className="canvas-card">
          <CardHeader>
            <CardTitle>Demostración Visual</CardTitle>
            <CardDescription>
              {resultadoHC && resultadoSA ? "Compara la mejor solución encontrada por cada algoritmo" : "Estado actual del problema"}
            </CardDescription>
          </CardHeader>
          <CardContent style={{ minHeight: '300px' }}>
            {resultadoHC && resultadoSA ? (
              <Tabs defaultValue="sa">
                <TabsList>
                  <TabsTrigger value="hc">Hill Climbing</TabsTrigger>
                  <TabsTrigger value="sa">Simulated Annealing</TabsTrigger>
                </TabsList>
                <TabsContent value="hc">
                  <p className="muted-note">Bins usados: {resultadoHC.solutionCost}</p>
                  {renderVisualSolution(resultadoHC.solutionRoute)}
                </TabsContent>
                <TabsContent value="sa">
                  <p className="muted-note">Bins usados: {resultadoSA.solutionCost}</p>
                  {renderVisualSolution(resultadoSA.solutionRoute)}
                </TabsContent>
              </Tabs>
            ) : (
              <p className="muted-note">Ejecuta los algoritmos para ver la distribución.</p>
            )}
          </CardContent>
        </Card>

        <aside className="side-stack">
          <Card>
            <CardHeader>
              <CardTitle>Controles</CardTitle>
            </CardHeader>
            <CardContent className="control-stack">
              <Label.Root className="field-label">Cantidad de objetos (n)</Label.Root>
              <Input 
                type="number" 
                value={n} 
                onChange={(e) => setN(parseInt(e.target.value) || 1)} 
              />
              
              <div className="inline-actions" style={{ marginTop: '0.5rem' }}>
                <Button variant="outline" onClick={reiniciarProblema} className="flex-1">
                  <RotateCcw size={14} /> Aleatorio
                </Button>
                <Button onClick={ejecutarAlgoritmos} disabled={isRunning} className="flex-1">
                  <Play size={14} /> Ejecutar
                </Button>
              </div>

              <details style={{ marginTop: '1rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <Settings2 size={14} style={{ display: 'inline', marginRight: '5px' }} />
                  Hiperparámetros SA
                </summary>
                <div className="control-stack" style={{ paddingTop: '0.5rem' }}>
                  <Label.Root className="field-label">Max Iter</Label.Root>
                  <Input type="number" value={saParams.maxIter} onChange={e => setSaParams({...saParams, maxIter: parseInt(e.target.value)})}/>
                  <Label.Root className="field-label">T0</Label.Root>
                  <Input type="number" value={saParams.T0} onChange={e => setSaParams({...saParams, T0: parseFloat(e.target.value)})}/>
                </div>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pesos de Objetos</CardTitle>
              <CardDescription>Modifica los pesos manualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="ui-input"
                style={{ height: '100px', fontSize: '0.8rem' }}
                value={weightsText}
                onChange={(e) => actualizarPesosManual(e.target.value)}
              />
            </CardContent>
          </Card>
        </aside>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa de Algoritmos</CardTitle>
          <CardDescription>Calidad de solución (menor es mejor)</CardDescription>
        </CardHeader>
        <CardContent>
          {resultadoHC && resultadoSA ? (
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">Gráfica</TabsTrigger>
                <TabsTrigger value="loads">Cargas</TabsTrigger>
                <TabsTrigger value="slack">Holgura</TabsTrigger>
                <TabsTrigger value="metrics">Metricas</TabsTrigger>
                <TabsTrigger value="data">Datos</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">
                <ComparisonChart 
                  hcValues={resultadoHC.historyBest} 
                  saValues={resultadoSA.historyBest} 
                  label="Evolución del Mejor Fitness (Número de Bins)"
                />
              </TabsContent>
              <TabsContent value="loads">
                <div className="chart-shell">
                  <div className="chart-legend">
                    <span><i className="legend-hc" /> Hill Climbing</span>
                    <span><i className="legend-sa" /> Simulated Annealing</span>
                  </div>
                  {renderLoadComparisonChart()}
                </div>
              </TabsContent>
              <TabsContent value="slack">
                <div className="chart-shell">
                  <p className="muted-note">Espacio libre por contenedor. Menos holgura suele indicar mejor compactacion.</p>
                  {renderSlackChart()}
                </div>
              </TabsContent>
              <TabsContent value="metrics">
                {renderMetricCards()}
              </TabsContent>
              <TabsContent value="data">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Algoritmo</th>
                        <th>Bins Usados</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Hill Climbing</td>
                        <td>{resultadoHC.solutionCost}</td>
                        <td>{resultadoHC.stopReason}</td>
                      </tr>
                      <tr>
                        <td>Simulated Annealing</td>
                        <td>{resultadoSA.solutionCost}</td>
                        <td>{resultadoSA.stopReason}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="muted-note">Ejecuta los algoritmos para ver la comparativa.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
