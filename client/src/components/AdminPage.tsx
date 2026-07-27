
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, TaskStatus, MasterTask, Rank, getRank, RankSettings } from '@/types';
import { WORK_DAY_HOURS, RANK_THEME, rankToScore } from '@/constants';
import { useLocalization } from '@/contexts/LocalizationContext';

const TaskActionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const DependencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l-3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>;


const UnplannedTaskCard: React.FC<{ 
    task: Task;
    isSelected: boolean;
    onClick: () => void;
    dependencyCount: number;
    statusColor: string;
    isBeingDragged: boolean;
    isDragTarget: boolean;
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
}> = ({ task, isSelected, onClick, dependencyCount, statusColor, isBeingDragged, isDragTarget, ...dragProps }) => {
    const { t, getDaysOfWeek } = useLocalization();
    const DAYS_OF_WEEK_SHORT = getDaysOfWeek('short');

    const dueDateString = `${DAYS_OF_WEEK_SHORT[task.dueDay]}`;
    const baseClasses = `p-3 rounded-lg shadow-md border flex flex-col gap-2 relative transition-all duration-200`;
    const selectedClasses = isSelected ? 'ring-2 ring-cyan-500 dark:ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 bg-slate-200 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600';
    const cursorClass = dragProps.draggable ? 'cursor-grab' : 'cursor-pointer';
    
    return (
        <div
            onClick={onClick}
            className={`${baseClasses} ${selectedClasses} ${cursorClass} ${isBeingDragged ? 'opacity-50' : ''} ${isDragTarget ? 'bg-cyan-500/20' : ''}`}
            style={{'--status-color': statusColor} as React.CSSProperties}
            {...dragProps}
        >
             <div className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-lg bg-[var(--status-color)]"></div>
             <div className="flex justify-between items-start">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate pr-4 transition-colors duration-300">{task.name}</p>
             </div>
             {task.notes && (
                <div className="text-xs text-amber-300 font-semibold bg-amber-900/50 px-2 py-1 rounded-md">
                    {t('admin.note')}: {task.notes}
                </div>
            )}
             <div className="flex justify-between items-center mt-1 text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">
                <span className="font-mono">{task.orderId}</span>
                <div className="flex items-center gap-3">
                    {dependencyCount > 0 && <span className="flex items-center gap-1 font-semibold text-purple-300"><DependencyIcon /> {dependencyCount}</span>}
                    <span className="font-semibold text-cyan-400">{t('admin.duration', task.duration)}</span>
                    <span className="font-semibold text-slate-300">{t('admin.due')}: {dueDateString}</span>
                </div>
            </div>
        </div>
    );
};

