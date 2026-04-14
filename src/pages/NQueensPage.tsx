import { useState } from "react";
import { Play, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import * as Label from "@radix-ui/react-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RouteCostChart } from "@/components/graph/RouteCostChart";
import { escalarColinaNReinas, generarEstadoAleatorio, calcularAtaques } from "@/lib/n-queens";
import { rutaATexto } from "@/lib/hill-climbing";
import type { ResultadoEscalada, Ruta } from "@/lib/types";

export function NQueensPage() {
  const [n, setN] = useState<number>(8);
  const [estadoActual, setEstadoActual] = useState<Ruta>(generarEstadoAleatorio(8));
  const [resultado, setResultado] = useState<ResultadoEscalada | null>(null);
  const [pasoActual, setPasoActual] = useState<number>(0);

  const reiniciarTablero = () => {
    setEstadoActual(generarEstadoAleatorio(n));
    setResultado(null);
    setPasoActual(0);
  };

  const ejecutarAlgoritmo = () => {
    const res = escalarColinaNReinas(estadoActual, 200);
    setResultado(res);
    setPasoActual(0);
  };

  const historialPasos = resultado
    ? [
        {
          titulo: "Estado inicial",
          route: resultado.startRoute,
          cost: resultado.startCost,
          descripcion: `El tablero se generó con posiciones aleatorias. Hay ${resultado.startCost} ataques cruzados entre las reinas.`,
        },
        ...resultado.iterations.map((it) => {
          let desc = it.moved
            ? `Se evaluaron los vecinos y se movió una reina. El costo (ataques) se redujo de ${it.currentCost} a ${it.bestNeighbor.cost}.`
            : `Ningún movimiento mejora el costo actual (${it.currentCost}). El algoritmo ha llegado a un óptimo local y se detiene.`;

          if (it.moved && it.bestNeighbor.cost === 0) {
            desc = "Solución encontrada: el costo bajó a 0 y todas las reinas quedaron a salvo.";
          }

          return {
            titulo: `Iteración ${it.iteration}`,
            route: it.moved ? it.bestNeighbor.route : it.currentRoute,
            cost: it.moved ? it.bestNeighbor.cost : it.currentCost,
            descripcion: desc,
          };
        }),
      ]
    : [];

  const pasoSeleccionado = historialPasos.length > 0 ? historialPasos[pasoActual] : null;
  const estadoVisual = pasoSeleccionado ? pasoSeleccionado.route : estadoActual;
  const costoVisual = pasoSeleccionado ? pasoSeleccionado.cost : calcularAtaques(estadoActual);

  const serieCostos = resultado
    ? [resultado.startCost, ...resultado.iterations.map((it) => (it.moved ? it.bestNeighbor.cost : it.currentCost))]
    : [];

  const renderizarTablero = () => {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${n}, 40px)`,
          border: "2px solid #333",
          width: "fit-content",
          margin: "0 auto",
          background: "#333",
        }}
      >
        {Array.from({ length: n }).map((_, fila) =>
          Array.from({ length: n }).map((_, col) => {
            const esCasillaOscura = (fila + col) % 2 === 1;
            const tieneReina = estadoVisual[col] === fila;
            return (
              <div
                key={`${fila}-${col}`}
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: esCasillaOscura ? "#9ca3af" : "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "#000",
                }}
              >
                {tieneReina ? "\u265B" : ""}
              </div>
            );
          }),
        )}
      </div>
    );
  };

  return (
    <div className="container page-stack">
      <section className="hero-lite">
        <h1>Simulador N-Reinas</h1>
        <p>Resuelve el problema de N-Reinas utilizando Hill Climbing interactivo.</p>
      </section>

      <section className="builder-layout">
        <Card className="canvas-card">
          <CardHeader>
            <CardTitle>
              Tablero ({n}x{n})
            </CardTitle>
            <CardDescription>
              Costo actual (ataques): <strong>{costoVisual}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent style={{ padding: "2rem", display: "flex", alignItems: "center" }}>
            {renderizarTablero()}
          </CardContent>
        </Card>

        <aside className="side-stack">
          <details className="side-accordion" open>
            <summary>Controles</summary>
            <div className="side-panel">
              <Card>
                <CardHeader>
                  <CardTitle>Parámetros</CardTitle>
                </CardHeader>
                <CardContent className="control-stack">
                  <Label.Root htmlFor="n-input" className="field-label">
                    Número de Reinas (N)
                  </Label.Root>
                  <Input
                    id="n-input"
                    type="number"
                    min={4}
                    max={20}
                    value={n}
                    onChange={(e) => {
                      const valor = Number(e.target.value);
                      const limitado = Number.isFinite(valor) ? Math.min(20, Math.max(4, Math.floor(valor))) : 4;
                      setN(limitado);
                      setEstadoActual(generarEstadoAleatorio(limitado));
                      setResultado(null);
                      setPasoActual(0);
                    }}
                  />

                  <div className="inline-actions" style={{ marginTop: "1rem" }}>
                    <Button variant="outline" onClick={reiniciarTablero} className="flex-1">
                      <RotateCcw size={14} className="mr-2" /> Aleatorio
                    </Button>
                    <Button onClick={ejecutarAlgoritmo} className="flex-1">
                      <Play size={14} className="mr-2" /> Ejecutar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ marginTop: "1.5rem" }}>
                <CardHeader style={{ paddingBottom: "0.75rem" }}>
                  {!resultado ? (
                    <>
                      <CardTitle style={{ fontSize: "1rem" }}>¿Qué está pasando?</CardTitle>
                      <CardDescription>Esperando ejecución...</CardDescription>
                    </>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <CardTitle style={{ fontSize: "1rem" }}>{pasoSeleccionado?.titulo}</CardTitle>
                        <CardDescription>
                          Paso {pasoActual} de {historialPasos.length - 1}
                        </CardDescription>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={pasoActual === 0}
                          onClick={() => setPasoActual((p) => p - 1)}
                        >
                          <ChevronLeft size={16} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={pasoActual === historialPasos.length - 1}
                          onClick={() => setPasoActual((p) => p + 1)}
                        >
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {!resultado ? (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "hsl(var(--muted-foreground))",
                        margin: 0,
                        lineHeight: "1.5",
                      }}
                    >
                      Presiona <strong>Ejecutar</strong> para iniciar el algoritmo. Podrás navegar iteración por
                      iteración para ver las decisiones que toma.
                    </p>
                  ) : (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        lineHeight: "1.5",
                        color: "hsl(var(--muted-foreground))",
                        background: "hsl(var(--muted))",
                        padding: "0.75rem",
                        borderRadius: "var(--radius)",
                      }}
                    >
                      {pasoSeleccionado?.descripcion}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </details>
        </aside>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Resultados globales</CardTitle>
          <CardDescription>
            {resultado
              ? `Solución final: ${rutaATexto(resultado.solutionRoute)} con F=${resultado.solutionCost} (${resultado.stopReason})`
              : "Ejecuta el algoritmo para visualizar las tablas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!resultado ? (
            <p className="muted-note">Sin resultados aún.</p>
          ) : (
            <Tabs defaultValue="iterations">
              <TabsList>
                <TabsTrigger value="iterations">Iteraciones</TabsTrigger>
                <TabsTrigger value="cost">Gráfica de costo</TabsTrigger>
              </TabsList>

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
                      {resultado.iterations.map((iteracion) => (
                        <tr
                          key={iteracion.iteration}
                          style={{
                            backgroundColor: pasoActual === iteracion.iteration ? "hsl(var(--muted))" : "transparent",
                          }}
                        >
                          <td>
                            <button
                              type="button"
                              className="table-select"
                              onClick={() => setPasoActual(iteracion.iteration)}
                            >
                              #{iteracion.iteration}
                            </button>
                          </td>
                          <td>{rutaATexto(iteracion.currentRoute)}</td>
                          <td>{iteracion.currentCost}</td>
                          <td>
                            {rutaATexto(iteracion.bestNeighbor.route)} ({iteracion.bestNeighbor.cost})
                          </td>
                          <td>{iteracion.moved ? "Sí" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="cost">
                <RouteCostChart values={serieCostos} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
