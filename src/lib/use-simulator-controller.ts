import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  cloneGraph,
  getEdgeCost,
  hillClimb,
  isRouteValid,
  parseRoute,
  routeToString,
} from "@/lib/hill-climbing";
import { presets } from "@/lib/mock-data";
import {
  BASE_POSITIONS,
  formatDefaultRoute,
  nextNodeId,
  removeNode,
  upsertEdge,
  type Point,
} from "@/lib/simulator-helpers";
import type { HillClimbResult, Route, WeightedGraph } from "@/lib/types";
import type { EditorMode } from "@/components/graph/GraphCanvas";

export type ScenarioSource = "example" | "custom";
const INTERNAL_MAX_ITERATIONS = 1000;

function isValidRoutePath(route: Route, graph: WeightedGraph): boolean {
  for (let i = 0; i < route.length - 1; i += 1) {
    const cost = getEdgeCost(graph, route[i], route[i + 1]);
    if (!Number.isFinite(cost)) return false;
  }
  return true;
}

function findValidAutoRoute(graph: WeightedGraph): Route | null {
  if (graph.nodes.length === 0) return null;
  if (graph.nodes.length === 1) return [...graph.nodes];

  const ordered = [...graph.nodes].sort((a, b) => a - b);
  if (isValidRoutePath(ordered, graph)) return ordered;

  const limitForBacktracking = 9;
  if (ordered.length > limitForBacktracking) return null;

  const n = ordered.length;
  const used = new Set<number>();
  const path: number[] = [];

  const dfs = (current: number): boolean => {
    path.push(current);
    used.add(current);

    if (path.length === n) return true;

    for (const next of ordered) {
      if (used.has(next)) continue;
      const cost = getEdgeCost(graph, current, next);
      if (!Number.isFinite(cost)) continue;
      if (dfs(next)) return true;
    }

    used.delete(current);
    path.pop();
    return false;
  };

  for (const start of ordered) {
    path.length = 0;
    used.clear();
    if (dfs(start)) return [...path];
  }

  return null;
}

