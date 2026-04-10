import { useMemo, useState } from "react";
import { MousePointer2, PlusCircle, Share2, Trash2, Play, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import * as Label from "@radix-ui/react-label";
import {
  cloneGraph,
  getEdgeCost,
  hillClimb,
  isRouteValid,
  parseRoute,
  routeToString,
} from "@/lib/hill-climbing";
import { presets } from "@/lib/mock-data";
import { BASE_POSITIONS, formatDefaultRoute, nextNodeId, parseIterations, removeNode, upsertEdge, type Point } from "@/lib/simulator-helpers";
import type { HillClimbResult, WeightedGraph } from "@/lib/types";
import { GraphCanvas, type EditorMode } from "@/components/graph/GraphCanvas";
import { SearchTreeView } from "@/components/graph/SearchTreeView";
import { RouteCostChart } from "@/components/graph/RouteCostChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export function SimulatorPage() {
  const [graph, setGraph] = useState<WeightedGraph>({ nodes: [], edges: [] });
  const [positions, setPositions] = useState<Record<number, Point>>({});
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [mode, setMode] = useState<EditorMode>("select");
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [pendingEdgeFromId, setPendingEdgeFromId] = useState<number | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);

  const [routeInput, setRouteInput] = useState("");
  const [maxIterationsInput, setMaxIterationsInput] = useState("30");
  const [result, setResult] = useState<HillClimbResult | null>(null);
  const [selectedIteration, setSelectedIteration] = useState(1);

  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [edgeDialogTarget, setEdgeDialogTarget] = useState<number | null>(null);
  const [edgeWeightInput, setEdgeWeightInput] = useState("100");
  const [edgeBidirectional, setEdgeBidirectional] = useState(true);

  const activeIteration = result?.iterations.find((iteration) => iteration.iteration === selectedIteration) ?? null;
  const activeRoute = activeIteration?.currentRoute ?? result?.solutionRoute;

  const costSeries = useMemo(() => {
    if (!result) return [];
    const values = [result.startCost];
    result.iterations.forEach((iteration) => {
      if (iteration.moved) values.push(iteration.bestNeighbor.cost);
    });
    return values;
  }, [result]);

  const setEditorMode = (nextMode: EditorMode) => {
    setMode(nextMode);
    if (nextMode !== "add-edge") setPendingEdgeFromId(null);
    if (nextMode !== "select") setSelectedNodeId(null);
  };

  const handleCanvasClick = (x: number, y: number) => {
    if (mode === "add-node") {
      const nodeId = nextNodeId(graph.nodes);
      setGraph((prev) => ({ ...prev, nodes: [...prev.nodes, nodeId] }));
      setPositions((prev) => ({ ...prev, [nodeId]: { x, y } }));
      setLabels((prev) => ({ ...prev, [nodeId]: String(nodeId) }));
      if (!routeInput) setRouteInput(formatDefaultRoute([...graph.nodes, nodeId]));
      toast.success(`Nodo ${nodeId} agregado.`);
      return;
    }

    if (mode === "select") {
      setSelectedNodeId(null);
    }
  };

  const handleNodeClick = (nodeId: number) => {
    if (mode === "delete") {
      setGraph((prev) => removeNode(prev, nodeId));
      setPositions((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
      setLabels((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      toast.success(`Nodo ${nodeId} eliminado.`);
      return;
    }

    if (mode === "add-edge") {
      if (pendingEdgeFromId === null) {
        setPendingEdgeFromId(nodeId);
        toast.info(`Nodo origen: ${nodeId}. Ahora elige un nodo destino.`);
        return;
      }

      if (pendingEdgeFromId === nodeId) {
        toast.error("Selecciona un nodo destino distinto.");
        return;
      }

      setEdgeDialogTarget(nodeId);
      setEdgeDialogOpen(true);
      return;
    }

    setSelectedNodeId(nodeId);
  };

  const handleEdgeClick = (edgeId: string) => {
    if (mode !== "delete") return;
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((edge) => edge.id !== edgeId),
    }));
    toast.success("Conexion eliminada.");
  };

  const confirmEdgeCreation = () => {
    if (pendingEdgeFromId === null || edgeDialogTarget === null) {
      setEdgeDialogOpen(false);
      return;
    }

    const weight = Math.max(1, Math.floor(Number(edgeWeightInput)));
    if (!Number.isFinite(weight)) {
      toast.error("El peso debe ser numerico.");
      return;
    }

    setGraph((prev) => upsertEdge(prev, pendingEdgeFromId, edgeDialogTarget, weight, edgeBidirectional));
    setEdgeDialogOpen(false);
    setPendingEdgeFromId(null);
    setEdgeDialogTarget(null);
    setEdgeWeightInput("100");
    setEdgeBidirectional(true);
    toast.success("Conexion creada.");
  };

  const runAlgorithm = () => {
    if (graph.nodes.length < 2) {
      toast.error("Agrega al menos 2 nodos para ejecutar el algoritmo.");
      return;
    }

    const route = parseRoute(routeInput);
    if (!isRouteValid(route, graph.nodes)) {
      toast.error("Ruta invalida. Debe incluir exactamente todos los nodos del grafo.");
      return;
    }

    for (let i = 0; i < route.length - 1; i += 1) {
      const cost = getEdgeCost(graph, route[i], route[i + 1]);
      if (!Number.isFinite(cost)) {
        toast.error(`No existe conexion entre ${route[i]} y ${route[i + 1]}.`);
        return;
      }
    }

    const next = hillClimb(graph, route, parseIterations(maxIterationsInput));
    setResult(next);
    setSelectedIteration(1);
    toast.success(`Resultado: ${routeToString(next.solutionRoute)} con F=${next.solutionCost}.`);
  };

  const clearAll = () => {
    setGraph({ nodes: [], edges: [] });
    setPositions({});
    setLabels({});
    setSelectedNodeId(null);
    setPendingEdgeFromId(null);
    setRouteInput("");
    setResult(null);
    toast.success("Lienzo limpiado.");
  };

  const loadBaseCase = () => {
    const preset = presets.find((item) => item.id === "base") ?? presets[0];
    const scenario = cloneGraph(preset.graph);
    const nextLabels: Record<number, string> = {};
    scenario.nodes.forEach((node) => {
      nextLabels[node] = String(node);
    });

    setGraph(scenario);
    setLabels(nextLabels);
    setPositions(BASE_POSITIONS);
    setRouteInput(preset.defaultRoute.join(","));
    setResult(hillClimb(scenario, preset.defaultRoute, parseIterations(maxIterationsInput)));
    setSelectedIteration(1);
    setMode("select");
    setPendingEdgeFromId(null);
    toast.info("Caso base cargado.");
  };

  const applyAutoRoute = () => {
    const ordered = [...graph.nodes].sort((a, b) => a - b);
    setRouteInput(formatDefaultRoute(ordered));
  };

  return (
    <div className="container page-stack">
      <section className="hero-lite">
        <h1>Constructor visual de grafos</h1>
        <p>
          El lienzo inicia vacio. Crea nodos con clic, conecta nodos desde el canvas y luego ejecuta Hill Climbing para
          obtener el arbol de exploracion.
        </p>
      </section>

      <section className="builder-layout">
        <Card className="canvas-card">
          <CardHeader>
            <CardTitle>Lienzo del grafo</CardTitle>
            <CardDescription>
              Modo actual: <strong>{mode}</strong>
              {mode === "add-edge" && pendingEdgeFromId !== null ? ` - origen ${pendingEdgeFromId}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mode-toolbar">
              <Button variant={mode === "select" ? "primary" : "outline"} size="sm" onClick={() => setEditorMode("select")}>
                <MousePointer2 size={14} />
                Mover
              </Button>
              <Button variant={mode === "add-node" ? "primary" : "outline"} size="sm" onClick={() => setEditorMode("add-node")}>
                <PlusCircle size={14} />
                Nodo
              </Button>
              <Button variant={mode === "add-edge" ? "primary" : "outline"} size="sm" onClick={() => setEditorMode("add-edge")}>
                <Share2 size={14} />
                Conexion
              </Button>
              <Button variant={mode === "delete" ? "primary" : "outline"} size="sm" onClick={() => setEditorMode("delete")}>
                <Trash2 size={14} />
                Eliminar
              </Button>
            </div>

            <div className="canvas-actions">
              <Button variant="outline" onClick={loadBaseCase}>
                <Wand2 size={14} />
                Cargar caso base
              </Button>
              <Button variant="outline" onClick={clearAll}>
                <RotateCcw size={14} />
                Limpiar lienzo
              </Button>
            </div>

            <GraphCanvas
              graph={graph}
              activeRoute={activeRoute}
              nodePositions={positions}
              nodeLabels={labels}
              selectedNodeId={selectedNodeId}
              pendingEdgeFromId={pendingEdgeFromId}
              mode={mode}
              onCanvasClick={handleCanvasClick}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onNodePointerDown={(nodeId) => {
                if (mode === "select") setDraggingNodeId(nodeId);
              }}
              onPointerMove={(x, y) => {
                if (draggingNodeId === null || mode !== "select") return;
                setPositions((prev) => ({ ...prev, [draggingNodeId]: { x, y } }));
              }}
              onPointerUp={() => {
                if (draggingNodeId !== null) setDraggingNodeId(null);
              }}
              height={560}
            />
            <div className="canvas-help">
              <p className="muted-note">
                Agrega al menos 2 nodos para ejecutar el algoritmo. Coloca nodos y luego crea conexiones antes de pulsar Ejecutar.
              </p>
            </div>
          </CardContent>
        </Card>

        <aside className="side-stack">
          <details className="side-accordion" open>
            <summary>Controles</summary>
            <div className="side-panel">
              <Card>
                <CardHeader>
                  <CardTitle>Nodo seleccionado</CardTitle>
                  <CardDescription>Personaliza el nombre visible del nodo.</CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedNodeId === null ? (
                    <p className="muted-note">Selecciona un nodo en modo mover.</p>
                  ) : (
                    <div className="control-stack">
                      <p className="muted-note">ID: {selectedNodeId}</p>
                      <Label.Root htmlFor="node-label" className="field-label">
                        Nombre
                      </Label.Root>
                      <Input
                        id="node-label"
                        value={labels[selectedNodeId] ?? String(selectedNodeId)}
                        onChange={(event) =>
                          setLabels((prev) => ({
                            ...prev,
                            [selectedNodeId]: event.target.value || String(selectedNodeId),
                          }))
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parametros del algoritmo</CardTitle>
                </CardHeader>
                <CardContent className="control-stack">
                  <Label.Root htmlFor="route-input" className="field-label">
                    Ruta inicial
                  </Label.Root>
                  <Input
                    id="route-input"
                    placeholder="0,2,3,1"
                    value={routeInput}
                    onChange={(event) => setRouteInput(event.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={applyAutoRoute} disabled={graph.nodes.length === 0}>
                    Usar orden de IDs
                  </Button>

                  <Label.Root htmlFor="max-iterations" className="field-label">
                    Max iteraciones
                  </Label.Root>
                  <Input
                    id="max-iterations"
                    type="number"
                    min={1}
                    max={200}
                    value={maxIterationsInput}
                    onChange={(event) => setMaxIterationsInput(event.target.value)}
                  />

                  <Button onClick={runAlgorithm}>
                    <Play size={14} />
                    Ejecutar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </details>
        </aside>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Arbol del algoritmo</CardTitle>
          <CardDescription>
            {result
              ? `Solucion: ${routeToString(result.solutionRoute)} con F=${result.solutionCost}`
              : "Ejecuta el algoritmo para visualizar el arbol."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="muted-note">Sin resultados aun.</p>
          ) : (
            <Tabs defaultValue="tree">
              <TabsList>
                <TabsTrigger value="tree">Arbol</TabsTrigger>
                <TabsTrigger value="iterations">Iteraciones</TabsTrigger>
                <TabsTrigger value="cost">Costo</TabsTrigger>
              </TabsList>

              <TabsContent value="tree">
                <SearchTreeView result={result} />
              </TabsContent>

              <TabsContent value="iterations">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Iteracion</th>
                        <th>Actual</th>
                        <th>Costo</th>
                        <th>Mejor vecino</th>
                        <th>Movimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.iterations.map((iteration) => (
                        <tr key={iteration.iteration}>
                          <td>
                            <button
                              type="button"
                              className="table-select"
                              onClick={() => setSelectedIteration(iteration.iteration)}
                            >
                              #{iteration.iteration}
                            </button>
                          </td>
                          <td>{routeToString(iteration.currentRoute)}</td>
                          <td>{iteration.currentCost}</td>
                          <td>
                            {routeToString(iteration.bestNeighbor.route)} ({iteration.bestNeighbor.cost})
                          </td>
                          <td>{iteration.moved ? "Si" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="cost">
                <RouteCostChart values={costSeries} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={edgeDialogOpen}
        onOpenChange={(open) => {
          setEdgeDialogOpen(open);
          if (!open) {
            setEdgeDialogTarget(null);
            setPendingEdgeFromId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva conexion</DialogTitle>
            <DialogDescription>
              {pendingEdgeFromId !== null && edgeDialogTarget !== null
                ? `${pendingEdgeFromId} -> ${edgeDialogTarget}`
                : "Define peso y direccion"}
            </DialogDescription>
          </DialogHeader>
          <div className="control-stack">
            <Label.Root htmlFor="edge-weight-input" className="field-label">
              Peso
            </Label.Root>
            <Input
              id="edge-weight-input"
              type="number"
              min={1}
              value={edgeWeightInput}
              onChange={(event) => setEdgeWeightInput(event.target.value)}
            />

            <label className="toggle-line light">
              <input
                type="checkbox"
                checked={edgeBidirectional}
                onChange={(event) => setEdgeBidirectional(event.target.checked)}
              />
              Bidireccional
            </label>

            <div className="inline-actions">
              <Button variant="outline" onClick={() => setEdgeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmEdgeCreation}>Guardar conexion</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
