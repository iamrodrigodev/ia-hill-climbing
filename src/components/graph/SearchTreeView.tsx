import { routeToString } from "@/lib/hill-climbing";
import { buildTreeLayout, getTreeNodeClass } from "@/lib/tree-layout";
import type { HillClimbResult } from "@/lib/types";

interface SearchTreeViewProps {
  result: HillClimbResult;
  summaryVariant?: "box" | "text" | "none";
  layoutVariant?: "default" | "compact";
}

export function SearchTreeView({
  result,
  summaryVariant = "box",
  layoutVariant = "default",
}: SearchTreeViewProps) {
  const layout = buildTreeLayout(
    result,
    layoutVariant === "compact"
      ? {
          minWidth: 860,
          childSpacing: 142,
          sidePadding: 120,
          rootY: 74,
          levelGap: 138,
          branchDrop: 42,
          nodeRadius: 34,
          bottomPadding: 88,
        }
      : {},
  );
  const solutionRouteText = routeToString(result.solutionRoute);
  const summaryClass = summaryVariant === "text" ? "tree-result-text" : "tree-result-box";
  const treeShellClass = layoutVariant === "compact" ? "tree-shell compact" : "tree-shell";

  return (
    <div className="tree-layout">
      {summaryVariant === "none" ? null : (
        <aside className={summaryClass}>
          <p>X = [{result.solutionRoute.join(",")}]</p>
          <p>F = {result.solutionCost}</p>
        </aside>
      )}

      <div className={treeShellClass}>
        <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Arbol de exploracion hill climbing">
          <rect x="0" y="0" width={layout.width} height={layout.height} className="tree-bg" />

          <g>
            <circle cx={layout.rootX} cy={layout.rootY} r={layout.nodeRadius} className="tree-node-circle is-root" />
            <text x={layout.rootX} y={layout.rootY - 8} className="tree-node-route">
              {routeToString(result.startRoute)}
            </text>
            <text x={layout.rootX} y={layout.rootY + 16} className="tree-node-cost">
              {result.startCost}
            </text>
          </g>

          {layout.layers.map((layer, layerIndex) => {
            const branchY = layer.parentY + layout.branchDrop;
            const firstX = layer.positions[0];
            const lastX = layer.positions[layer.positions.length - 1];
            const isLastLayer = layerIndex === layout.layers.length - 1;
            const isImprovementLayer = layer.iteration.moved;
            const isStopLayer = !layer.iteration.moved && isLastLayer;
            const isTraceLayer = isImprovementLayer || isLastLayer;
            const selectedX = layer.selectedX;
            const trunkClass = isStopLayer ? "tree-link is-stop" : isTraceLayer ? "tree-link is-best" : "tree-link";

            return (
              <g key={layer.iteration.iteration}>
                <line
                  x1={layer.parentX}
                  y1={layer.parentY + layout.nodeRadius}
                  x2={layer.parentX}
                  y2={branchY}
                  className={trunkClass}
                />
                <line x1={firstX} y1={branchY} x2={lastX} y2={branchY} className="tree-link" />
                {isTraceLayer ? (
                  <line
                    x1={Math.min(layer.parentX, selectedX)}
                    y1={branchY}
                    x2={Math.max(layer.parentX, selectedX)}
                    y2={branchY}
                    className={trunkClass}
                  />
                ) : null}

                {layer.iteration.neighbors.map((neighbor, childIndex) => {
                  const x = layer.positions[childIndex];
                  const y = layer.childY;
                  const isBest = childIndex === layer.bestIndex;
                  const isPathChoice = isBest && isTraceLayer;
                  const isStopChoice = isBest && isStopLayer;
                  const routeText = routeToString(neighbor.route);
                  const nodeClass = getTreeNodeClass(
                    routeText,
                    neighbor.cost,
                    solutionRouteText,
                    result.solutionCost,
                    isPathChoice,
                  );
                  const pathClass = isPathChoice
                    ? "tree-link is-best"
                    : isStopChoice
                      ? "tree-link is-stop"
                      : "tree-link";

                  return (
                    <g key={`${layerIndex}-${childIndex}`}>
                      <line x1={x} y1={branchY} x2={x} y2={y - layout.nodeRadius} className={pathClass} />
                      <circle cx={x} cy={y} r={layout.nodeRadius} className={nodeClass} />
                      <text x={x} y={y - 8} className="tree-node-route">
                        {routeText}
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
