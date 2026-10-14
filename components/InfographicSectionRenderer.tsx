"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import MermaidDiagram from "@/components/MermaidDiagram";

interface Dataset {
  label: string;
  data: number[];
}

interface Section {
  id: string;
  title: string;
  type: string;
  flowchart?: { mermaidCode: string; title: string; description: string };
  chart?: {
    type: string;
    title: string;
    labels: string[];
    datasets: Dataset[];
  };
  table?: { title: string; headers: string[]; rows: string[][] };
}

const COLORS = ["#8470ff", "#67bfff", "#3ec972", "#f0bb33", "#ff5656", "#3193da"];

export default function InfographicSectionRenderer({
  section,
}: {
  section: Section;
}) {
  /* --- Flowchart --- */
  if (section.type === "flowchart" && section.flowchart?.mermaidCode) {
    return (
      <div className="space-y-3">
        {section.flowchart.title && (
          <p className="text-xs font-bold text-primary">
            {section.flowchart.title}
          </p>
        )}
        <MermaidDiagram code={section.flowchart.mermaidCode} />
      </div>
    );
  }

  /* --- Charts --- */
  if (
    ["bar-chart", "line-chart", "pie-chart"].includes(section.type) &&
    section.chart
  ) {
    const chart = section.chart;
    const data = chart.labels.map((label, i) => {
      const obj: Record<string, string | number> = { label };
      chart.datasets.forEach((ds, dsIdx) => {
        obj[`ds${dsIdx}`] = ds.data[i] ?? 0;
      });
      return obj;
    });

    return (
      <div className="space-y-3">
        {chart.title && (
          <p className="text-xs font-bold text-primary">{chart.title}</p>
        )}
        <ResponsiveContainer width="100%" height={240}>
          {chart.type === "pie" ? (
            <PieChart>
              <Pie
                data={data.map((d, i) => ({
                  name: d.label,
                  value: Number(d.ds0 ?? 0),
                  fill: COLORS[i % COLORS.length],
                }))}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                  direction: "rtl",
                }}
              />
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                  direction: "rtl",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, direction: "rtl" }} />
              {chart.datasets.map((ds, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={`ds${i}`}
                  name={ds.label}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  background: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                  direction: "rtl",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, direction: "rtl" }} />
              {chart.datasets.map((ds, i) => (
                <Bar
                  key={i}
                  dataKey={`ds${i}`}
                  name={ds.label}
                  fill={COLORS[i % COLORS.length]}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  /* --- Comparison Table --- */
  if (section.type === "comparison-table" && section.table) {
    return (
      <div className="space-y-3">
        {section.table.title && (
          <p className="text-xs font-bold text-primary">{section.table.title}</p>
        )}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {section.table.headers.map((h, i) => (
                  <th key={i} className="p-2.5 font-bold text-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="p-2.5 text-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
      نوع الرسم غير مدعوم: {section.type}
    </div>
  );
}