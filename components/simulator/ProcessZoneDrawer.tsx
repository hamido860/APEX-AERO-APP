import React, { useState, useEffect } from "react";
import { ProcessZone, ZoneStatus } from "../../types/processSimulator";

interface ProcessZoneDrawerProps {
  zone: ProcessZone | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    zoneId: string,
    status: ZoneStatus,
    progress?: number,
    blockedReason?: string,
  ) => Promise<void>;
}

export const ProcessZoneDrawer: React.FC<ProcessZoneDrawerProps> = ({
  zone,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for forms
  const [progress, setProgress] = useState<number>(0);
  const [blockedReason, setBlockedReason] = useState<string>("");

  useEffect(() => {
    if (zone) {
      setProgress(zone.progress);
      setBlockedReason(zone.blocked_reason || "");
      setError(null);
    }
  }, [zone]);

  if (!isOpen || !zone) return null;

  const handleStatusChange = async (newStatus: ZoneStatus) => {
    setLoading(true);
    setError(null);
    try {
      let p = progress;
      if (newStatus === "completed") p = 100;
      if (newStatus === "not_started") p = 0;
      await onUpdateStatus(zone.id, newStatus, p, blockedReason);
    } catch (e: any) {
      setError(e.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleProgressSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUpdateStatus(zone.id, zone.status, progress, blockedReason);
    } catch (e: any) {
      setError(e.message || "Failed to update progress");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {zone.product_code}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {zone.zone_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-800/50">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Current Status
            </span>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">
                {zone.status.replace("_", " ")}
              </span>
              <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {zone.progress}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${zone.progress}%` }}
              ></div>
            </div>
          </div>

          {zone.status === "blocked" || zone.status === "on_hold" ? (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Blocked Reason
              </span>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50">
                {zone.blocked_reason || "No reason provided."}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Assigned Team
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {zone.assigned_team || "Unassigned"}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Last Updated
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {new Date(zone.last_updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Quick Actions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStatusChange("in_progress")}
                disabled={loading || zone.status === "in_progress"}
                className="p-2 text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg disabled:opacity-50 transition-colors"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={loading || zone.status === "completed"}
                className="p-2 text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-lg disabled:opacity-50 transition-colors"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleStatusChange("on_hold")}
                disabled={loading || zone.status === "on_hold"}
                className="p-2 text-sm font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 rounded-lg disabled:opacity-50 transition-colors"
              >
                Put On Hold
              </button>
              <button
                onClick={() => handleStatusChange("not_started")}
                disabled={loading || zone.status === "not_started"}
                className="p-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 transition-colors"
              >
                Reset (Not Started)
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Update Details
            </span>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Progress: {progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                disabled={
                  zone.status === "completed" ||
                  zone.status === "not_started" ||
                  loading
                }
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Blocked / Hold Reason
              </label>
              <textarea
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="Why is it blocked?"
                disabled={loading}
                className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 block"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                disabled={loading}
                onClick={handleProgressSave}
                className="flex-1 p-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                Save Details
              </button>
              <button
                disabled={loading}
                onClick={() => handleStatusChange("blocked")}
                className="flex-[0.5] p-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
