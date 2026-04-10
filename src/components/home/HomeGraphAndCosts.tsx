import { homeContent, homeGraphLabels, homeGraphPositions } from "@/lib/home-content";
import { baseGraph, baseRun } from "@/lib/mock-data";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeGraphAndCosts() {
  return (
    <section className="layout-two">
      <Card>
        <CardHeader>
          <CardTitle>{homeContent.graphCard.title}</CardTitle>
          <CardDescription>{homeContent.graphCard.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <GraphCanvas
            graph={baseGraph}
            activeRoute={baseRun.startRoute}
            nodePositions={homeGraphPositions}
            nodeLabels={homeGraphLabels}
            title={homeContent.graphCard.graphTitle}
            height={420}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{homeContent.costsCard.title}</CardTitle>
          <CardDescription>{homeContent.costsCard.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{homeContent.costsCard.headers.connection}</th>
                  <th>{homeContent.costsCard.headers.cost}</th>
                </tr>
              </thead>
              <tbody>
                {baseGraph.edges.map((edge) => (
                  <tr key={edge.id}>
                    <td>
                      {edge.from} {"<->"} {edge.to}
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
  );
}
