import React from 'react';
import { Task, TaskStatus } from '../../types';
import { ComputedZone } from './AircraftTechnicalMap';
import { useLocalization } from '../../contexts/LocalizationContext';

interface ZoneInspectorDrawerProps {
  zone: ComputedZone | null;
  isOpen: boolean;
  onClose: () => void;
  relatedTasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
  allTasks: Task[];
}

export const ZoneInspectorDrawer: React.FC<ZoneInspectorDrawerProps> = ({ 
  zone, isOpen, onClose, relatedTasks, onUpdateTasks, allTasks 
}) => {
  const { t } = useLocalization();

  if (!isOpen || !zone) return null;

  const handleUpdateStatus = (newStatus: TaskStatus) => {
    const updatedTasks = allTasks.map(task => {
        if (relatedTasks.some(rt => rt.id === task.id)) {
            let newProgress = task.progress;
            if (newStatus === TaskStatus.Completed || newStatus === TaskStatus.QualityOK) newProgress = 100;
            else if (newStatus === TaskStatus.ToDo) newProgress = 0;
            else if (newStatus === TaskStatus.InProgress && task.progress === 0) newProgress = 25;
            
            return {
                ...task,
                status: newStatus,
                progress: newProgress
            };
        }
        return task;
    });
    onUpdateTasks(updatedTasks);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        case 'in_progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        case 'on_hold': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        case 'blocked': return 'text-red-400 bg-red-500/10 border-red-500/20';
        default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-700 flex flex-col font-sans ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest border border-cyan-500/30 px-2 py-0.5 rounded">PC-12</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zone Inspector</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{zone.name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-300 rounded-full hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Status Panel */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border flex flex-col justify-center items-start ${getStatusColor(zone.status)} transition-colors`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Current Status</span>
                    <span className="text-lg font-bold capitalize">{zone.status.replace('_', ' ')}</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-center items-start relative overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 z-10">Progress</span>
                    <span className="text-2xl font-bold text-white z-10">{zone.progress}%</span>
                    <div className="absolute bottom-0 left-0 h-1 bg-cyan-500/50" style={{ width: `${zone.progress}%` }}></div>
                </div>
            </div>

            {/* Tasks Panel */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    Linked Tasks ({relatedTasks.length})
                </h4>
                
                {relatedTasks.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-700 rounded-lg text-slate-500 text-sm text-center">
                        No active tasks found matching this zone out of {allTasks.length} total tasks.
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {relatedTasks.map(task => (
                            <li key={task.id} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-semibold text-slate-200">{task.name}</span>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{task.status}</span>
                                </div>
                                <div className="text-xs text-slate-500 line-clamp-2">"{task.description}"</div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    <span>{task.assignedTo || 'Unassigned'}</span>
                                    <span>{task.progress}% Complete</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Quick Actions */}
            {relatedTasks.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Zone Commands</span>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleUpdateStatus(TaskStatus.InProgress)} className="p-2 text-sm font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors">Mark In Progress</button>
                        <button onClick={() => handleUpdateStatus(TaskStatus.Completed)} className="p-2 text-sm font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors">Mark Completed</button>
                        <button onClick={() => handleUpdateStatus(TaskStatus.OnHold)} className="p-2 text-sm font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-colors">Put On Hold</button>
                        <button onClick={() => handleUpdateStatus(TaskStatus.ToDo)} className="p-2 text-sm font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">Reset (To Do)</button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 text-center">These actions will apply to all {relatedTasks.length} linked tasks.</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
};