export function useSimulatorController() {
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
  const [graphSource, setGraphSource] = useState<ScenarioSource>("custom");
  const [lastRunSource, setLastRunSource] = useState<ScenarioSource | null>(null);

  const [edgeDialogOpen, setEdgeDialogOpen] = useState(false);
  const [edgeDialogTarget, setEdgeDialogTarget] = useState<number | null>(null);
  const [edgeWeightInput, setEdgeWeightInput] = useState("100");
  const [edgeBidirectional, setEdgeBidirectional] = useState(true);

  const activeIteration = result?.iterations.find((iteration) => iteration.iteration === selectedIteration) ?? null;
  const activeRoute = activeIteration?.currentRoute ?? result?.solutionRoute;
  const autoRoutePreview = useMemo(() => {
    const route = findValidAutoRoute(graph);
    return route ? formatDefaultRoute(route) : "";
  }, [graph]);

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
      setGraphSource("custom");
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
      setGraphSource("custom");
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
    toast.success("Conexión eliminada.");
  };

  const confirmEdgeCreation = () => {
    if (pendingEdgeFromId === null || edgeDialogTarget === null) {
      setEdgeDialogOpen(false);
      return false;
    }

    const normalizedWeight = edgeWeightInput.trim();
    if (!normalizedWeight) {
      toast.error("El peso es obligatorio.");
      return false;
    }

    const parsedWeight = Number(normalizedWeight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      toast.error("El peso debe ser un número mayor que 0.");
      return false;
    }
    const weight = Math.floor(parsedWeight);

    setGraph((prev) => upsertEdge(prev, pendingEdgeFromId, edgeDialogTarget, weight, edgeBidirectional));
    setGraphSource("custom");
    setEdgeDialogOpen(false);
    setPendingEdgeFromId(null);
    setEdgeDialogTarget(null);
    setEdgeWeightInput("100");
    setEdgeBidirectional(true);
    toast.success("Conexión creada.");
    return true;
  };

  const handleEdgeDialogOpenChange = (open: boolean) => {
    setEdgeDialogOpen(open);
    if (!open) {
      setEdgeDialogTarget(null);
      setPendingEdgeFromId(null);
    }
  };

  const runAlgorithmWithRoute = (routeText?: string) => {
    if (graph.nodes.length < 2) {
      toast.error("Agrega al menos 2 nodos para ejecutar el algoritmo.");
      return;
    }

    const sourceRouteText = routeText ?? routeInput;
    const route = parseRoute(sourceRouteText);
    if (!isRouteValid(route, graph.nodes)) {
      toast.error("Ruta inválida. Debe incluir exactamente todos los nodos del grafo.");
      return;
    }

    for (let i = 0; i < route.length - 1; i += 1) {
      const cost = getEdgeCost(graph, route[i], route[i + 1]);
      if (!Number.isFinite(cost)) {
        toast.error(`No existe conexión entre ${route[i]} y ${route[i + 1]}.`);
        return;
      }
    }

    const next = hillClimb(graph, route, INTERNAL_MAX_ITERATIONS);
    setResult(next);
    setLastRunSource(graphSource);
    setSelectedIteration(1);
    toast.success(`Resultado: ${routeToString(next.solutionRoute)} con F=${next.solutionCost}.`);
  };

  const runAlgorithm = () => {
    runAlgorithmWithRoute();
  };

  const runAlgorithmAuto = () => {
    if (graph.nodes.length < 2) {
      toast.error("Agrega al menos 2 nodos para ejecutar el algoritmo.");
      return;
    }

    const route = findValidAutoRoute(graph);
    if (!route || !isRouteValid(route, graph.nodes)) {
      toast.error("No se pudo generar una ruta válida con las conexiones actuales del grafo.");
      return;
    }

    setRouteInput(formatDefaultRoute(route));
    const next = hillClimb(graph, route, INTERNAL_MAX_ITERATIONS);
    setResult(next);
    setLastRunSource(graphSource);
    setSelectedIteration(1);
    toast.success(`Resultado: ${routeToString(next.solutionRoute)} con F=${next.solutionCost}.`);
  };

  const clearAll = () => {
    setGraph({ nodes: [], edges: [] });
    setPositions({});
    setLabels({});
    setMode("select");
    setSelectedNodeId(null);
    setPendingEdgeFromId(null);
    setRouteInput("");
    setResult(null);
    setGraphSource("custom");
    setLastRunSource(null);
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
    setResult(hillClimb(scenario, preset.defaultRoute, INTERNAL_MAX_ITERATIONS));
    setSelectedIteration(1);
    setMode("select");
    setPendingEdgeFromId(null);
    setGraphSource("example");
    setLastRunSource("example");
    toast.info("Caso base cargado.");
  };

  const applyAutoRoute = () => {
    const ordered = [...graph.nodes].sort((a, b) => a - b);
    setRouteInput(formatDefaultRoute(ordered));
  };

  return {
    graph,
    positions,
    labels,
    mode,
    selectedNodeId,
    pendingEdgeFromId,
    draggingNodeId,
    routeInput,
    maxIterationsInput,
    result,
    selectedIteration,
    graphSource,
    lastRunSource,
    edgeDialogOpen,
    edgeDialogTarget,
    edgeWeightInput,
    edgeBidirectional,
    activeRoute,
    autoRoutePreview,
    costSeries,
    setRouteInput,
    setMaxIterationsInput,
    setSelectedIteration,
    setEdgeWeightInput,
    setEdgeBidirectional,
    setLabels,
    setDraggingNodeId,
    setEdgeDialogOpen,
    handleEdgeDialogOpenChange,
    setEditorMode,
    handleCanvasClick,
    handleNodeClick,
    handleEdgeClick,
    confirmEdgeCreation,
    runAlgorithm,
    runAlgorithmWithRoute,
    runAlgorithmAuto,
    clearAll,
    loadBaseCase,
    applyAutoRoute,
    setPositions,
  };
}
