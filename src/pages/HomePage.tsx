import { routeToString } from "@/lib/hill-climbing";
import { baseCaseExpectedText, baseGraph, baseRun } from "@/lib/mock-data";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { SearchTreeView } from "@/components/graph/SearchTreeView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const basePositions = {
  0: { x: 120, y: 120 },
  1: { x: 350, y: 130 },
  2: { x: 640, y: 130 },
  3: { x: 260, y: 300 },
};

export function HomePage() {
  return (
    <div className="container page-stack">
      <section className="hero-lite">
        <h1>Caso base del problema TSP</h1>
        <p>
          Solucion inicial <code>{baseCaseExpectedText.startRoute}</code> con <code>F={baseCaseExpectedText.startCost}</code>.
          Hill Climbing evalua vecinos y termina en <code>{baseCaseExpectedText.bestLocalRoute}</code> con{" "}
          <code>F={baseCaseExpectedText.bestLocalCost}</code>.
        </p>
      </section>

      <section className="layout-two">
        <Card>
          <CardHeader>
            <CardTitle>Grafo del enunciado</CardTitle>
            <CardDescription>Conexiones bidireccionales y pesos del caso de clase.</CardDescription>
          </CardHeader>
          <CardContent>
            <GraphCanvas
              graph={baseGraph}
              activeRoute={baseRun.startRoute}
              nodePositions={basePositions}
              nodeLabels={{ 0: "0", 1: "1", 2: "2", 3: "3" }}
              title="Ruta inicial: 0231"
              height={420}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabla de costos</CardTitle>
            <CardDescription>Datos exactos del problema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Conexion</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {baseGraph.edges.map((edge) => (
                    <tr key={edge.id}>
                      <td>
                        {edge.from} ↔ {edge.to}
                      </td>
                      <td>{edge.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Proceso paso a paso</CardTitle>
          <CardDescription>Vecinos por iteracion, seleccion y criterio de paro.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="steps">
            <TabsList>
              <TabsTrigger value="steps">Pasos</TabsTrigger>
              <TabsTrigger value="iterations">Iteraciones</TabsTrigger>
              <TabsTrigger value="tree">Arbol</TabsTrigger>
            </TabsList>

            <TabsContent value="steps">
              <div className="explain-grid">
                <article className="explain-item">
                  <h3>1. Inicio</h3>
                  <p>
                    Estado inicial: <code>{routeToString(baseRun.startRoute)}</code> con <code>F={baseRun.startCost}</code>.
                  </p>
                </article>
                <article className="explain-item">
                  <h3>2. Vecinos</h3>
                  <p>En cada iteracion se generan swaps y se toma el vecino de menor costo.</p>
                </article>
                <article className="explain-item">
                  <h3>3. Paro</h3>
                  <p>
                    Se detiene en <code>{routeToString(baseRun.solutionRoute)}</code> porque ya no hay mejora estricta.
                  </p>
                </article>
              </div>
            </TabsContent>

            <TabsContent value="iterations">
              <div className="iteration-stack">
                {baseRun.iterations.map((iteration) => (
                  <article key={iteration.iteration} className="iteration-block">
                    <h3>
                      Iteracion {iteration.iteration}: {routeToString(iteration.currentRoute)} (F={iteration.currentCost})
                    </h3>
                    <div className="neighbor-list">
                      {iteration.neighbors.map((neighbor, index) => (
                        <p key={`${iteration.iteration}-${index}`}>
                          {routeToString(neighbor.route)} {"->"} {neighbor.cost}
                        </p>
                      ))}
                    </div>
                    <p className="best-line">
                      Mejor vecino: {routeToString(iteration.bestNeighbor.route)} ({iteration.bestNeighbor.cost}){" "}
                      {iteration.moved ? "se mueve" : "sin mejora"}
                    </p>
                  </article>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tree">
              <SearchTreeView result={baseRun} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
