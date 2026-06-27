import React from "react";

export const ProcessStatusLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-4 px-6 bg-slate-900 rounded-xl border border-slate-800 mx-auto max-w-fit shadow-sm">
      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mr-2">
        Legend
      </span>

      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-slate-500/20 border border-slate-500"></div>
        <span className="text-xs font-semibold text-slate-400">
          Not Started
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></div>
        <span className="text-xs font-semibold text-slate-400">
          In Progress
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div>
        <span className="text-xs font-semibold text-slate-400">
          On Hold
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
        <span className="text-xs font-semibold text-slate-400">
          Blocked
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
        <span className="text-xs font-semibold text-slate-400">
          Completed
        </span>
      </div>
    </div>
  );
};