const OperatorTimeline: React.FC<{
    operator: string;
    workload: number;
    tasks: Task[];
    ghostTask?: {startHour: number, duration: number};
    onClick: () => void;
    onAutoSchedule: () => void;
    isSuggested: boolean;
    hasSelection: boolean;
    onHover: (isHovering: boolean) => void;
    proficiency?: Rank;
}> = ({ operator, workload, tasks, ghostTask, onClick, onAutoSchedule, isSuggested, hasSelection, onHover, proficiency }) => {
    const { t } = useLocalization();
    const totalHours = 7 * WORK_DAY_HOURS;
    const rankClass = proficiency ? RANK_THEME[proficiency].bg : 'bg-slate-200 dark:bg-slate-700';

    return (
        <div 
            className={`bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl transition-all duration-200 ${hasSelection ? 'cursor-pointer' : ''} ${isSuggested ? 'ring-2 ring-cyan-500 dark:ring-cyan-400 shadow-lg shadow-cyan-500/20' : ''}`}
            onClick={hasSelection ? onClick : undefined}
            onMouseEnter={() => hasSelection && onHover(true)}
            onMouseLeave={() => hasSelection && onHover(false)}
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    {hasSelection && proficiency && <div className={`w-3 h-3 rounded-full ${rankClass}`} title={t('versatility.tooltip.rank')}></div>}
                    <p className="font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{operator}</p>
                    {isSuggested && <span className="text-xs font-bold text-cyan-400 bg-cyan-900/50 px-2 py-0.5 rounded-full">{t('admin.suggested')}</span>}
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">{t('admin.workload', workload.toFixed(1))}</p>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAutoSchedule(); }}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                        title="Auto-Schedule / Compact Tasks (No Overlap)"
                        aria-label="Auto-Schedule / Compact Tasks (No Overlap)"
                    >
                        <SparklesIcon />
                    </button>
                </div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-slate-900/70 w-full rounded-md relative overflow-hidden">
                {/* Day separators */}
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="absolute h-full w-px bg-slate-300/50 dark:bg-slate-700/50" style={{left: `${((i+1) * WORK_DAY_HOURS) / totalHours * 100}%`}}></div>
                ))}
                {/* Existing tasks */}
                {tasks.filter(t => !(t as any).isStaged).map(task => {
                    const taskBg = task.isCritical ? 'bg-orange-500/80' : 'bg-blue-500/80';
                    return (
                        <div 
                            key={task.id} 
                            className={`absolute h-full ${taskBg} rounded flex items-center justify-center overflow-hidden`}
                            style={{
                                left: `${((task.day * WORK_DAY_HOURS + task.startHour) / totalHours) * 100}%`,
                                width: `${(task.duration / totalHours) * 100}%`
                            }}
                            title={`${task.name} (${task.duration}h)`}
                        >
                             <span className="text-white text-[10px] font-bold px-1 truncate">{task.shortName}</span>
                        </div>
                    )
                })}
                 {/* Staged tasks (from current planning session) */}
                 {tasks.filter(t => (t as any).isStaged).map(task => {
                     const taskBg = task.isCritical ? 'bg-orange-500/80' : 'bg-cyan-500/80';
                     return (
                        <div 
                            key={task.id} 
                            className={`absolute h-full ${taskBg} rounded animate-pulse flex items-center justify-center overflow-hidden`}
                            style={{
                                left: `${((task.day * WORK_DAY_HOURS + task.startHour) / totalHours) * 100}%`,
                                width: `${(task.duration / totalHours) * 100}%`
                            }}
                            title={`${task.name} (${task.duration}h) - Staged`}
                        >
                            <span className="text-white text-[10px] font-bold px-1 truncate">{task.shortName}</span>
                        </div>
                     )
                 })}
                 {/* Ghost task for hover preview */}
                {ghostTask && (
                    <div 
                        className="absolute h-full bg-cyan-400/50 rounded border-2 border-dashed border-cyan-300"
                        style={{
                            left: `${(ghostTask.startHour / totalHours) * 100}%`,
                            width: `${(ghostTask.duration / totalHours) * 100}%`,
                        }}
                    ></div>
                )}
            </div>
        </div>
    );
};

const CommitBar: React.FC<{ onCommit: () => void; onDiscard: () => void; changeCount: number }> = ({ onCommit, onDiscard, changeCount }) => {
    const { t } = useLocalization();
    return (
        <div className="absolute top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 flex justify-between items-center z-20 border-b border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in-down">
            <p className="font-semibold text-slate-200">
                {t('admin.stagedChanges', changeCount)}
            </p>
            <div className="flex items-center gap-4">
                <button onClick={onDiscard} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors">
                    <XIcon/> {t('actions.discard')}
                </button>
                <button onClick={onCommit} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors">
                    <CheckIcon/> {t('actions.saveChanges')}
                </button>
            </div>
        </div>
    );
};

