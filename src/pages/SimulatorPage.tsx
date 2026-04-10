import { MousePointer2, PlusCircle, Share2, Trash2, Play, RotateCcw, Wand2 } from "lucide-react";
import * as Label from "@radix-ui/react-label";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { SearchTreeView } from "@/components/graph/SearchTreeView";
import { RouteCostChart } from "@/components/graph/RouteCostChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { routeToString } from "@/lib/hill-climbing";
import { useSimulatorController } from "@/lib/use-simulator-controller";

export function SimulatorPage() {
  const controller = useSimulatorController();
  const sourceLabel = controller.graphSource === "example" ? "Ejemplo de clase" : "Construido por ti";
  const runSourceLabel =
    controller.lastRunSource === "example"
      ? "Resultado del ejemplo de clase"
      : controller.lastRunSource === "custom"
        ? "Resultado generado por ti"
        : "Sin ejecucion";

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
              Modo actual: <strong>{controller.mode}</strong>
              {controller.mode === "add-edge" && controller.pendingEdgeFromId !== null
                ? ` - origen ${controller.pendingEdgeFromId}`
                : ""}
            </CardDescription>
            <div className="source-line">
              <span className={`source-chip ${controller.graphSource === "example" ? "is-example" : "is-custom"}`}>
                {sourceLabel}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mode-toolbar">
              <Button
                variant={controller.mode === "select" ? "primary" : "outline"}
                size="sm"
                onClick={() => controller.setEditorMode("select")}
              >
                <MousePointer2 size={14} />
                Mover
              </Button>
              <Button
                variant={controller.mode === "add-node" ? "primary" : "outline"}
                size="sm"
                onClick={() => controller.setEditorMode("add-node")}
              >
                <PlusCircle size={14} />
                Nodo
              </Button>
              <Button
                variant={controller.mode === "add-edge" ? "primary" : "outline"}
                size="sm"
                onClick={() => controller.setEditorMode("add-edge")}
              >
                <Share2 size={14} />
                Conexion
              </Button>
              <Button
                variant={controller.mode === "delete" ? "primary" : "outline"}
                size="sm"
                onClick={() => controller.setEditorMode("delete")}
              >
                <Trash2 size={14} />
                Eliminar
              </Button>
            </div>

            <div className="canvas-actions">
              <Button variant="outline" onClick={controller.loadBaseCase}>
                <Wand2 size={14} />
                Cargar caso base
              </Button>
              <Button variant="outline" onClick={controller.clearAll}>
                <RotateCcw size={14} />
                Limpiar lienzo
              </Button>
            </div>

            <GraphCanvas
              graph={controller.graph}
              activeRoute={controller.activeRoute}
              nodePositions={controller.positions}
              nodeLabels={controller.labels}
              selectedNodeId={controller.selectedNodeId}
              pendingEdgeFromId={controller.pendingEdgeFromId}
              mode={controller.mode}
              onCanvasClick={controller.handleCanvasClick}
              onNodeClick={controller.handleNodeClick}
              onEdgeClick={controller.handleEdgeClick}
              onNodePointerDown={(nodeId) => {
                if (controller.mode === "select") controller.setDraggingNodeId(nodeId);
              }}
              onPointerMove={(x, y) => {
                if (controller.draggingNodeId === null || controller.mode !== "select") return;
                controller.setPositions((prev) => ({ ...prev, [controller.draggingNodeId!]: { x, y } }));
              }}
              onPointerUp={() => {
                if (controller.draggingNodeId !== null) controller.setDraggingNodeId(null);
              }}
              height={560}
            />

            <div className="canvas-help">
              <p className="muted-note">
                Agrega al menos 2 nodos para ejecutar el algoritmo. Coloca nodos y luego crea conexiones antes de pulsar
                Ejecutar.
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
                  {controller.selectedNodeId === null ? (
                    <p className="muted-note">Selecciona un nodo en modo mover.</p>
                  ) : (
                    <div className="control-stack">
                      <p className="muted-note">ID: {controller.selectedNodeId}</p>
                      <Label.Root htmlFor="node-label" className="field-label">
                        Nombre
                      </Label.Root>
                      <Input
                        id="node-label"
                        value={controller.labels[controller.selectedNodeId] ?? String(controller.selectedNodeId)}
                        onChange={(event) =>
                          controller.setLabels((prev) => ({
                            ...prev,
                            [controller.selectedNodeId!]: event.target.value || String(controller.selectedNodeId),
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
                    value={controller.routeInput}
                    onChange={(event) => controller.setRouteInput(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={controller.applyAutoRoute}
                    disabled={controller.graph.nodes.length === 0}
                  >
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
                    value={controller.maxIterationsInput}
                    onChange={(event) => controller.setMaxIterationsInput(event.target.value)}
                  />

                  <Button onClick={controller.runAlgorithm}>
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
            {controller.result
              ? `Solucion: ${routeToString(controller.result.solutionRoute)} con F=${controller.result.solutionCost}`
              : "Ejecuta el algoritmo para visualizar el arbol."}
          </CardDescription>
          <div className="source-line">
            <span
              className={`source-chip ${
                controller.lastRunSource === "example" ? "is-example" : controller.lastRunSource === "custom" ? "is-custom" : ""
              }`}
            >
              {runSourceLabel}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!controller.result ? (
            <p className="muted-note">Sin resultados aun.</p>
          ) : (
            <Tabs defaultValue="tree">
              <TabsList>
                <TabsTrigger value="tree">Arbol</TabsTrigger>
                <TabsTrigger value="iterations">Iteraciones</TabsTrigger>
                <TabsTrigger value="cost">Costo</TabsTrigger>
              </TabsList>

              <TabsContent value="tree">
                <SearchTreeView result={controller.result} />
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
                      {controller.result.iterations.map((iteration) => (
                        <tr key={iteration.iteration}>
                          <td>
                            <button
                              type="button"
                              className="table-select"
                              onClick={() => controller.setSelectedIteration(iteration.iteration)}
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
                <RouteCostChart values={controller.costSeries} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={controller.edgeDialogOpen}
        onOpenChange={controller.handleEdgeDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva conexion</DialogTitle>
            <DialogDescription>
              {controller.pendingEdgeFromId !== null && controller.edgeDialogTarget !== null
                ? `${controller.pendingEdgeFromId} -> ${controller.edgeDialogTarget}`
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
              value={controller.edgeWeightInput}
              onChange={(event) => controller.setEdgeWeightInput(event.target.value)}
            />

            <label className="toggle-line light">
              <input
                type="checkbox"
                checked={controller.edgeBidirectional}
                onChange={(event) => controller.setEdgeBidirectional(event.target.checked)}
              />
              Bidireccional
            </label>

            <div className="inline-actions">
              <Button variant="outline" onClick={() => controller.setEdgeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={controller.confirmEdgeCreation}>Guardar conexion</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
