
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Task, TaskStatus, MasterTask, Rank, getRank, RankSettings } from '@/types';
import { TASK_STATUS_COLORS, WORK_DAY_HOURS, rankToScore } from '@/constants';
import { useLocalization } from '@/contexts/LocalizationContext';

declare const XLSX: any;

interface OrderLogPageProps {
  allTasks: Task[];
  masterTasks: MasterTask[];
  onUpdateTasks: (tasks: Task[]) => void;
  onUpdateMasterTasks: (tasks: MasterTask[]) => void;
  allOperators: string[];
  rankSettings: RankSettings;
  columnVisibility: { [key: string]: boolean };
  filters: {
      programs: string[];
      statuses: TaskStatus[];
      assignedTo: string[];
      planningStatus: 'all' | 'planned' | 'unplanned';
  };
  onFilterChange: (filterType: string, value: any) => void;
  onClearFilters: () => void;
}

type SortKey = keyof Task | 'dueDate' | 'program';
interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

interface TaskToUpload {
    task: Task;
    changeType: 'New' | 'Update';
}

interface UnrecognizedTaskData {
    name: string;
    program: string;
    subProgram: string;
    shortName: string;
    defaultDuration: number;
    originalRow: any;
}


// Unrecognized Task Modal Component
const UnrecognizedTaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newMasterTasks: MasterTask[]) => void;
    initialTasks: UnrecognizedTaskData[];
}> = ({ isOpen, onClose, onConfirm, initialTasks }) => {
    const { t } = useLocalization();
    const [tasks, setTasks] = useState<MasterTask[]>([]);
    const [errors, setErrors] = useState<Record<number, string>>({});

    useEffect(() => {
        if (isOpen) {
            setTasks(initialTasks.map(ut => ({
                name: ut.name,
                program: ut.program || '',
                subProgram: ut.subProgram || '',
                shortName: ut.shortName || '',
                defaultDuration: ut.defaultDuration || 1,
            })));
            setErrors({});
        }
    }, [isOpen, initialTasks]);

    const handleTaskChange = (index: number, field: keyof MasterTask, value: string | number) => {
        const newTasks = [...tasks];
        (newTasks[index] as any)[field] = value;
        setTasks(newTasks);
        if (errors[index]) {
            const newErrors = { ...errors };
            delete newErrors[index];
            setErrors(newErrors);
        }
    };

    const handleConfirmClick = () => {
        const newErrors: Record<number, string> = {};
        let isValid = true;
        tasks.forEach((task, index) => {
            if (!task.program || !task.subProgram || !task.shortName || !task.defaultDuration || Number(task.defaultDuration) < 1) {
                newErrors[index] = t('settingsModal.error.allFieldsRequired');
                isValid = false;
            }
        });

        if (isValid) {
            onConfirm(tasks);
        } else {
            setErrors(newErrors);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col w-full max-w-5xl max-h-[90vh] border border-slate-200 dark:border-slate-700 transition-colors duration-300"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="flex-shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('orderlog.unrecognized.title')}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-300">{t('orderlog.unrecognized.description')}</p>
                </header>
                <div className="flex-grow overflow-y-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow-sm transition-colors duration-300">
                            <tr>
                                <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-1/4 transition-colors duration-300">{t('columns.task')}</th>
                                <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('columns.program')}</th>
                                <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('columns.subProgram')}</th>
                                <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('columns.shortName')}</th>
                                <th className="p-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('columns.duration')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900/50 transition-colors duration-300">
                            {tasks.map((task, index) => (
                                <tr key={index} className="border-b border-slate-700/50">
                                    <td className="p-2 align-top"><span className="font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md inline-block transition-colors duration-300">{task.name}</span></td>
                                    <td className="p-2 align-top"><input type="text" value={task.program} onChange={e => handleTaskChange(index, 'program', e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors duration-300" /></td>
                                    <td className="p-2 align-top"><input type="text" value={task.subProgram} onChange={e => handleTaskChange(index, 'subProgram', e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors duration-300" /></td>
                                    <td className="p-2 align-top"><input type="text" value={task.shortName} onChange={e => handleTaskChange(index, 'shortName', e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors duration-300" /></td>
                                    <td className="p-2 align-top"><input type="number" min="1" value={task.defaultDuration} onChange={e => handleTaskChange(index, 'defaultDuration', Number(e.target.value))} className="w-24 bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors duration-300" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {(Object.keys(errors).length > 0) && <p className="text-red-400 text-sm mt-3">{t('settingsModal.error.allFieldsRequired')}</p>}
                <footer className="flex justify-end items-center gap-4 mt-6 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-600 hover:bg-slate-500 text-white">{t('orderlog.unrecognized.cancel')}</button>
                    <button onClick={handleConfirmClick} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-cyan-600 hover:bg-cyan-500 text-white">{t('orderlog.unrecognized.confirm')}</button>
                </footer>
            </div>
        </div>
    );
};


// Helper component for filter dropdowns
const FilterDropdown: React.FC<{
    label: string;
    options: readonly string[];
    selected: string[];
    onChange: (option: string) => void;
    onClear: () => void;
    getLabel: (value: string) => string;
}> = ({ label, options, selected, onChange, onClear, getLabel }) => {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = selected.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                    isActive ? 'bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 focus:ring-cyan-500 dark:focus:ring-cyan-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400 dark:focus:ring-slate-500'
                }`}
            >
                {label}
                {isActive && <span className="bg-cyan-700 text-white text-xs font-bold rounded-full px-2">{selected.length}</span>}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 z-50 transition-colors duration-300">
                    <div className="max-h-60 overflow-y-auto pr-1">
                        {options.map(option => (
                            <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500 transition"
                                    checked={selected.includes(option)}
                                    onChange={() => onChange(option)}
                                />
                                <span className="text-sm text-slate-200">{getLabel(option)}</span>
                            </label>
                        ))}
                    </div>
                     {isActive && (
                        <div className="pt-2 mt-2 border-t border-slate-700">
                            <button
                                onClick={() => { onClear(); setIsOpen(false); }}
                                className="w-full text-center text-sm font-semibold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                {t('actions.clearSelection')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    sortConfig: SortConfig | null;
    requestSort: (key: SortKey) => void;
    className?: string;
}> = ({ label, sortKey, sortConfig, requestSort, className }) => {
    const isSorted = sortConfig?.key === sortKey;
    const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
    const ariaSort = isSorted ? sortConfig.direction : 'none';

    return (
        <th aria-sort={ariaSort} className={`p-0 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${className || ''}`}>
            <button
                onClick={() => requestSort(sortKey)}
                className="w-full flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset rounded"
            >
                {label}
                <span className="text-cyan-400" aria-hidden="true">{directionIcon}</span>
            </button>
        </th>
    );
};


const OrderLogPage: React.FC<OrderLogPageProps> = ({ allTasks, masterTasks, onUpdateTasks, onUpdateMasterTasks, allOperators, rankSettings, columnVisibility, filters, onFilterChange, onClearFilters }) => {
  const { t, getDaysOfWeek, getTaskStatusName } = useLocalization();
  const DAYS_OF_WEEK = getDaysOfWeek('long');
  const DAYS_OF_WEEK_SHORT = getDaysOfWeek('short');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'id', direction: 'ascending' });
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tasksToUpload, setTasksToUpload] = useState<TaskToUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUnrecognizedModalOpen, setIsUnrecognizedModalOpen] = useState(false);
  const [unrecognizedTasks, setUnrecognizedTasks] = useState<UnrecognizedTaskData[]>([]);
  const [stagedRecognizedRows, setStagedRecognizedRows] = useState<any[]>([]);

  const [offlineSuggestions, setOfflineSuggestions] = useState<{[key: number]: string}>({});

  const masterTaskMap = useMemo(() => new Map(masterTasks.map(mt => [mt.name, mt])), [masterTasks]);
  const uniquePrograms = useMemo(() => Array.from(new Set(masterTasks.map(mt => mt.program))), [masterTasks]);
  const allStatuses = useMemo(() => Object.values(TaskStatus), []);
  
  const handleFilterChange = useCallback((type: 'program' | 'status' | 'assignedTo', value: string) => {
    const keyMap = { program: 'programs', status: 'statuses', assignedTo: 'assignedTo' };
    const key = keyMap[type];
    const currentValues = (filters as any)[key] as any[];
    const newValues = currentValues.includes(value as never)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
    onFilterChange(key, newValues);
  }, [filters, onFilterChange]);

  const handlePlanningFilterChange = (status: 'all' | 'planned' | 'unplanned') => {
      onFilterChange('planningStatus', status);
  };

  const hasActiveContextFilters = useMemo(() => {
      return filters.programs.length > 0 || filters.statuses.length > 0 || filters.assignedTo.length > 0 || filters.planningStatus !== 'all';
  }, [filters]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getOperatorProficiency = useCallback((operator: string, taskName: string, tasks: Task[]): Rank => {
      const count = tasks.filter(t => t.assignedTo === operator && t.name === taskName && (t.status === TaskStatus.Completed || t.status === TaskStatus.QualityOK)).length;
      return getRank(count, rankSettings);
  }, [rankSettings]);

  const predictBestOperator = useCallback((taskToMatch: Task): string => {
    const operatorWorkloads = allOperators.reduce((acc, op) => {
        acc[op] = allTasks
            .filter(t => t.assignedTo === op && t.day !== -1)
            .reduce((sum, currentTask) => sum + currentTask.duration, 0);
        return acc;
    }, {} as {[key: string]: number});
    
    const maxWorkload = Math.max(...(Object.values(operatorWorkloads) as number[]), 1);

    let bestOperator = '';
    let maxScore = -Infinity;

    for (const operator of allOperators) {
        const proficiency = getOperatorProficiency(operator, taskToMatch.name, allTasks);
        const proficiencyScore = rankToScore[proficiency];
        
        const workload = operatorWorkloads[operator] || 0;
        const normalizedWorkload = workload / maxWorkload;
        
        const score = (proficiencyScore * 100) - normalizedWorkload;

        if (score > maxScore) {
            maxScore = score;
            bestOperator = operator;
        }
    }
    
    return bestOperator || allOperators[0];
  }, [allTasks, allOperators, getOperatorProficiency]);

  const handleSuggestOperator = (taskToMatch: Task) => {
      const prediction = predictBestOperator(taskToMatch);
      setOfflineSuggestions(prev => ({ ...prev, [taskToMatch.id]: prediction }));
  };


  const handleAssignTask = (taskToPlan: Task, targetOperator: string) => {
      const operatorTasks = allTasks
          .filter(t => t.assignedTo === targetOperator && t.day !== -1)
          .sort((a, b) => ((a.day * WORK_DAY_HOURS) + a.startHour) - ((b.day * WORK_DAY_HOURS) + b.startHour));

      let nextAvailableTotalHour = 0;
      if (operatorTasks.length > 0) {
          const lastTask = operatorTasks[operatorTasks.length - 1];
          nextAvailableTotalHour = (lastTask.day * WORK_DAY_HOURS) + lastTask.startHour + lastTask.duration;
      }
      
      let newDay = Math.floor(nextAvailableTotalHour / WORK_DAY_HOURS);
      let newStartHour = nextAvailableTotalHour % WORK_DAY_HOURS;

      if (newStartHour + taskToPlan.duration > WORK_DAY_HOURS) {
        newDay += 1;
        newStartHour = 0;
      }
      
      if (newStartHour === WORK_DAY_HOURS) {
          newDay += 1;
          newStartHour = 0;
      }

      const updatedTask = {
          ...taskToPlan,
          day: newDay,
          startHour: newStartHour,
          assignedTo: targetOperator,
          status: TaskStatus.ToDo,
          notes: null,
      };
      
      const newTaskList = allTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
      onUpdateTasks(newTaskList);
  };

  const sortedAndFilteredTasks = useMemo(() => {
    let sortableItems = [...allTasks];
    
    // Search filter
    const lowercasedFilter = searchTerm.toLowerCase();
    if (lowercasedFilter) {
      sortableItems = sortableItems.filter(item => {
          const masterInfo = masterTaskMap.get(item.name);
          return (
            item.name.toLowerCase().includes(lowercasedFilter) ||
            item.orderId.toLowerCase().includes(lowercasedFilter) ||
            masterInfo?.program.toLowerCase().includes(lowercasedFilter) ||
            masterInfo?.subProgram.toLowerCase().includes(lowercasedFilter)
          )
      });
    }

    // Contextual filters
    if (filters.programs.length > 0) {
        sortableItems = sortableItems.filter(item => {
            const program = masterTaskMap.get(item.name)?.program;
            return program ? filters.programs.includes(program) : false;
        });
    }

    if (filters.statuses.length > 0) {
        sortableItems = sortableItems.filter(item => filters.statuses.includes(item.status));
    }

    if (filters.assignedTo.length > 0) {
        sortableItems = sortableItems.filter(item => filters.assignedTo.includes(item.assignedTo));
    }

    if (filters.planningStatus !== 'all') {
        sortableItems = sortableItems.filter(item => {
            const isUnplanned = item.day === -1;
            if (filters.planningStatus === 'planned') return !isUnplanned;
            if (filters.planningStatus === 'unplanned') return isUnplanned;
            return true;
        });
    }

    // Sorting
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'dueDate') {
            aValue = a.dueDay * 24 + a.dueHour;
            bValue = b.dueDay * 24 + b.dueHour;
        } else if (sortConfig.key === 'program') {
            aValue = masterTaskMap.get(a.name)?.program || '';
            bValue = masterTaskMap.get(b.name)?.program || '';
        } else {
            aValue = a[sortConfig.key as keyof Task];
            bValue = b[sortConfig.key as keyof Task];
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [allTasks, searchTerm, sortConfig, masterTaskMap, filters]);

  const formatTasksForExport = (tasks: Task[]) => {
    return tasks.map(task => {
        const masterTask = masterTaskMap.get(task.name);
        return {
            'ID': task.id,
            'Program': masterTask?.program || t('na'),
            'Sub-Program': masterTask?.subProgram || t('na'),
            'Order ID': task.orderId,
            'Name': task.name,
            'Short Name': task.shortName,
            'Status': getTaskStatusName(task.status),
            'Assigned To': task.day === -1 ? t('unplanned') : task.assignedTo,
            'Progress (%)': task.progress,
            'Description': task.description.replace(/\n/g, ' '),
            'Planned Day': task.day === -1 ? t('unplanned') : DAYS_OF_WEEK[task.day],
            'Start Hour': task.day === -1 ? t('na') : task.startHour,
            'Duration (hrs)': task.duration,
            'Due Day': DAYS_OF_WEEK[task.dueDay],
            'Due Hour': task.dueHour,
        }
    });
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const processTasks = (importedTasks: Partial<Task>[]) => {
    const existingTaskIds = new Set(allTasks.map(t => t.id));
    const maxExistingId = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.id)) : 0;
    let newIdCounter = 1;

    const processedTasks: TaskToUpload[] = importedTasks.map((importedTask, index) => {
        const baseTask: Partial<Task> = {
            id: 0, orderId: '', name: '', shortName: '',
            day: -1, startHour: -1, duration: 1, assignedTo: '', status: TaskStatus.ToDo,
            description: '', dueDay: 0, dueHour: 0, progress: 0, notes: null,
            displayOrder: 0,
        };

        const isUpdate = importedTask.id !== undefined && existingTaskIds.has(importedTask.id);
        
        let finalTask: Task;
        if (isUpdate) {
            const originalTask = allTasks.find(t => t.id === importedTask.id)!;
            finalTask = { ...originalTask, ...importedTask } as Task;
        } else {
            const newId = maxExistingId + newIdCounter++;
            finalTask = { ...baseTask, ...importedTask, id: newId } as Task;
            if (importedTask.displayOrder === undefined) {
                finalTask.displayOrder = allTasks.length + index;
            }
        }

        return {
            task: finalTask,
            changeType: isUpdate ? 'Update' : 'New',
        };
    });
    setTasksToUpload(processedTasks);
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  const getValueFromRow = (row: any, keys: string[]): any => {
    const rowKeys = Object.keys(row);
    for (const alias of keys) {
        const matchingRowKey = rowKeys.find(rk => rk.trim().toLowerCase() === alias.toLowerCase());
        if (matchingRowKey) {
          const value = row[matchingRowKey];
          if (value !== undefined && value !== null && String(value).trim() !== '') {
              return value;
          }
        }
    }
    return undefined;
  };

  const processTasksFromData = (rows: any[], currentMasterTasks: MasterTask[]) => {
    const currentMasterTaskMap = new Map(currentMasterTasks.map(mt => [mt.name, mt]));
    const dayNameToIndexMap = new Map<string, number>();
    getDaysOfWeek('long').forEach((day, i) => dayNameToIndexMap.set(day.toLowerCase(), i));
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach((day, i) => dayNameToIndexMap.set(day.toLowerCase(), i));
    ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].forEach((day, i) => dayNameToIndexMap.set(day.toLowerCase(), i));
    const statusNameToEnum: { [key: string]: TaskStatus } = {};
    allStatuses.forEach(s => {
        const statusName = getTaskStatusName(s);
        if (statusName) statusNameToEnum[statusName.toLowerCase()] = s;
        statusNameToEnum[s.toLowerCase()] = s;
    });

    const tasksFromExcel = rows.map((row): Partial<Task> | null => {
        const name = getValueFromRow(row, ['Name', 'Task Name', 'Task', 'Nom', 'Nom de la Tâche', 'Tâche']);
        const orderId = getValueFromRow(row, ['Order ID', 'Order #', 'Order No.', 'Order Number', 'Order', 'ID Commande', 'N° Commande', 'No Commande', 'Commande']);

        if (!name || !orderId) return null;

        const masterInfo = currentMasterTaskMap.get(String(name));
        let duration;
        const durationHrs = getValueFromRow(row, ['Duration (hrs)', 'Duration', 'Durée (h)', 'Durée']);
        if (durationHrs !== undefined) { duration = Number(durationHrs); }
        else { const durationDays = getValueFromRow(row, ['Duration (days)', 'Durée (j)']); if (durationDays !== undefined) duration = Number(durationDays) * WORK_DAY_HOURS; }
        if(duration === undefined || isNaN(duration) || duration <= 0) duration = masterInfo?.defaultDuration || 1;
        
        const id = getValueFromRow(row, ['ID']);
        const plannedDayStr = (getValueFromRow(row, ['Planned Day', 'Jour Planifié']) || 'unplanned').toString().toLowerCase();
        const dueDayStr = (getValueFromRow(row, ['Due Day', 'Jour Limite', 'Date Limite', "Date d'échéance"]) || '').toString().toLowerCase();
        const statusStr = (getValueFromRow(row, ['Status', 'Statut']) || '').toString().toLowerCase();
        const status = statusNameToEnum[statusStr] || TaskStatus.ToDo;
        const assignedToStr = getValueFromRow(row, ['Assigned To', 'Assigné à', 'Operateur', 'Operator']);
        let assignedTo = allOperators.includes(assignedToStr) ? assignedToStr : '';
        const task: Partial<Task> = {
            id: id !== undefined ? Number(id) : undefined,
            orderId: String(orderId), name: String(name),
            shortName: String(getValueFromRow(row, ['Short Name', 'Nom Court']) || masterInfo?.shortName || ''),
            status, assignedTo,
            progress: Number(getValueFromRow(row, ['Progress (%)', 'Progression (%)', 'Progrès (%)']) || 0),
            description: String(getValueFromRow(row, ['Description']) || masterInfo?.name || t('na')),
            day: plannedDayStr === 'unplanned' ? -1 : (dayNameToIndexMap.get(plannedDayStr) ?? -1),
            startHour: plannedDayStr === 'unplanned' ? -1 : Number(getValueFromRow(row, ['Start Hour', 'Heure de Début']) === 'N/A' ? -1 : getValueFromRow(row, ['Start Hour', 'Heure de Début']) || -1),
            duration, dueDay: dayNameToIndexMap.get(dueDayStr) ?? 0,
            dueHour: Number(getValueFromRow(row, ['Due Hour', 'Heure Limite']) || 0),
        };
        if (task.id !== undefined && isNaN(task.id)) { console.warn('Invalid ID found in row, ignoring ID field:', JSON.stringify(row)); delete task.id; }
        return task;
    }).filter((task): task is Partial<Task> => task !== null);

    if (tasksFromExcel.length === 0 && rows.length > 0) {
        const foundHeaders = Object.keys(rows[0]).join(', ');
        const errorMessage = `${t('orderlog.upload.missingFields')}\n${t('orderlog.upload.foundHeaders')}: ${foundHeaders}`;
        throw new Error(errorMessage);
    }
    processTasks(tasksFromExcel);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    const handleError = (error: unknown) => {
        console.error("File upload error:", error);
        const message = error instanceof Error ? error.message : t('orderlog.upload.unknownError');
        setUploadError(message);
        setTasksToUpload([]);
        setIsUploadModalOpen(true);
    };
    
    const analyzeData = (jsonData: any[]) => {
        try {
            const currentMasterTaskNames = new Set(masterTasks.map(mt => mt.name.toLowerCase()));
            const recognizedRows: any[] = [];
            const unrecognizedData: UnrecognizedTaskData[] = [];
            
            jsonData.forEach(row => {
                const name = getValueFromRow(row, ['Name', 'Task Name', 'Task', 'Nom', 'Nom de la Tâche', 'Tâche']);
                if (name && String(name).trim()) {
                    if (currentMasterTaskNames.has(String(name).toLowerCase())) {
                        recognizedRows.push(row);
                    } else {
                        unrecognizedData.push({
                            name: String(name),
                            program: getValueFromRow(row, ['Program', 'Programme']) || '',
                            subProgram: getValueFromRow(row, ['Sub-Program', 'Sub Program', 'Sous-Programme']) || '',
                            shortName: getValueFromRow(row, ['Short Name', 'Shortname', 'Nom Court']) || '',
                            defaultDuration: Number(getValueFromRow(row, ['Default Duration (hrs)', 'Default Duration', 'Duration', 'Durée par Défaut (h)', 'Durée par Défaut', 'Durée'])) || 1,
                            originalRow: row,
                        });
                    }
                }
            });

            if (unrecognizedData.length > 0) {
                setStagedRecognizedRows(recognizedRows);
                setUnrecognizedTasks(unrecognizedData);
                setIsUnrecognizedModalOpen(true);
            } else if (recognizedRows.length > 0) {
                processTasksFromData(recognizedRows, masterTasks);
            } else {
                throw new Error(t('orderlog.upload.missingFields'));
            }
        } catch(error) { handleError(error) }
    };

    if (file.name.endsWith('.json')) {
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error(t('orderlog.upload.notReadable'));
                const data = JSON.parse(text);
                if (!Array.isArray(data)) throw new Error(t('orderlog.upload.invalidJsonFormat'));
                analyzeData(data);
            } catch (error) { handleError(error); }
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) throw new Error(t('orderlog.upload.emptyFile'));
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
                analyzeData(jsonData);
            } catch (error) { handleError(error); }
        };
        reader.readAsArrayBuffer(file);
    } else {
        handleError(new Error(t('orderlog.upload.unsupportedType')));
    }

    event.target.value = '';
  };

  const handleConfirmAddMasterTasks = (newlyDefinedMasterTasks: MasterTask[]) => {
      onUpdateMasterTasks([...masterTasks, ...newlyDefinedMasterTasks]);
      
      const allRowsToProcess = [
          ...stagedRecognizedRows,
          ...unrecognizedTasks.map(ut => ut.originalRow)
      ];
      
      const updatedMasterTasks = [...masterTasks, ...newlyDefinedMasterTasks];
      processTasksFromData(allRowsToProcess, updatedMasterTasks);

      setIsUnrecognizedModalOpen(false);
      setStagedRecognizedRows([]);
      setUnrecognizedTasks([]);
  };

  const handleConfirmUpload = () => {
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    tasksToUpload.forEach(({ task }) => {
        taskMap.set(task.id, task);
    });
    const mergedTasks = Array.from(taskMap.values());
    onUpdateTasks(mergedTasks);
    closeModal();
  };

  const closeModal = () => {
      setIsUploadModalOpen(false);
      setUploadError(null);
      setTasksToUpload([]);
  };

  const uploadSummary = useMemo(() => {
    if (uploadError) return null;
    const newCount = tasksToUpload.filter(t => t.changeType === 'New').length;
    const updatedCount = tasksToUpload.filter(t => t.changeType === 'Update').length;
    return { newCount, updatedCount };
  }, [tasksToUpload, uploadError]);

  const handleExportCSVClick = () => {
    if (sortedAndFilteredTasks.length === 0) {
        alert(t('orderlog.export.noData'));
        return;
    }

    const dataToExport = formatTasksForExport(sortedAndFilteredTasks);
    if (dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]);
    const escapeCsvCell = (cellData: any): string => {
        const stringData = String(cellData ?? '');
        if (/[",\n]/.test(stringData)) {
            return `"${stringData.replace(/"/g, '""')}"`;
        }
        return stringData;
    };

    const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => escapeCsvCell(row[header as keyof typeof row])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `order_database_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXLSXClick = () => {
    if (sortedAndFilteredTasks.length === 0) {
        alert(t('orderlog.export.noData'));
        return;
    }
    const dataToExport = formatTasksForExport(sortedAndFilteredTasks);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OrderData");

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `order_database_export_${timestamp}.xlsx`);
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col transition-colors duration-300">
      <header className="pb-4 border-b border-slate-700 mb-6 flex-shrink-0 flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-300">{t('orderlog.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="search"
                placeholder={t('orderlog.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-slate-100/80 dark:bg-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <button 
                onClick={handleFileUploadClick} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5z" /><path d="M9 13h2v5a1 1 0 11-2 0v-5z" /></svg>
                {t('orderlog.upload.button')}
            </button>
            <button 
                onClick={handleExportXLSXClick} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-green-600 hover:bg-green-500 text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 4h12v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6zm3.5-3.5a.5.5 0 00.5-.5v-1a.5.5 0 00-1 0v1a.5.5 0 00.5.5z" />
                  <path d="M8.561 11.182a.5.5 0 00-.707 0l-1.5 1.5a.5.5 0 00.707.708l1.5-1.5a.5.5 0 000-.708zm2.122 2.122a.5.5 0 00.707 0l1.5-1.5a.5.5 0 00-.707-.708l-1.5 1.5a.5.5 0 000 .708z M8.5 14a.5.5 0 00.5.5h2a.5.5 0 000-1h-2a.5.5 0 00-.5.5z" />
              </svg>
                {t('orderlog.export.button')}
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex-grow overflow-auto border border-slate-700 rounded-lg">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow-md transition-colors duration-300">
            <tr>
              {columnVisibility.program && <SortableHeader label={t('columns.program')} sortKey="program" sortConfig={sortConfig} requestSort={requestSort} />}
              {columnVisibility.orderId && <SortableHeader label={t('columns.orderId')} sortKey="orderId" sortConfig={sortConfig} requestSort={requestSort} />}
              {columnVisibility.task && <SortableHeader label={t('columns.task')} sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />}
              {columnVisibility.status && <SortableHeader label={t('columns.status')} sortKey="status" sortConfig={sortConfig} requestSort={requestSort} />}
              {columnVisibility.assignedTo && <SortableHeader label={t('columns.assignedTo')} sortKey="assignedTo" sortConfig={sortConfig} requestSort={requestSort} />}
              {columnVisibility.dueBy && <SortableHeader label={t('columns.dueBy')} sortKey="dueDate" sortConfig={sortConfig} requestSort={requestSort} />}
              {columnVisibility.bestMatch && <th className="py-1.5 px-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('columns.bestMatch')}</th>}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900/50 transition-colors duration-300">
            {sortedAndFilteredTasks.map(task => {
                const isUnplanned = task.day === -1;
                const statusColor = TASK_STATUS_COLORS[task.status];
                const dueDateString = `${DAYS_OF_WEEK_SHORT[task.dueDay]}`;
                const masterInfo = masterTaskMap.get(task.name);
                const suggestion = offlineSuggestions[task.id];
                return (
                    <tr key={task.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {columnVisibility.program && <td className="py-2 px-3">
                            <div className='font-medium text-cyan-300'>{masterInfo?.program || t('na')}</div>
                            <div className='text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300'>{masterInfo?.subProgram || t('na')}</div>
                        </td>}
                        {columnVisibility.orderId && <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400 transition-colors duration-300">{task.orderId}</td>}
                        {columnVisibility.task && <td className="py-2 px-3 font-medium text-white">{task.name}</td>}
                        {columnVisibility.status && <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${statusColor.background} ${statusColor.text}`}>
                                {getTaskStatusName(task.status)}
                            </span>
                        </td>}
                        {columnVisibility.assignedTo && <td className={`py-2 px-3 font-medium ${isUnplanned ? 'text-slate-500' : 'text-slate-300'}`}>
                            {isUnplanned ? t('unplanned') : task.assignedTo}
                        </td>}
                        {columnVisibility.dueBy && <td className="py-2 px-3">{dueDateString}</td>}
                        {columnVisibility.bestMatch && <td className="py-2 px-3">
                            {isUnplanned ? (
                                suggestion ? (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">{suggestion}</span>
                                        <button onClick={() => handleAssignTask(task, suggestion)} className="px-2 py-1 text-xs font-semibold rounded bg-cyan-500 hover:bg-cyan-600 text-white transition-colors">
                                            {t('actions.assign')}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSuggestOperator(task)}
                                        className="flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 3.5a5.5 5.5 0 00-5.5 5.5c0 2.236 1.343 4.156 3.25 5.022V16.5a.5.5 0 00.5.5h3.5a.5.5 0 00.5-.5v-2.478A5.501 5.501 0 0015.5 9 5.5 5.5 0 0010 3.5zM12 18.5a1.5 1.5 0 11-4 0 1.5 1.5 0 014 0z" />
                                        </svg>
                                        {t('actions.suggestMatch')}
                                    </button>
                                )
                            ) : (
                                <span className="text-slate-500 text-xs">{t('na')}</span>
                            )}
                        </td>}
                    </tr>
                );
            })}
          </tbody>
        </table>
        {sortedAndFilteredTasks.length === 0 && (
            <div className="text-center py-16 text-slate-500">
                <p>{t('orderlog.noOrders')}</p>
            </div>
        )}
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.xlsx,.xls" className="hidden" />

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeModal}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col w-full max-w-4xl max-h-[90vh] border border-slate-200 dark:border-slate-700 transition-colors duration-300"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="flex-shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('orderlog.upload.title')}</h2>
                </header>
                
                {uploadError ? (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex-grow flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        <h3 className="text-lg font-semibold text-white mb-2">{t('orderlog.upload.failed')}</h3>
                        <div className="text-sm text-center">
                            {uploadError.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-shrink-0 transition-colors duration-300"
                            dangerouslySetInnerHTML={{ __html: t('orderlog.upload.summary', `<strong class="text-green-400">${uploadSummary?.newCount}</strong>`, `<strong class="text-cyan-400">${uploadSummary?.updatedCount}</strong>`) }}>
                        </p>
                        <div className="flex-grow overflow-y-auto border border-slate-700 rounded-lg">
                             <table className="w-full text-sm text-left text-slate-300">
                                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow transition-colors duration-300">
                                    <tr>
                                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('orderlog.upload.table.change')}</th>
                                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('orderlog.upload.table.orderId')}</th>
                                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('orderlog.upload.table.taskName')}</th>
                                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('orderlog.upload.table.status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900/50 transition-colors duration-300">
                                    {tasksToUpload.map(({task, changeType}) => (
                                        <tr key={task.id} className="border-b border-slate-700/50">
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${changeType === 'New' ? 'bg-green-500/30 text-green-300' : 'bg-cyan-500/30 text-cyan-300'}`}>
                                                    {t(`orderlog.upload.changeType.${changeType.toLowerCase()}`)}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono">{task.orderId}</td>
                                            <td className="p-3 font-medium text-white">{task.name}</td>
                                            <td className="p-3">{getTaskStatusName(task.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <footer className="flex justify-end items-center gap-4 mt-6 flex-shrink-0">
                    <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800">
                        {uploadError ? t('actions.close') : t('actions.cancel')}
                    </button>
                    {!uploadError && (
                        <button onClick={handleConfirmUpload} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-cyan-500 hover:bg-cyan-600 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800">
                            {t('actions.confirm')}
                        </button>
                    )}
                </footer>
            </div>
        </div>
      )}
      
      <UnrecognizedTaskModal
        isOpen={isUnrecognizedModalOpen}
        onClose={() => setIsUnrecognizedModalOpen(false)}
        onConfirm={handleConfirmAddMasterTasks}
        initialTasks={unrecognizedTasks}
      />

    </div>
  );
};

export default OrderLogPage;
