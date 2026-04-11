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
import { rutaATexto } from "@/lib/hill-climbing";
import { useControladorSimulador } from "@/lib/use-simulator-controller";

export function SimulatorPage() {
  const controlador = useControladorSimulador();
  const etiquetaFuente = controlador.fuenteEscenario === "example" ? "Ejemplo de clase" : "Construido por ti";
  const etiquetaFuenteUltimaEjecucion =
    controlador.fuenteUltimaEjecucion === "example"
      ? "Resultado del ejemplo de clase"
      : controlador.fuenteUltimaEjecucion === "custom"
        ? "Resultado generado por ti"
        : "Sin ejecución";

  return (
    <div className="container page-stack">
      <section className="hero-lite">
        <h1>Constructor visual de grafos</h1>
        <p>
          El lienzo inicia vacío. Crea nodos con clic, conecta nodos desde el canvas y luego ejecuta Hill Climbing para
          obtener el árbol de exploración.
        </p>
      </section>

      <section className="builder-layout">
        <Card className="canvas-card">
          <CardHeader>
            <CardTitle>Lienzo del grafo</CardTitle>
            <CardDescription>
              Modo actual: <strong>{controlador.modoEditor}</strong>
              {controlador.modoEditor === "add-edge" && controlador.idNodoOrigenPendiente !== null
                ? ` - origen ${controlador.idNodoOrigenPendiente}`
                : ""}
            </CardDescription>
            <div className="source-line">
              <span className={`source-chip ${controlador.fuenteEscenario === "example" ? "is-example" : "is-custom"}`}>
                {etiquetaFuente}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mode-toolbar">
              <Button
                variant={controlador.modoEditor === "select" ? "primary" : "outline"}
                size="sm"
                onClick={() => controlador.fijarModoEditor("select")}
              >
                <MousePointer2 size={14} />
                Mover
              </Button>
              <Button
                variant={controlador.modoEditor === "add-node" ? "primary" : "outline"}
                size="sm"
                onClick={() => controlador.fijarModoEditor("add-node")}
              >
                <PlusCircle size={14} />
                Nodo
              </Button>
              <Button
                variant={controlador.modoEditor === "add-edge" ? "primary" : "outline"}
                size="sm"
                onClick={() => controlador.fijarModoEditor("add-edge")}
              >
                <Share2 size={14} />
                Conexión
              </Button>
              <Button
                variant={controlador.modoEditor === "delete" ? "primary" : "outline"}
                size="sm"
                onClick={() => controlador.fijarModoEditor("delete")}
              >
                <Trash2 size={14} />
                Eliminar
              </Button>
            </div>
              <div className="mode-toolbar mode-toolbar-extra">
                <label className="field-label" htmlFor="node-label-mode-simulator">
                  Etiqueta de nodo
                </label>
                <select
                  id="node-label-mode-simulator"
                  className="ui-input"
                  value={controlador.modoEtiquetaNodo}
                  onChange={(event) => controlador.setModoEtiquetaNodo(event.target.value as "numeric" | "city")}
                  disabled={controlador.grafo.nodes.length > 0}
                >
                  <option value="numeric">Número</option>
                  <option value="city">Ciudad</option>
                </select>
              </div>

            <Dialog open={controlador.dialogoNodoAbierto} onOpenChange={controlador.manejarCambioDialogoNodo}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nombre de la ciudad</DialogTitle>
                  <DialogDescription>Ingresa el nombre que se mostrará para el nodo.</DialogDescription>
                </DialogHeader>
                <form
              onSubmit={(event) => {
                event.preventDefault();
                controlador.confirmarCreacionNodo();
              }}
              className="control-stack"
            >
              <Label.Root htmlFor="city-name-input" className="field-label">
                Ciudad
              </Label.Root>
              <Input
                id="city-name-input"
                value={controlador.entradaNombreNodo}
                onChange={(event) => controlador.setEntradaNombreNodo(event.target.value)}
              />
              <div className="inline-actions">
                <Button variant="outline" type="button" onClick={() => controlador.manejarCambioDialogoNodo(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agregar nodo</Button>
              </div>
            </form>
              </DialogContent>
            </Dialog>

            <div className="canvas-help">
              <p className="muted-note">
                Agrega al menos 2 nodos para ejecutar el algoritmo. Coloca nodos y luego crea conexiones antes de pulsar
                Ejecutar.
              </p>
              {controlador.modoEditor === "add-node" ? (
                <p className="muted-note">
                  {controlador.modoEtiquetaNodo === "city"
                    ? "Haz clic en el lienzo para agregar una ciudad y escribe su nombre."
                    : "Haz clic en el lienzo para agregar un nodo numérico."}
                </p>
              ) : null}
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
                  {controlador.idNodoSeleccionado === null ? (
                    <p className="muted-note">Selecciona un nodo en modo mover.</p>
                  ) : (
                    <div className="control-stack">
                      <p className="muted-note">ID: {controlador.idNodoSeleccionado}</p>
                      <Label.Root htmlFor="node-label" className="field-label">
                        Nombre
                      </Label.Root>
                      <Input
                        id="node-label"
                        value={controlador.etiquetas[controlador.idNodoSeleccionado] ?? String(controlador.idNodoSeleccionado)}
                        onChange={(event) =>
                          controlador.setEtiquetas((prev) => ({
                            ...prev,
                            [controlador.idNodoSeleccionado!]: event.target.value || String(controlador.idNodoSeleccionado),
                          }))
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parámetros del algoritmo</CardTitle>
                </CardHeader>
                <CardContent className="control-stack">
                  <Label.Root htmlFor="route-input" className="field-label">
                    Ruta inicial
                  </Label.Root>
                  <Input
                    id="route-input"
                    placeholder="0,2,3,1"
                    value={controlador.entradaRuta}
                    onChange={(event) => controlador.setEntradaRuta(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={controlador.aplicarRutaAutomatica}
                    disabled={controlador.grafo.nodes.length === 0}
                  >
                    Usar orden de IDs
                  </Button>

                  <Label.Root htmlFor="max-iterations" className="field-label">
                    Máx. iteraciones
                  </Label.Root>
                  <Input
                    id="max-iterations"
                    type="number"
                    min={1}
                    max={200}
                    value={controlador.entradaMaxIteraciones}
                    onChange={(event) => controlador.setEntradaMaxIteraciones(event.target.value)}
                  />

                  <Button onClick={controlador.ejecutarAlgoritmo}>
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
          <CardTitle>Árbol del algoritmo</CardTitle>
          <CardDescription>
            {controlador.resultado
              ? `Solución: ${rutaATexto(controlador.resultado.solutionRoute)} con F=${controlador.resultado.solutionCost}`
              : "Ejecuta el algoritmo para visualizar el árbol."}
          </CardDescription>
          <div className="source-line">
            <span
              className={`source-chip ${
                controlador.fuenteUltimaEjecucion === "example" ? "is-example" : controlador.fuenteUltimaEjecucion === "custom" ? "is-custom" : ""
              }`}
            >
              {etiquetaFuenteUltimaEjecucion}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!controlador.resultado ? (
            <p className="muted-note">Sin resultados aún.</p>
          ) : (
            <Tabs defaultValue="tree">
              <TabsList>
                <TabsTrigger value="tree">Árbol</TabsTrigger>
                <TabsTrigger value="iterations">Iteraciones</TabsTrigger>
                <TabsTrigger value="cost">Costo</TabsTrigger>
              </TabsList>

              <TabsContent value="tree">
                <SearchTreeView result={controlador.resultado} />
              </TabsContent>

              <TabsContent value="iterations">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Iteración</th>
                        <th>Actual</th>
                        <th>Costo</th>
                        <th>Mejor vecino</th>
                        <th>Movimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controlador.resultado.iterations.map((iteration) => (
                        <tr key={iteration.iteration}>
                          <td>
                            <button
                              type="button"
                              className="table-select"
                              onClick={() => controlador.setIteracionSeleccionada(iteration.iteration)}
                            >
                              #{iteration.iteration}
                            </button>
                          </td>
                          <td>{rutaATexto(iteration.currentRoute)}</td>
                          <td>{iteration.currentCost}</td>
                          <td>
                            {rutaATexto(iteration.bestNeighbor.route)} ({iteration.bestNeighbor.cost})
                          </td>
                          <td>{iteration.moved ? "Sí" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="cost">
                <RouteCostChart values={controlador.serieCostos} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={controlador.dialogoAristaAbierto}
        onOpenChange={controlador.manejarCambioDialogoArista}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva conexión</DialogTitle>
            <DialogDescription>
              {controlador.idNodoOrigenPendiente !== null && controlador.objetivoDialogoArista !== null
                ? `${controlador.idNodoOrigenPendiente} -> ${controlador.objetivoDialogoArista}`
                : "Define peso y dirección"}
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
              value={controlador.entradaPesoArista}
              onChange={(event) => controlador.setEntradaPesoArista(event.target.value)}
            />

            <label className="toggle-line light">
              <input
                type="checkbox"
                checked={controlador.aristaBidireccional}
                onChange={(event) => controlador.setAristaBidireccional(event.target.checked)}
              />
              Bidireccional
            </label>

            <div className="inline-actions">
              <Button variant="outline" onClick={() => controlador.setDialogoAristaAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={controlador.confirmarCreacionArista}>Guardar conexión</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


