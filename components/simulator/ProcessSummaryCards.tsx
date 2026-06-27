import React from "react";
import { useLocalization } from "../../contexts/LocalizationContext";

export interface SimulatorSummary {
  completed: number;
  inProgress: number;
  onHold: number;
  blocked: number;
  notStarted: number;
  overallProgress: number;
}

interface ProcessSummaryCardsProps {
  summary: SimulatorSummary;
}

const SummaryCard: React.FC<{
  title: string;
  value: number;
  colorClass: string;
  suffix?: string;
}> = ({ title, value, colorClass, suffix = "" }) => (
  <div
    className={`p-4 rounded-xl border border-slate-800 bg-slate-900 shadow-sm transition-all`}
  >
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
      {title}
    </p>
    <div className="flex items-end gap-1">
      <span className={`text-3xl font-bold tracking-tight ${colorClass}`}>
        {value}
      </span>
      <span className={`text-lg font-bold mb-0.5 ${colorClass}`}>{suffix}</span>
    </div>
  </div>
);

export const ProcessSummaryCards: React.FC<ProcessSummaryCardsProps> = ({
  summary,
}) => {
  // In a real app we might want to localize these strings
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <SummaryCard
        title="Completed"
        value={summary.completed}
        colorClass="text-emerald-500"
      />
      <SummaryCard
        title="In Progress"
        value={summary.inProgress}
        colorClass="text-blue-500"
      />
      <SummaryCard
        title="On Hold"
        value={summary.onHold}
        colorClass="text-amber-500"
      />
      <SummaryCard
        title="Blocked"
        value={summary.blocked}
        colorClass="text-red-500"
      />
      <SummaryCard
        title="Overall Progress"
        value={summary.overallProgress}
        colorClass="text-cyan-500"
        suffix="%"
      />
    </div>
  );
};
