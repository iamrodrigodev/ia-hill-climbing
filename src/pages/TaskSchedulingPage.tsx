import { useState } from "react";
import { Play, RotateCcw, Settings2 } from "lucide-react";
import * as Label from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { genTS, tsFitness, tsNeighbor, N_PROC_DEF } from "@/lib/task-scheduling";
import { simulatedAnnealing, hillClimbingGeneric, type ResultadoAlgoritmo } from "@/lib/algorithms-generic";
import { ComparisonChart } from "@/components/graph/ComparisonChart";
import { motion } from "framer-motion";

export function TaskSchedulingPage() {
  const [n, setN] = useState<number>(15);
  const [m, setM] = useState<number>(N_PROC_DEF);
  const [durations, setDurations] = useState<number[]>(() => genTS(15));
  const [durationsText, setDurationsText] = useState<string>(() => durations.join(", "));
  const [resultadoHC, setResultadoHC] = useState<ResultadoAlgoritmo | null>(null);
  const [resultadoSA, setResultadoSA] = useState<ResultadoAlgoritmo | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [saParams, setSaParams] = useState({
    T0: 100,
    alpha: 0.99,
    L: 50,
    maxIter: 5000,
    Tmin: 0.1
  });

  const reiniciarProblema = () => {
    const newDurations = genTS(n);
    setDurations(newDurations);
    setDurationsText(newDurations.join(", "));
    setResultadoHC(null);
    setResultadoSA(null);
  };

  const actualizarDuracionesManual = (value: string) => {
    setDurationsText(value);
    const newDurations = value
      .split(/[\s,]+/)
      .map((v) => parseInt(v, 10))
      .filter((v) => Number.isFinite(v) && v > 0);

    if (newDurations.length === 0) return;

    setDurations(newDurations);
    setN(newDurations.length);
    setResultadoHC(null);
    setResultadoSA(null);
  };

  const ejecutarAlgoritmos = () => {
    setIsRunning(true);
    const init = Array.from({ length: durations.length }, () => Math.floor(Math.random() * m));
    
    const hcRes = hillClimbingGeneric(
      init,
      (s) => tsFitness(s, durations, m),
      (s) => tsNeighbor(s, durations, m),
      saParams.maxIter
    );
    
    const saRes = simulatedAnnealing(
      init,
      (s) => tsFitness(s, durations, m),
      (s) => tsNeighbor(s, durations, m),
      saParams
    );
    
    setResultadoHC(hcRes);
    setResultadoSA(saRes);
    setIsRunning(false);
  };

  const getProcessorLoads = (assignment: number[]) => {
    const processors = Array.from({ length: m }, (_, procIdx) => ({
      procIdx,
      load: 0,
      count: 0,
      idle: 0
    }));

    assignment.forEach((procIdx, taskIdx) => {
      if (!processors[procIdx]) return;
      processors[procIdx].load += durations[taskIdx];
      processors[procIdx].count += 1;
    });

    const makespan = Math.max(1, ...processors.map((proc) => proc.load));
    return processors.map((proc) => ({
      ...proc,
      idle: makespan - proc.load
    }));
  };

  const getSchedulingMetrics = (result: ResultadoAlgoritmo) => {
    const processors = getProcessorLoads(result.solutionRoute);
    const loads = processors.map((proc) => proc.load);
    const makespan = Math.max(0, ...loads);
    const minLoad = Math.min(...loads);
    const avgLoad = loads.reduce((sum, load) => sum + load, 0) / Math.max(1, loads.length);
    const idleTotal = processors.reduce((sum, proc) => sum + proc.idle, 0);
    const utilization = makespan > 0 ? (avgLoad / makespan) * 100 : 0;

    return {
      processors,
      makespan,
      minLoad,
      avgLoad,
      idleTotal,
      utilization,
      imbalance: makespan - minLoad,
      improvementPct: result.startCost > 0 ? ((result.startCost - result.solutionCost) / result.startCost) * 100 : 0
    };
  };

  const renderMetricCards = () => {
    if (!resultadoHC || !resultadoSA) return null;
    const hc = getSchedulingMetrics(resultadoHC);
    const sa = getSchedulingMetrics(resultadoSA);
    const rows = [
      { label: "Makespan", hc: hc.makespan.toFixed(0), sa: sa.makespan.toFixed(0) },
      { label: "Uso promedio", hc: `${hc.utilization.toFixed(1)}%`, sa: `${sa.utilization.toFixed(1)}%` },
      { label: "Ocio total", hc: hc.idleTotal.toFixed(0), sa: sa.idleTotal.toFixed(0) },
      { label: "Desbalance", hc: hc.imbalance.toFixed(0), sa: sa.imbalance.toFixed(0) },
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
    const hc = getSchedulingMetrics(resultadoHC);
    const sa = getSchedulingMetrics(resultadoSA);
    const maxLoad = Math.max(1, hc.makespan, sa.makespan);

    return (
      <div className="comparison-bars">
        {Array.from({ length: m }, (_, index) => {
          const hcLoad = hc.processors[index]?.load ?? 0;
          const saLoad = sa.processors[index]?.load ?? 0;
          return (
            <div className="comparison-row" key={index}>
              <span>Proc {index}</span>
              <div className="comparison-track" aria-label={`HC procesador ${index} carga ${hcLoad}`}>
                <i className="bar-hc" style={{ width: `${(hcLoad / maxLoad) * 100}%` }} />
                <b>{hcLoad || "-"}</b>
              </div>
              <div className="comparison-track" aria-label={`SA procesador ${index} carga ${saLoad}`}>
                <i className="bar-sa" style={{ width: `${(saLoad / maxLoad) * 100}%` }} />
                <b>{saLoad || "-"}</b>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderIdleChart = () => {
    if (!resultadoHC || !resultadoSA) return null;
    const hc = getSchedulingMetrics(resultadoHC);
    const sa = getSchedulingMetrics(resultadoSA);
    const maxIdle = Math.max(1, ...hc.processors.map((proc) => proc.idle), ...sa.processors.map((proc) => proc.idle));

    return (
      <div className="slack-grid">
        {Array.from({ length: m }, (_, index) => {
          const hcIdle = hc.processors[index]?.idle ?? 0;
          const saIdle = sa.processors[index]?.idle ?? 0;
          return (
            <div className="slack-item" key={index}>
              <span>Proc {index}</span>
              <div className="mini-bars">
                <i className="bar-hc" style={{ height: `${Math.max(6, (hcIdle / maxIdle) * 100)}%` }} title={`HC: ${hcIdle}`} />
                <i className="bar-sa" style={{ height: `${Math.max(6, (saIdle / maxIdle) * 100)}%` }} title={`SA: ${saIdle}`} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVisualSolution = (assignment: number[]) => {
    const procs: Record<number, number[]> = {};
    for (let i = 0; i < m; i++) procs[i] = [];
    assignment.forEach((procIdx, taskIdx) => {
      procs[procIdx].push(durations[taskIdx]);
    });

    const maxMakespan = Math.max(...Object.values(procs).map(p => p.reduce((a, b) => a + b, 0)), 1);

    return (
      <div style={{ display: 'grid', gap: '1rem', width: '100%' }}>
        {Object.entries(procs).map(([procIdx, tasks]) => {
          const totalLoad = tasks.reduce((a, b) => a + b, 0);
          return (
            <div key={procIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '60px', fontWeight: 'bold', fontSize: '0.8rem' }}>Proc {procIdx}</div>
              <div style={{
                flex: 1,
                height: '30px',
                background: '#eee',
                borderRadius: '4px',
                display: 'flex',
                overflow: 'hidden',
                border: '1px solid #ccc'
              }}>
                {tasks.map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 0 }}
                    animate={{ width: `${(d / maxMakespan) * 100}%` }}
                    style={{
                      height: '100%',
                      background: `hsl(${(i * 70) % 360}, 60%, 55%)`,
                      borderRight: '1px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: 'white',
                      overflow: 'hidden'
                    }}
                  >
                    {d}
                  </motion.div>
                ))}
              </div>
              <div style={{ width: '40px', fontSize: '0.8rem', fontWeight: 'bold' }}>{totalLoad}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container page-stack">
      <section className="hero-lite">
        <h1>Task Scheduling (Makespan)</h1>
        <p>Distribuye tareas entre {m} procesadores para minimizar el tiempo de finalización total (Makespan).</p>
      </section>

      <section className="builder-layout">
        <Card className="canvas-card">
          <CardHeader>
            <CardTitle>Carga de Procesadores</CardTitle>
            <CardDescription>
              {resultadoHC && resultadoSA ? "Compara la carga final encontrada por cada algoritmo" : "Carga actual por procesador"}
            </CardDescription>
          </CardHeader>
          <CardContent style={{ padding: '2rem' }}>
            {resultadoHC && resultadoSA ? (
              <Tabs defaultValue="sa">
                <TabsList>
                  <TabsTrigger value="hc">Hill Climbing</TabsTrigger>
                  <TabsTrigger value="sa">Simulated Annealing</TabsTrigger>
                </TabsList>
                <TabsContent value="hc">
                  <p className="muted-note">Makespan: {resultadoHC.solutionCost}</p>
                  {renderVisualSolution(resultadoHC.solutionRoute)}
                </TabsContent>
                <TabsContent value="sa">
                  <p className="muted-note">Makespan: {resultadoSA.solutionCost}</p>
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
              <Label.Root className="field-label">Cantidad de tareas (n)</Label.Root>
              <Input type="number" value={n} onChange={(e) => setN(parseInt(e.target.value) || 1)} />
              
              <Label.Root className="field-label">Procesadores (m)</Label.Root>
              <Input type="number" value={m} onChange={(e) => setM(parseInt(e.target.value) || 1)} />

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
              <CardTitle>Duración de Tareas</CardTitle>
              <CardDescription>Modifica los tiempos manualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="ui-input"
                style={{ height: '100px', fontSize: '0.8rem' }}
                value={durationsText}
                onChange={(e) => actualizarDuracionesManual(e.target.value)}
              />
            </CardContent>
          </Card>
        </aside>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Comparativa de Algoritmos</CardTitle>
          <CardDescription>Makespan (menor es mejor)</CardDescription>
        </CardHeader>
        <CardContent>
          {resultadoHC && resultadoSA ? (
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">Gráfica</TabsTrigger>
                <TabsTrigger value="loads">Cargas</TabsTrigger>
                <TabsTrigger value="idle">Ocio</TabsTrigger>
                <TabsTrigger value="metrics">Metricas</TabsTrigger>
                <TabsTrigger value="data">Datos</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">
                <ComparisonChart 
                  hcValues={resultadoHC.historyBest} 
                  saValues={resultadoSA.historyBest} 
                  label="Evolución del Mejor Fitness (Makespan)"
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
              <TabsContent value="idle">
                <div className="chart-shell">
                  <p className="muted-note">Tiempo ocioso respecto al makespan de cada algoritmo. Menos ocio implica mejor balance.</p>
                  {renderIdleChart()}
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
                        <th>Makespan</th>
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