interface FiltersState { program: string[]; subProgram: string[]; showCriticalOnly: boolean; }
const FilterDropdown: React.FC<{ label: string; options: string[]; selected: string[]; onToggle: (option: string) => void; }> = ({ label, options, selected, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = selected.length > 0;
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    isActive ? 'bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 focus:ring-cyan-500 dark:focus:ring-cyan-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400 dark:focus:ring-slate-500'
                }`}
            >
                {label}
                {isActive && <span className="bg-cyan-700 text-white text-xs font-bold rounded-full px-2">{selected.length}</span>}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 z-50 transition-colors duration-300">
                    <div className="max-h-60 overflow-y-auto pr-1">
                        {options.map(option => (
                            <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500" checked={selected.includes(option)} onChange={() => onToggle(option)} />
                                <span className="text-sm text-slate-200">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
const PlannerFilters: React.FC<{
    masterTasks: MasterTask[];
    filters: FiltersState;
    onFilterChange: (filterType: keyof FiltersState, value: string | boolean) => void;
    onClearFilters: () => void;
}> = ({ masterTasks, filters, onFilterChange, onClearFilters }) => {
    const { t } = useLocalization();
    const uniquePrograms = useMemo(() => Array.from(new Set(masterTasks.map(mt => mt.program))), [masterTasks]);
    const uniqueSubPrograms = useMemo(() => {
        const relevantSubPrograms = masterTasks
            .filter(mt => filters.program.length === 0 || filters.program.includes(mt.program))
            .map(mt => mt.subProgram);
        return Array.from(new Set(relevantSubPrograms));
    }, [masterTasks, filters.program]);
    
    const hasActiveFilters = filters.program.length > 0 || filters.subProgram.length > 0 || filters.showCriticalOnly;

    return (
        <div className="px-2 pb-4 flex items-center gap-4 flex-wrap border-b border-slate-800 mb-4">
            <FilterDropdown label={t('admin.filters.program')} options={uniquePrograms} selected={filters.program} onToggle={(option) => onFilterChange('program', option)} />
            <FilterDropdown label={t('admin.filters.subProgram')} options={uniqueSubPrograms} selected={filters.subProgram} onToggle={(option) => onFilterChange('subProgram', option)} />
             <label className="flex items-center gap-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                <input type="checkbox" className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500" checked={filters.showCriticalOnly} onChange={(e) => onFilterChange('showCriticalOnly', e.target.checked)} />
                <span className="text-sm font-semibold text-slate-200">{t('admin.filters.criticalOnly')}</span>
            </label>
             {hasActiveFilters && (
                <button onClick={onClearFilters} className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors">{t('admin.filters.clear')}</button>
            )}
        </div>
    );
};


interface AdminPageProps {
  onUpdateTasks: (tasks: Task[]) => void;
  allTasks: Task[];
  allOperators: string[];
  masterTasks: MasterTask[];
  rankSettings: RankSettings;
}

const AdminPage: React.FC<AdminPageProps> = ({ onUpdateTasks, allTasks, allOperators, masterTasks, rankSettings }) => {
  const { t } = useLocalization();
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [stagedTasks, setStagedTasks] = useState<Task[]>([]);
  const [hoveredOperator, setHoveredOperator] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({ program: [], subProgram: [], showCriticalOnly: false });
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);

  const combinedTasks = useMemo(() => {
    const stagedTaskIds = new Set(stagedTasks.map(st => st.id));
    const baseTasks = allTasks.filter(t => !stagedTaskIds.has(t.id));
    return [...baseTasks, ...stagedTasks];
  }, [allTasks, stagedTasks]);

  const allTasksMap = useMemo(() => new Map(combinedTasks.map(t => [t.id, t])), [combinedTasks]);
  const masterTaskMap = useMemo(() => new Map(masterTasks.map(mt => [mt.name, mt])), [masterTasks]);
  
  const { readyToPlanTasks, waitingForDependenciesTasks, blockedTasks } = useMemo(() => {
    const unplanned = combinedTasks
      .filter(t => t.day === -1 && t.status !== TaskStatus.Completed && t.status !== TaskStatus.QualityOK)
      .sort((a,b) => a.displayOrder - b.displayOrder);

    const ready: Task[] = [];
    const waiting: Task[] = [];
    const blocked: Task[] = [];

    for (const task of unplanned) {
        const masterInfo = masterTaskMap.get(task.name);
        const programMatch = filters.program.length === 0 || (masterInfo && filters.program.includes(masterInfo.program));
        const subProgramMatch = filters.subProgram.length === 0 || (masterInfo && filters.subProgram.includes(masterInfo.subProgram));
        const criticalMatch = !filters.showCriticalOnly || !!task.isCritical;

        if (!programMatch || !subProgramMatch || !criticalMatch) continue;

        if (task.status === TaskStatus.OnHold) {
            blocked.push(task);
            continue;
        }
        
        const areDependenciesMet = (task.dependencies || []).every(depId => {
            const prereq = allTasksMap.get(depId);
            return prereq ? prereq.day !== -1 : false;
        });
        
        if (areDependenciesMet) {
            ready.push(task);
        } else {
            waiting.push(task);
        }
    }

    return { readyToPlanTasks: ready, waitingForDependenciesTasks: waiting, blockedTasks: blocked };
  }, [combinedTasks, allTasksMap, masterTaskMap, filters]);

  const operatorWorkloads = useMemo(() => {
    const workloads: { [key: string]: { scheduled: number, staged: number } } = {};
    allOperators.forEach(op => workloads[op] = { scheduled: 0, staged: 0 });
    
    allTasks.forEach(task => {
        if (task.day !== -1 && workloads[task.assignedTo] !== undefined) {
            workloads[task.assignedTo].scheduled += task.duration;
        }
    });
    stagedTasks.forEach(task => {
        if (task.day !== -1 && workloads[task.assignedTo] !== undefined) {
            workloads[task.assignedTo].staged += task.duration;
        }
    });
    return workloads;
  }, [allTasks, stagedTasks, allOperators]);
  
  const operatorTasks = useMemo(() => {
      const tasksByOp: Record<string, Task[]> = {};
      allOperators.forEach(op => tasksByOp[op] = []);
      combinedTasks.forEach(task => {
          if(task.assignedTo && tasksByOp[task.assignedTo] && task.day !== -1) {
              tasksByOp[task.assignedTo].push(task);
          }
      });
      return tasksByOp;
  }, [combinedTasks, allOperators]);


  const handleTaskSelect = (taskId: number) => {
    setSelectedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };

  const getEarliestStartHour = useCallback((taskToPlan: Task, operatorTasks: Task[]) => {
      let nextAvailableTotalHour = 0;
      if (operatorTasks.length > 0) {
          const sortedOpTasks = [...operatorTasks].sort((a, b) => ((a.day * WORK_DAY_HOURS) + a.startHour + a.duration) - ((b.day * WORK_DAY_HOURS) + b.startHour + b.duration));
          const lastTask = sortedOpTasks[sortedOpTasks.length - 1];
          nextAvailableTotalHour = (lastTask.day * WORK_DAY_HOURS) + lastTask.startHour + lastTask.duration;
      }
      
      const dependencyCompletionTotalHour = Math.max(0, ...(taskToPlan.dependencies || []).map(depId => {
          const prereqTask = allTasksMap.get(depId);
          if (!prereqTask || prereqTask.day === -1) return 0;
          return (prereqTask.day * WORK_DAY_HOURS) + prereqTask.startHour + prereqTask.duration;
      }));

      return Math.max(nextAvailableTotalHour, dependencyCompletionTotalHour);
  }, [allTasksMap]);

  const handlePlanTasks = (targetOperator: string) => {
      if (selectedTaskIds.length === 0) return;

      const newStagedTasks: Task[] = [];
      let currentOperatorTasks = [...(operatorTasks[targetOperator] || []), ...stagedTasks.filter(t => t.assignedTo === targetOperator)];

      for (const taskId of selectedTaskIds) {
          const taskToPlan = combinedTasks.find(t => t.id === taskId);
          if (!taskToPlan) continue;

          const earliestStartHour = getEarliestStartHour(taskToPlan, currentOperatorTasks);
          
          let newDay = Math.floor(earliestStartHour / WORK_DAY_HOURS);
          let newStartHour = earliestStartHour % WORK_DAY_HOURS;
          
          if (newStartHour + taskToPlan.duration > WORK_DAY_HOURS) {
            newDay += 1;
            newStartHour = 0;
          }

          const updatedTask: Task & { isStaged?: boolean } = {
              ...taskToPlan,
              day: newDay,
              startHour: newStartHour,
              assignedTo: targetOperator,
              status: TaskStatus.ToDo,
              notes: null,
              isStaged: true,
          };
          newStagedTasks.push(updatedTask);
          currentOperatorTasks.push(updatedTask);
      }
      setStagedTasks(prev => [...prev.filter(st => !selectedTaskIds.includes(st.id)), ...newStagedTasks]);
      setSelectedTaskIds([]);
  };

  const handleAutoSchedule = (operator: string) => {
        // Collect all tasks for this operator (current active + currently staged)
        const operatorCurrentTasks = [
            ...allTasks.filter(t => t.assignedTo === operator && t.day !== -1),
            ...stagedTasks.filter(t => t.assignedTo === operator)
        ];

        // 1. Remove duplicates if any (though logic above should be distinct sets ideally)
        const uniqueTasksMap = new Map<number, Task>();
        operatorCurrentTasks.forEach(t => uniqueTasksMap.set(t.id, t));
        const uniqueTasks = Array.from(uniqueTasksMap.values());

        // 2. Sort by CURRENT planned start time. This preserves the user's relative ordering preference.
        uniqueTasks.sort((a, b) => {
            const timeA = (a.day * WORK_DAY_HOURS) + a.startHour;
            const timeB = (b.day * WORK_DAY_HOURS) + b.startHour;
            return timeA - timeB;
        });

        let currentTotalHourCursor = 0;
        const compactedTasks: Task[] = [];

        for (const task of uniqueTasks) {
            // Calculate dependency constraints
            const dependencyEndTimes = (task.dependencies || []).map(depId => {
                const depTask = allTasksMap.get(depId);
                // If dependency is not scheduled or doesn't exist, treat as 0 (start immediately)
                // Note: In a real app, we might want to check if dependency is ALSO being moved in this batch.
                // For simplicity, we rely on the global 'allTasksMap' which contains current state. 
                // A perfect solution would topological sort the whole graph, but per-operator compaction 
                // assumes dependencies are external or already ordered.
                if (!depTask || depTask.day === -1) return 0;
                return (depTask.day * WORK_DAY_HOURS) + depTask.startHour + depTask.duration;
            });
            
            const maxDependencyTime = Math.max(0, ...dependencyEndTimes);

            // Earliest start is max of (cursor, dependencies)
            // This ensures NO OVERLAP with previous task (cursor) and NO VIOLATION of dependencies.
            // It naturally removes gaps where possible.
            let startTime = Math.max(currentTotalHourCursor, maxDependencyTime);

            let newDay = Math.floor(startTime / WORK_DAY_HOURS);
            let newHour = startTime % WORK_DAY_HOURS;

            // Handle overflow if a single task is longer than a day? 
            // Current system seems to wrap days manually or assume tasks fit. 
            // Standard logic:
            if (newHour + task.duration > WORK_DAY_HOURS) {
                 // If task doesn't fit in remainder of day, move to start of next day?
                 // OR allow split? App seems to imply non-splitting tasks that wrap.
                 // Based on GanttChart.tsx rendering: (task.day * WORK_DAY_HOURS + task.startHour).
                 // It treats time as continuous. Let's stick to continuous time.
            }

            const updatedTask: Task & { isStaged?: boolean } = {
                ...task,
                day: newDay,
                startHour: newHour,
                assignedTo: operator,
                isStaged: true, // Mark as staged so user can confirm
            };

            compactedTasks.push(updatedTask);

            // Advance cursor
            currentTotalHourCursor = startTime + task.duration;
        }

        // Push to staged state
        setStagedTasks(prev => {
            const updatedIds = new Set(compactedTasks.map(t => t.id));
            const others = prev.filter(t => !updatedIds.has(t.id));
            return [...others, ...compactedTasks];
        });
  };
  
  const ghostPlacement = useMemo(() => {
      if (!hoveredOperator || selectedTaskIds.length === 0) return null;
      
      const selectedTasksToPlan = selectedTaskIds
          .map(id => combinedTasks.find(t => t.id === id))
          .filter((t): t is Task => !!t);

      if (selectedTasksToPlan.length === 0) return null;
      
      const totalDuration = selectedTasksToPlan.reduce((sum, t) => sum + t.duration, 0);
      
      const firstTask = selectedTasksToPlan[0];
      const operatorAllTasks = [...(operatorTasks[hoveredOperator] || []), ...stagedTasks.filter(t => t.assignedTo === hoveredOperator)];
      const earliestStartHour = getEarliestStartHour(firstTask, operatorAllTasks);
      
      return { startHour: earliestStartHour, duration: totalDuration };
  }, [hoveredOperator, selectedTaskIds, combinedTasks, operatorTasks, stagedTasks, getEarliestStartHour]);


  const operatorProficiency = useMemo(() => {
    if (selectedTaskIds.length !== 1) return new Map<string, Rank>();

    const taskName = combinedTasks.find(t => t.id === selectedTaskIds[0])?.name;
    if (!taskName) return new Map<string, Rank>();

    const proficiencyMap = new Map<string, Rank>();
    allOperators.forEach(op => {
        const count = allTasks.filter(t => t.assignedTo === op && t.name === taskName && (t.status === TaskStatus.Completed || t.status === TaskStatus.QualityOK)).length;
        proficiencyMap.set(op, getRank(count, rankSettings));
    });
    return proficiencyMap;
  }, [selectedTaskIds, allTasks, allOperators, rankSettings, combinedTasks]);

  const suggestedOperator = useMemo(() => {
    if (selectedTaskIds.length !== 1) return null;

    const maxWorkload = Math.max(...Object.values(operatorWorkloads).map((w: any) => w.scheduled), 1);
    let bestOperator: string | null = null;
    let maxScore = -Infinity;

    for (const operator of allOperators) {
        const proficiency = operatorProficiency.get(operator) || Rank.Unranked;
        const proficiencyScore = rankToScore[proficiency];
        const workload = operatorWorkloads[operator]?.scheduled || 0;
        
        const score = (proficiencyScore * 1.5) - (workload / maxWorkload);

        if (score > maxScore) {
            maxScore = score;
            bestOperator = operator;
        }
    }
    return bestOperator;
  }, [selectedTaskIds, allOperators, operatorWorkloads, operatorProficiency]);
  
  const handleCommit = () => {
      onUpdateTasks(combinedTasks);
      setStagedTasks([]);
  };

  const handleDiscard = () => {
      setStagedTasks([]);
  };

    const handleFilterChange = useCallback((filterType: keyof FiltersState, value: string | boolean) => { setFilters(prev => { const newFilters = { ...prev }; if (filterType === 'showCriticalOnly') { newFilters[filterType] = value as boolean; } else { const currentValues = prev[filterType as keyof Omit<FiltersState, 'showCriticalOnly'>]; if (currentValues.includes(value as never)) { newFilters[filterType as keyof Omit<FiltersState, 'showCriticalOnly'>] = currentValues.filter(v => v !== value) as any; } else { newFilters[filterType as keyof Omit<FiltersState, 'showCriticalOnly'>] = [...currentValues, value] as any; } } return newFilters; }); }, []);
    const handleClearFilters = useCallback(() => { setFilters({ program: [], subProgram: [], showCriticalOnly: false }); }, []);

    const handleDragStart = useCallback((e: React.DragEvent, taskId: number) => {
        e.dataTransfer.setData('text/plain', taskId.toString());
        e.dataTransfer.effectAllowed = 'move';
        setDraggedTaskId(taskId);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, taskId: number) => {
        e.preventDefault();
        if (taskId !== dragOverTaskId) setDragOverTaskId(taskId);
    }, [dragOverTaskId]);
    
    const handleDragLeave = useCallback(() => { setDragOverTaskId(null); }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetTaskId: number) => {
        e.preventDefault();
        if (draggedTaskId === null || draggedTaskId === targetTaskId) return;

        const list = readyToPlanTasks;
        const draggedIndex = list.findIndex(t => t.id === draggedTaskId);
        const targetIndex = list.findIndex(t => t.id === targetTaskId);
        if (draggedIndex === -1 || targetIndex === -1) return;

        const reorderedList = [...list];
        const [draggedItem] = reorderedList.splice(draggedIndex, 1);
        reorderedList.splice(targetIndex, 0, draggedItem);
        
        const newStagedChanges = reorderedList.map((task, index) => ({
            ...task,
            displayOrder: list[index].displayOrder, // Use original order to find a 'slot'
            isStaged: true,
        }));
        
        const finalStaged = newStagedChanges.map((task, index) => ({
            ...task,
            displayOrder: index + (allTasks.length - readyToPlanTasks.length) // Simplistic re-ordering, might need refinement
        }));

        setStagedTasks(prev => {
            const newIds = new Set(finalStaged.map(t => t.id));
            const oldStaged = prev.filter(t => !newIds.has(t.id));
            return [...oldStaged, ...finalStaged];
        });
        
        setDraggedTaskId(null);
        setDragOverTaskId(null);
    }, [draggedTaskId, readyToPlanTasks, allTasks.length]);

    const handleDragEnd = useCallback(() => {
        setDraggedTaskId(null);
        setDragOverTaskId(null);
    }, []);

  return (
    <div className="w-full h-full flex flex-col relative">
      <header className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-slate-700 mb-6">
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('admin.title')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-300">{t('admin.description')}</p>
        </div>
      </header>
      
      {stagedTasks.length > 0 && <CommitBar onCommit={handleCommit} onDiscard={handleDiscard} changeCount={stagedTasks.length} />}
      
      <div className="flex-grow grid grid-cols-12 gap-6 min-h-0">
        {/* Unplanned Tasks Sidebar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl flex flex-col col-span-12 lg:col-span-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 px-2 flex-shrink-0">{t('admin.unplannedTitle', readyToPlanTasks.length + waitingForDependenciesTasks.length + blockedTasks.length)}</h2>
            <PlannerFilters masterTasks={masterTasks} filters={filters} onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} />
            <div className="overflow-y-auto space-y-6 pr-2 -mr-2 flex-grow" onDragOver={e => e.preventDefault()}>
                {/* Ready to Plan */}
                <div>
                    <h3 className="text-sm font-bold text-cyan-400 mb-2 px-2">{t('admin.readyToPlanTitle', readyToPlanTasks.length)}</h3>
                    <div className="space-y-3">
                        {readyToPlanTasks.length > 0 ? (
                            readyToPlanTasks.map(task => 
                                <UnplannedTaskCard
                                    key={task.id} 
                                    task={task} 
                                    isSelected={selectedTaskIds.includes(task.id)}
                                    onClick={() => handleTaskSelect(task.id)}
                                    dependencyCount={task.dependencies?.length || 0}
                                    statusColor={task.isCritical ? 'var(--tw-color-orange-500)' : 'var(--tw-color-cyan-500)'}
                                    draggable={true}
                                    isBeingDragged={draggedTaskId === task.id}
                                    isDragTarget={dragOverTaskId === task.id}
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragOver={(e) => handleDragOver(e, task.id)}
                                    onDrop={(e) => handleDrop(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    onDragLeave={handleDragLeave}
                                />
                            )
                        ) : (
                            <div className="text-center text-slate-500 p-4 text-sm">
                                <p>{t('admin.noReadyTasks')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Waiting on Dependencies */}
                {waitingForDependenciesTasks.length > 0 && (
                  <div>
                      <h3 className="text-sm font-bold text-purple-400 mb-2 px-2">{t('admin.waitingForDependenciesTitle', waitingForDependenciesTasks.length)}</h3>
                      <div className="space-y-3">
                          {waitingForDependenciesTasks.map(task => 
                              <UnplannedTaskCard 
                                  key={task.id} 
                                  task={task} 
                                  isSelected={false}
                                  onClick={() => {}}
                                  dependencyCount={task.dependencies?.length || 0}
                                  statusColor="var(--tw-color-purple-500)"
                                  draggable={false}
                                  isBeingDragged={false} isDragTarget={false}
                                  onDragStart={()=>{}} onDragEnd={()=>{}} onDragOver={()=>{}} onDrop={()=>{}} onDragLeave={()=>{}}
                              />
                          )}
                      </div>
                  </div>
                )}
                
                {/* Blocked */}
                {blockedTasks.length > 0 && (
                  <div>
                      <h3 className="text-sm font-bold text-amber-400 mb-2 px-2">{t('admin.blockedTitle', blockedTasks.length)}</h3>
                      <div className="space-y-3">
                          {blockedTasks.map(task => 
                              <UnplannedTaskCard 
                                  key={task.id} 
                                  task={task}
                                  isSelected={false}
                                  onClick={() => {}}
                                  dependencyCount={task.dependencies?.length || 0}
                                  statusColor="var(--tw-color-amber-500)"
                                  draggable={false}
                                  isBeingDragged={false} isDragTarget={false}
                                  onDragStart={()=>{}} onDragEnd={()=>{}} onDragOver={()=>{}} onDrop={()=>{}} onDragLeave={()=>{}}
                              />
                          )}
                      </div>
                  </div>
                )}
            </div>
        </div>

        {/* Operator Timelines */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex flex-col col-span-12 lg:col-span-8">
             <div className="p-4 flex-grow flex flex-col overflow-hidden">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 px-2 flex-shrink-0">{t('admin.operatorsTitle')}</h2>
                <div className="overflow-y-auto space-y-3 pr-2 -mr-2 flex-grow">
                    {allOperators.map(operator => (
                        <OperatorTimeline
                            key={operator}
                            operator={operator}
                            workload={operatorWorkloads[operator].scheduled + operatorWorkloads[operator].staged}
                            tasks={operatorTasks[operator] || []}
                            isSuggested={suggestedOperator === operator}
                            hasSelection={selectedTaskIds.length > 0}
                            onHover={(isHovering) => setHoveredOperator(isHovering ? operator : null)}
                            onClick={() => handlePlanTasks(operator)}
                            onAutoSchedule={() => handleAutoSchedule(operator)}
                            ghostTask={hoveredOperator === operator ? ghostPlacement : undefined}
                            proficiency={operatorProficiency.get(operator)}
                        />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
