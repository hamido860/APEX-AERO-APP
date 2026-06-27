import React from "react";
import { ProcessZone, ZoneStatus } from "../../types/processSimulator";

interface AircraftProcessMapProps {
  zones: ProcessZone[];
  selectedZoneId: string | null;
  onSelectZone: (zone: ProcessZone) => void;
}

const statusColors: Record<ZoneStatus, string> = {
  completed: "bg-emerald-500 border-emerald-600 text-white",
  in_progress: "bg-blue-500 border-blue-600 text-white",
  on_hold: "bg-amber-500 border-amber-600 text-white",
  blocked: "bg-red-500 border-red-600 text-white",
  not_started:
    "bg-slate-300 dark:bg-slate-700 border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-200",
};

const statusHoverColors: Record<ZoneStatus, string> = {
  completed: "hover:bg-emerald-400",
  in_progress: "hover:bg-blue-400",
  on_hold: "hover:bg-amber-400",
  blocked: "hover:bg-red-400",
  not_started: "hover:bg-slate-200 dark:hover:bg-slate-600",
};

export const AircraftProcessMap: React.FC<AircraftProcessMapProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
}) => {
  const getZone = (key: string) => zones.find((z) => z.zone_key === key);

  const renderZone = (key: string, className: string = "") => {
    const zone = getZone(key);
    if (!zone)
      return (
        <div
          className={`border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-xs ${className}`}
        >
          Unknown Zone
        </div>
      );

    const isSelected = selectedZoneId === zone.id;
    const colorClass = statusColors[zone.status];
    const hoverClass = statusHoverColors[zone.status];

    return (
      <button
        onClick={() => onSelectZone(zone)}
        className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 focus:ring-cyan-500 ${colorClass} ${hoverClass} ${isSelected ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-105 z-10" : ""} ${className}`}
      >
        <span className="font-bold text-sm text-center leading-tight mb-1">
          {zone.zone_name}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-90">
          {zone.status.replace("_", " ")}
        </span>

        {zone.progress > 0 && zone.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-white/50"
              style={{ width: `${zone.progress}%` }}
            />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="grid grid-cols-7 gap-3 md:gap-4 w-full place-items-stretch">
        {/* Engine / Nose */}
        <div className="col-start-4 col-span-1 h-20 md:h-24 flex flex-col gap-2">
          {renderZone("engine_area", "flex-[1.5] rounded-t-full")}
          {renderZone("nose_section", "flex-1")}
        </div>

        {/* Cockpit */}
        <div className="col-start-4 col-span-1 h-20 md:h-24 flex">
          {renderZone("cockpit", "flex-1")}
        </div>

        {/* Wings & Cabin */}
        <div className="col-start-1 col-span-7 flex gap-3 md:gap-4 min-h-[140px] md:min-h-[180px]">
          <div className="flex-[3] flex flex-col justify-center pb-8">
            {renderZone(
              "left_wing",
              "w-full h-24 md:h-32 rounded-l-full shadow-lg",
            )}
          </div>
          <div className="flex-[2] flex flex-col gap-2">
            {renderZone("cabin", "flex-[2] shadow-xl z-20")}
            <div className="flex gap-2 flex-1">
              {renderZone("electrical_systems", "flex-1")}
              {renderZone("interior_assembly", "flex-1")}
            </div>
          </div>
          <div className="flex-[3] flex flex-col justify-center pb-8">
            {renderZone(
              "right_wing",
              "w-full h-24 md:h-32 rounded-r-full shadow-lg",
            )}
          </div>
        </div>

        {/* Landing Gear & Tail */}
        <div className="col-start-4 col-span-1 flex flex-col gap-3 min-h-[120px]">
          {renderZone("landing_gear", "h-16")}
          {renderZone("tail_section", "flex-1")}
        </div>

        {/* Final Inspection */}
        <div className="col-start-2 col-span-5 mt-8 pt-8 border-t-2 border-dashed border-slate-300 dark:border-slate-700 flex justify-center">
          <div className="w-1/2">
            {renderZone("final_inspection", "w-full h-16")}
          </div>
        </div>
      </div>
    </div>
  );
};
