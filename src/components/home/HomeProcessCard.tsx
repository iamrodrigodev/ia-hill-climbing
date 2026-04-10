import { rutaATexto } from "@/lib/hill-climbing";
import { homeContent } from "@/lib/home-content";
import { baseRun } from "@/lib/mock-data";
import { SearchTreeView } from "@/components/graph/SearchTreeView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HomeProcessCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{homeContent.processCard.title}</CardTitle>
        <CardDescription>{homeContent.processCard.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="steps">
          <TabsList>
            <TabsTrigger value="steps">{homeContent.processCard.tabs.steps}</TabsTrigger>
            <TabsTrigger value="iterations">{homeContent.processCard.tabs.iterations}</TabsTrigger>
            <TabsTrigger value="tree">{homeContent.processCard.tabs.tree}</TabsTrigger>
          </TabsList>

          <TabsContent value="steps">
            <div className="explain-grid">
              <article className="explain-item">
                <h3>{homeContent.stepBlocks.one.title}</h3>
                <p>
                  {homeContent.stepBlocks.one.prefix} <code>{rutaATexto(baseRun.startRoute)}</code> con{" "}
                  <code>F={baseRun.startCost}</code>.
                </p>
              </article>
              <article className="explain-item">
                <h3>{homeContent.stepBlocks.two.title}</h3>
                <p>{homeContent.stepBlocks.two.text}</p>
              </article>
              <article className="explain-item">
                <h3>{homeContent.stepBlocks.three.title}</h3>
                <p>
                  {homeContent.stepBlocks.three.prefix} <code>{rutaATexto(baseRun.solutionRoute)}</code>{" "}
                  {homeContent.stepBlocks.three.suffix}
                </p>
              </article>
            </div>
          </TabsContent>

          <TabsContent value="iterations">
            <div className="iteration-stack">
              {baseRun.iterations.map((iteracion) => (
                <article key={iteracion.iteration} className="iteration-block">
                  <h3>
                    Iteración {iteracion.iteration}: {rutaATexto(iteracion.currentRoute)} (F={iteracion.currentCost})
                  </h3>
                  <div className="neighbor-list">
                    {iteracion.neighbors.map((vecino, indice) => (
                      <p key={`${iteracion.iteration}-${indice}`}>
                        {rutaATexto(vecino.route)} {"->"} {vecino.cost}
                      </p>
                    ))}
                  </div>
                  <p className="best-line">
                    {homeContent.stepBlocks.bestNeighborPrefix} {rutaATexto(iteracion.bestNeighbor.route)} (
                    {iteracion.bestNeighbor.cost}). Costo actual F={iteracion.currentCost}. {iteracion.moved ? homeContent.stepBlocks.bestNeighborAction.moved : homeContent.stepBlocks.bestNeighborAction.stopped}
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
  );
}
