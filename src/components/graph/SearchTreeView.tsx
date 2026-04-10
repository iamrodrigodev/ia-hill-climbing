import { routeToString } from "@/lib/hill-climbing";
import type { HillClimbResult, NeighborCandidate } from "@/lib/types";

interface SearchTreeViewProps {
  result: HillClimbResult;
}

interface NodeStyle {
  className: string;
}

function sameCandidate(a: NeighborCandidate, b: NeighborCandidate): boolean {
  return a.cost === b.cost && routeToString(a.route) === routeToString(b.route);
}

function nodeStyle(route: string, cost: number, solutionRoute: string, solutionCost: number, isBest: boolean): NodeStyle {
  if (route === solutionRoute && cost === solutionCost) return { className: "tree-node-circle is-solution" };
  if (isBest) return { className: "tree-node-circle is-selected" };
  return { className: "tree-node-circle" };
}

export function SearchTreeView({ result }: SearchTreeViewProps) {
  const maxChildren = Math.max(1, ...result.iterations.map((iteration) => iteration.neighbors.length));
  const width = Math.max(1000, maxChildren * 175 + 180);
  const rootX = width / 2;
  const rootY = 92;
  const levelGap = 188;
  const branchDrop = 56;
  const nodeRadius = 44;
  const rows = result.iterations.length;
  const height = rootY + rows * levelGap + 130;
  const solutionRouteText = routeToString(result.solutionRoute);

  let parentX = rootX;
  let parentY = rootY;

  const layers = result.iterations.map((iteration, index) => {
    const childY = rootY + (index + 1) * levelGap;
    const n = iteration.neighbors.length;
    const spacing = width / (n + 1);
    const positions = iteration.neighbors.map((_, childIndex) => spacing * (childIndex + 1));
    const bestIndex = iteration.neighbors.findIndex((candidate) => sameCandidate(candidate, iteration.bestNeighbor));
    const selectedX = bestIndex >= 0 ? positions[bestIndex] : positions[0];
    const layer = {
      iteration,
      parentX,
      parentY,
      childY,
      positions,
      selectedX,
      bestIndex,
    };
    parentX = selectedX;
    parentY = childY;
    return layer;
  });

  return (
    <div className="tree-layout">
      <aside className="tree-result-box">
        <p>X = [{result.solutionRoute.join(",")}]</p>
        <p>F = {result.solutionCost}</p>
      </aside>

      <div className="tree-shell">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Arbol de exploracion hill climbing">
          <rect x="0" y="0" width={width} height={height} className="tree-bg" />

          <g>
            <circle cx={rootX} cy={rootY} r={nodeRadius} className="tree-node-circle is-root" />
            <text x={rootX} y={rootY - 8} className="tree-node-route">
              {routeToString(result.startRoute)}
            </text>
            <text x={rootX} y={rootY + 16} className="tree-node-cost">
              {result.startCost}
            </text>
          </g>

          {layers.map((layer, layerIndex) => {
            const branchY = layer.parentY + branchDrop;
            const firstX = layer.positions[0];
            const lastX = layer.positions[layer.positions.length - 1];

            return (
              <g key={layer.iteration.iteration}>
                <line x1={layer.parentX} y1={layer.parentY + nodeRadius} x2={layer.parentX} y2={branchY} className="tree-link" />
                <line x1={firstX} y1={branchY} x2={lastX} y2={branchY} className="tree-link" />

                {layer.iteration.neighbors.map((neighbor, childIndex) => {
                  const x = layer.positions[childIndex];
                  const y = layer.childY;
                  const isBest = childIndex === layer.bestIndex;
                  const style = nodeStyle(
                    routeToString(neighbor.route),
                    neighbor.cost,
                    solutionRouteText,
                    result.solutionCost,
                    isBest,
                  );
                  const pathClass = isBest ? "tree-link is-best" : "tree-link";

                  return (
                    <g key={`${layerIndex}-${childIndex}`}>
                      <line x1={x} y1={branchY} x2={x} y2={y - nodeRadius} className={pathClass} />
                      <circle cx={x} cy={y} r={nodeRadius} className={style.className} />
                      <text x={x} y={y - 8} className="tree-node-route">
                        {routeToString(neighbor.route)}
                      </text>
                      <text x={x} y={y + 16} className="tree-node-cost">
                        {neighbor.cost}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
