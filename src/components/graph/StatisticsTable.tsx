import React from "react";
import { ExperimentStats } from "@/lib/types";

interface StatisticsTableProps {
  stats: ExperimentStats[];
}

export function StatisticsTable({ stats }: StatisticsTableProps) {
  if (stats.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
          <tr>
            <th className="px-4 py-3">Problema</th>
            <th className="px-4 py-3">n</th>
            <th className="px-4 py-3">Algo</th>
            <th className="px-4 py-3">Mejor</th>
            <th className="px-4 py-3">Promedio</th>
            <th className="px-4 py-3">Std Dev</th>
            <th className="px-4 py-3">t (ms)</th>
            <th className="px-4 py-3">T0</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stats.map((row, idx) => (
            <tr key={idx} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{row.problem}</td>
              <td className="px-4 py-3">{row.n}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  row.algorithm === 'HC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {row.algorithm}
                </span>
              </td>
              <td className="px-4 py-3 text-green-600 font-bold">{row.bestFitness.toFixed(1)}</td>
              <td className="px-4 py-3">{row.avgFitness.toFixed(2)}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.stdFitness.toFixed(2)}</td>
              <td className="px-4 py-3">{row.avgTimeMs.toFixed(1)}</td>
              <td className="px-4 py-3 italic text-muted-foreground">
                {row.t0Used ? row.t0Used.toFixed(2) : "--"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
