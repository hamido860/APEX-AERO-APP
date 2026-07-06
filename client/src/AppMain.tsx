
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, MasterTask, RankSettings, ProficiencyOverrides, TaskStatus, Rank, getRank } from '@/types';
import { db } from '@/services/db';
import { DEFAULT_RANK_SETTINGS, rankToScore } from '@/constants';
import GanttChart from '@/components/GanttChart';
import AdminPage from '@/components/AdminPage';
import DashboardPage from '@/components/DashboardPage';
import TaskDetailSidebar from '@/components/TaskDetailSidebar';
import OperatorDetailSidebar from '@/components/OperatorDetailSidebar';
import UserLogPage from '@/components/UserLogPage';
import OrderLogPage from '@/components/OrderLogPage';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

import TaskDatabasePage from '@/components/TaskDatabasePage';
import ScheduleInfoModal from '@/components/ScheduleInfoModal';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useToast } from '@/components/Toast';

// Icons
const GanttIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PlannerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;

const DBIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
const VersatilityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MasterTaskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ProcessSimulatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>;

export const App = () => {
  const { t } = useLocalization();
  const { addToast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [masterTasks, setMasterTasks] = useState<MasterTask[]>([]);
  const [rankSettings, setRankSettings] = useState<RankSettings>(DEFAULT_RANK_SETTINGS);
  const [proficiencyOverrides, setProficiencyOverrides] = useState<ProficiencyOverrides>({});
  
  const [currentView, setCurrentView] = useState('gantt');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isGanttInteracting, setIsGanttInteracting] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isScheduleInfoModalOpen, setIsScheduleInfoModalOpen] = useState(false);
  const [hourWidth, setHourWidth] = useState(32);

  // Filters for Gantt
  const [ganttFilters, setGanttFilters] = useState<{
    program: string[];
    subProgram: string[];
    operator: string[];
    status: string[];
    taskName: string;
    orderId: string;
    assignedTo: string;
    quality: string[];
    progressMin: number;
    progressMax: number;
    durationMin: number;
    durationMax: number;
    realisationMin: number;
    realisationMax: number;
    dueByMin: number;
    dueByMax: number;
    showCriticalOnly: boolean;
  }>({

    program: [],
    subProgram: [],
    operator: [],
    status: [],
    taskName: '',
    orderId: '',
    assignedTo: '',
    quality: [],
    progressMin: 0,
    progressMax: 100,
    durationMin: 0,
    durationMax: 24,
    realisationMin: 0,
    realisationMax: 24,
    dueByMin: 0,
    dueByMax: 6,
    showCriticalOnly: false
  });

  const [dashboardFilters, setDashboardFilters] = useState<{
    status: TaskStatus[];
    operator: string[];
    showOverdueOnly: boolean;
  }>({
    status: [],
    operator: [],
    showOverdueOnly: false,
  });

  const [ganttColumnVisibility, setGanttColumnVisibility] = useState({
    task: true, orderId: true, quality: true, realisation: true, assignedTo: true, status: true, progress: true, dueBy: true, duration: true
  });
  const [taskDatabaseColumnVisibility, setTaskDatabaseColumnVisibility] = useState({
    program: true, subProgram: true, task: true, shortName: true, defaultDuration: true, actions: true
  });

  const [orderLogFilters, setOrderLogFilters] = useState({
    programs: [] as string[],
    statuses: [] as TaskStatus[],
    assignedTo: [] as string[],
    planningStatus: 'all' as 'all' | 'planned' | 'unplanned'
  });

  const [taskDatabaseSearchTerm, setTaskDatabaseSearchTerm] = useState('');
  const [isTaskDatabaseAddModalOpen, setIsTaskDatabaseAddModalOpen] = useState(false);
  const taskDatabaseFileInputRef = React.useRef<HTMLInputElement>(null);

  const [userLogPendingOverrides, setUserLogPendingOverrides] = useState<ProficiencyOverrides>(proficiencyOverrides);
  const [isUserLogSettingsModalOpen, setIsUserLogSettingsModalOpen] = useState(false);
  const [isUserLogAddTaskModalOpen, setIsUserLogAddTaskModalOpen] = useState(false);

  useEffect(() => {
    setUserLogPendingOverrides(proficiencyOverrides);
  }, [proficiencyOverrides]);

  const userLogAreChangesUnsaved = useMemo(() => JSON.stringify(proficiencyOverrides) !== JSON.stringify(userLogPendingOverrides), [proficiencyOverrides, userLogPendingOverrides]);

  const userLogMetrics = useMemo(() => {
        const calculatedCounts: { [key: string]: number } = {};
        tasks.forEach(task => {
            if (task.assignedTo && (task.status === TaskStatus.Completed || task.status === TaskStatus.QualityOK)) {
                const key = `${task.assignedTo}::${task.name}`;
                calculatedCounts[key] = (calculatedCounts[key] || 0) + 1;
            }
        });

        const getProficiencyCount = (operator: string, taskName: string): number => {
            return userLogPendingOverrides[operator]?.[taskName] ?? calculatedCounts[`${operator}::${taskName}`] ?? 0;
        };

        let totalScore = 0;
        const totalPossibleEntries = operators.length * masterTasks.length;
        operators.forEach(op => {
            masterTasks.forEach(mTask => {
                const count = getProficiencyCount(op, mTask.name);
                const rank = getRank(count, rankSettings);
                totalScore += rankToScore[rank];
            });
        });
        const teamVersatilityScore = totalPossibleEntries > 0 ? ((totalScore / (totalPossibleEntries * 5)) * 100).toFixed(1) : '0.0';

        const totalCompletions = Object.values(calculatedCounts).reduce((sum, count) => sum + count, 0);

        const masterOperators = new Set<string>();
        operators.forEach(op => {
            masterTasks.forEach(mTask => {
                const count = getProficiencyCount(op, mTask.name);
                if (getRank(count, rankSettings) === Rank.Master) {
                    masterOperators.add(op);
                }
            });
        });
        const masterRankCount = masterOperators.size;

        let mostVersatile = { name: t('na'), count: 0 };
        operators.forEach(op => {
            let proficientTaskCount = 0;
            masterTasks.forEach(mTask => {
                if (getProficiencyCount(op, mTask.name) > 0) {
                    proficientTaskCount++;
                }
            });
            if (proficientTaskCount > mostVersatile.count) {
                mostVersatile = { name: op, count: proficientTaskCount };
            }
        });

        return { teamVersatilityScore, totalCompletions, masterRankCount, mostVersatileOperator: mostVersatile.name };
    }, [tasks, operators, masterTasks, userLogPendingOverrides, rankSettings, t]);

  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await db.initDB();
        const data = await db.getAllData();
        setTasks(data.tasks);
        setOperators(data.operators);
        setMasterTasks(data.masterTasks);
        setRankSettings(data.rankSettings);
        setProficiencyOverrides(data.proficiencyOverrides);
        setUserLogPendingOverrides(data.proficiencyOverrides);
        setIsDbReady(true);
      } catch (error) {
        console.error("Initialization failed", error);
        addToast("Failed to load database. Please refresh.", "error");
      }
    };
    init();
  }, [addToast]);

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    if (selectedTask?.id === updatedTask.id) {
        setSelectedTask(updatedTask);
    }
    db.updateTask(updatedTask);
    addToast(t('app.saved'), 'success');
  }, [tasks, selectedTask, t, addToast]);

  const handleSetTasks = useCallback((newTasks: Task[]) => {
      setTasks(newTasks);
      db.replaceTasks(newTasks);
      addToast(t('app.saved'), 'success');
  }, [t, addToast]);

  const handleSetMasterTasks = useCallback((newMasterTasks: MasterTask[]) => {
      setMasterTasks(newMasterTasks);
      db.replaceMasterTasks(newMasterTasks);
      addToast(t('app.saved'), 'success');
  }, [t, addToast]);

  const handleSetRankSettings = useCallback((newSettings: RankSettings) => {
      setRankSettings(newSettings);
      db.updateRankSettings(newSettings);
      addToast(t('app.saved'), 'success');
  }, [t, addToast]);

  const handleSetProficiencyOverrides = useCallback((newOverrides: ProficiencyOverrides) => {
      setProficiencyOverrides(newOverrides);
      db.replaceProficiencyOverrides(newOverrides);
      addToast(t('app.saved'), 'success');
  }, [t, addToast]);

  const handleGanttTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsSidebarOpen(true);
  };

  const handleOperatorSelect = (operator: string) => {
    setSelectedOperator(operator);
    setIsSidebarOpen(true);
  };

  const handleTaskReorder = (draggedTaskId: number, targetTaskId: number) => {
      const draggedTaskIndex = tasks.findIndex(t => t.id === draggedTaskId);
      const targetTaskIndex = tasks.findIndex(t => t.id === targetTaskId);
      
      if (draggedTaskIndex === -1 || targetTaskIndex === -1) return;

      const newTasks = [...tasks];
      const [draggedTask] = newTasks.splice(draggedTaskIndex, 1);
      newTasks.splice(targetTaskIndex, 0, draggedTask);
      
      // Update display orders
      const updatedTasks = newTasks.map((t, index) => ({ ...t, displayOrder: index }));
      
      setTasks(updatedTasks);
      db.replaceTasks(updatedTasks);
  };

  // Gantt Filters Handlers
  const handleGanttFilterChange = (filterType: keyof typeof ganttFilters, value: string | boolean) => {
      setGanttFilters(prev => {
          if (filterType === 'showCriticalOnly') {
              return { ...prev, showCriticalOnly: value as boolean };
          }
          const list = prev[filterType] as string[];
          const val = value as string;
          return {
              ...prev,
              [filterType]: list.includes(val) ? list.filter(v => v !== val) : [...list, val]
          };
      });
  };

  const handleClearGanttFilters = () => {
      setGanttFilters({ program: [], subProgram: [], operator: [], status: [], taskName: '', orderId: '', assignedTo: '', quality: [], progressMin: 0, progressMax: 100, durationMin: 0, durationMax: 24, realisationMin: 0, realisationMax: 24, dueByMin: 0, dueByMax: 6, showCriticalOnly: false });
  };

  const handleOrderLogFilterChange = (filterType: string, value: any) => {
    setOrderLogFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleClearOrderLogFilters = () => {
    setOrderLogFilters({ programs: [], statuses: [], assignedTo: [], planningStatus: 'all' });
  };

  // Zoom Handlers
  const handleZoomIn = useCallback(() => setHourWidth(prev => Math.min(120, prev + 5)), []);
  const handleZoomOut = useCallback(() => setHourWidth(prev => Math.max(20, prev - 5)), []);
  const handleFitWeek = useCallback(() => setHourWidth(40), []);

  // Dashboard Filters Handlers
  const handleDashboardFilterChange = (filterType: keyof typeof dashboardFilters, value: string | boolean) => {
      setDashboardFilters(prev => {
          if (filterType === 'showOverdueOnly') return { ...prev, showOverdueOnly: value as boolean };
          const list = prev[filterType as 'status' | 'operator'];
          if (!Array.isArray(list)) return prev;
          return {
              ...prev,
              [filterType]: list.includes(value as any) ? list.filter(v => v !== value) : [...list, value as any]
          };
      });
  };

  const handleClearDashboardFilters = () => {
      setDashboardFilters({ status: [], operator: [], showOverdueOnly: false });
  };

  const visibleTasks = useMemo(() => {
      return tasks.filter(t => {
          if (t.day === -1) return false;
          const master = masterTasks.find(mt => mt.name === t.name);
          
          if (ganttFilters.showCriticalOnly && !t.isCritical) return false;
          if (ganttFilters.program.length > 0 && (!master || !ganttFilters.program.includes(master.program))) return false;
          if (ganttFilters.subProgram.length > 0 && (!master || !ganttFilters.subProgram.includes(master.subProgram))) return false;
          if (ganttFilters.operator.length > 0 && !ganttFilters.operator.includes(t.assignedTo)) return false;
          if (ganttFilters.status.length > 0 && !ganttFilters.status.includes(t.status)) return false;
          if (ganttFilters.taskName && !t.name.toLowerCase().includes(ganttFilters.taskName.toLowerCase())) return false;
          if (ganttFilters.orderId && !t.orderId.toLowerCase().includes(ganttFilters.orderId.toLowerCase())) return false;
          if (ganttFilters.assignedTo && !t.assignedTo.toLowerCase().includes(ganttFilters.assignedTo.toLowerCase())) return false;
          
          // Progress filter
          if (t.progress < ganttFilters.progressMin || t.progress > ganttFilters.progressMax) return false;
          
          // Duration filter
          if (t.duration < ganttFilters.durationMin || t.duration > ganttFilters.durationMax) return false;
          
          // Realisation filter (duration * progress / 100)
          const realisedHours = (t.duration * t.progress) / 100;
          if (realisedHours < ganttFilters.realisationMin || realisedHours > ganttFilters.realisationMax) return false;
          
          // Due By filter
          if (t.dueDay < ganttFilters.dueByMin || t.dueDay > ganttFilters.dueByMax) return false;
          
          return true;
      });
  }, [tasks, masterTasks, ganttFilters]);

  const dashboardTasks = useMemo(() => {
      return tasks.filter(t => {
          if (dashboardFilters.showOverdueOnly) {
             const endTotalHour = (t.day * 9) + t.startHour + t.duration;
             const dueTotalHour = (t.dueDay * 9) + t.dueHour + 1;
             if (!(endTotalHour > dueTotalHour && t.status !== TaskStatus.Completed && t.status !== TaskStatus.QualityOK)) return false;
          }
          if (dashboardFilters.status.length > 0 && !dashboardFilters.status.includes(t.status)) return false;
          if (dashboardFilters.operator.length > 0 && !dashboardFilters.operator.includes(t.assignedTo)) return false;
          return true;
      });
  }, [tasks, dashboardFilters]);

  const dashboardMetrics = useMemo(() => {
    const plannedTasks = dashboardTasks.filter(t => t.day !== -1);
    const unplannedCount = dashboardTasks.length - plannedTasks.length;
    const totalHours = plannedTasks.reduce((sum, task) => sum + task.duration, 0);
    const totalWeightedProgress = plannedTasks.reduce((sum, task) => sum + (task.progress * task.duration), 0);
    const overallProgress = totalHours > 0 ? Math.round(totalWeightedProgress / totalHours) : 0;
    
    const isTaskOverdue = (task: Task) => {
        if (task.day === -1) return false;
        const endTotalHour = (task.day * 9) + task.startHour + task.duration;
        const dueTotalHour = (task.dueDay * 9) + task.dueHour + 1;
        return endTotalHour > dueTotalHour && task.status !== TaskStatus.Completed && task.status !== TaskStatus.QualityOK;
    };
    const overdueCount = plannedTasks.filter(isTaskOverdue).length;

    return { 
        plannedCount: plannedTasks.length,
        unplannedCount, 
        totalHours,
        overallProgress,
        overdueCount
    };
}, [dashboardTasks]);

  const navItems = [
    { id: 'gantt', label: t('nav.gantt'), icon: <GanttIcon /> },
    { id: 'dashboard', label: t('nav.dashboard'), icon: <DashboardIcon /> },
    { id: 'admin', label: t('nav.planner'), icon: <PlannerIcon /> },
    { id: 'orderlog', label: t('nav.orderDatabase'), icon: <DBIcon /> },
    { id: 'userlog', label: t('nav.versatilityGrid'), icon: <VersatilityIcon /> },
    { id: 'taskdatabase', label: t('nav.masterTasks'), icon: <MasterTaskIcon /> },
  ];

  const toggleColumn = (id: string) => {
      if (currentView === 'gantt') {
          setGanttColumnVisibility(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
      } else if (currentView === 'taskdatabase') {
          setTaskDatabaseColumnVisibility(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
      }
  };

  const getColumnConfig = () => {
      if (currentView === 'gantt') {
          return [
              { id: 'orderId', key: 'columns.orderId' },
              { id: 'quality', key: 'columns.quality' },
              { id: 'realisation', key: 'columns.realisation' },
              { id: 'assignedTo', key: 'columns.assignedTo' },
              { id: 'status', key: 'columns.status' },
              { id: 'progress', key: 'columns.progress' },
              { id: 'dueBy', key: 'columns.dueBy' },
              { id: 'duration', key: 'columns.duration' }
          ];
      }
      if (currentView === 'taskdatabase') {
          return [
              { id: 'program', key: 'columns.program' },
              { id: 'subProgram', key: 'columns.subProgram' },
              { id: 'task', key: 'columns.task' },
              { id: 'shortName', key: 'columns.shortName' },
              { id: 'defaultDuration', key: 'columns.defaultDuration' },
              { id: 'actions', key: 'taskdatabase.actions.title' }
          ];
      }
      return [];
  };

  const handleManualSave = useCallback(() => {
    db.saveNow();
    addToast(t('app.saved'), 'success');
  }, [t, addToast]);

  const renderMainContent = () => {
    if (!isDbReady) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Loading your workspace...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard': return (
        <DashboardPage 
            tasks={tasks} 
            allOperators={operators}
            masterTasks={masterTasks}
            filters={dashboardFilters}
            onFilterChange={handleDashboardFilterChange}
            onClearFilters={handleClearDashboardFilters}
        />
      );
      case 'admin': return ( <AdminPage onUpdateTasks={handleSetTasks} allTasks={tasks} allOperators={operators} masterTasks={masterTasks} rankSettings={rankSettings} /> );
      case 'orderlog': return ( 
        <OrderLogPage 
            allTasks={tasks} 
            masterTasks={masterTasks} 
            onUpdateTasks={handleSetTasks} 
            onUpdateMasterTasks={handleSetMasterTasks} 
            allOperators={operators} 
            rankSettings={rankSettings} 
            columnVisibility={{program: true, orderId: true, task: true, status: true, assignedTo: true, dueBy: true, bestMatch: true}} 
            filters={orderLogFilters}
            onFilterChange={handleOrderLogFilterChange}
            onClearFilters={handleClearOrderLogFilters}
        /> 
      );
      case 'userlog': return ( <UserLogPage allOperators={operators} allTasks={tasks} masterTasks={masterTasks} onUpdateMasterTasks={handleSetMasterTasks} proficiencyOverrides={proficiencyOverrides} onUpdateOverrides={handleSetProficiencyOverrides} rankSettings={rankSettings} onUpdateRankSettings={handleSetRankSettings} pendingOverrides={userLogPendingOverrides} onUpdatePendingOverrides={setUserLogPendingOverrides} isSettingsModalOpen={isUserLogSettingsModalOpen} setIsSettingsModalOpen={setIsUserLogSettingsModalOpen} isAddTaskModalOpen={isUserLogAddTaskModalOpen} setIsAddTaskModalOpen={setIsUserLogAddTaskModalOpen} /> );
      case 'taskdatabase': return ( <TaskDatabasePage allTasks={tasks} masterTasks={masterTasks} onUpdateMasterTasks={handleSetMasterTasks} columnVisibility={taskDatabaseColumnVisibility} searchTerm={taskDatabaseSearchTerm} isAddTaskModalOpen={isTaskDatabaseAddModalOpen} setIsAddTaskModalOpen={setIsTaskDatabaseAddModalOpen} fileInputRef={taskDatabaseFileInputRef} /> );
      case 'gantt':
      default: return ( <GanttChart tasks={visibleTasks} allTasks={tasks} allOperators={operators} onTaskSelect={handleGanttTaskSelect} selectedTaskId={selectedTask?.id} onTaskUpdate={handleTaskUpdate} onOperatorSelect={handleOperatorSelect} columnVisibility={ganttColumnVisibility} onGanttInteractionChange={setIsGanttInteracting} onTaskReorder={handleTaskReorder} masterTasks={masterTasks} filters={ganttFilters} onFilterChange={handleGanttFilterChange} onClearFilters={handleClearGanttFilters} hourWidth={hourWidth} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onFitWeek={handleFitWeek} /> );
    }
  };

  const renderSidebarContent = () => {
      if (selectedTask) {
          return (
              <TaskDetailSidebar
                  task={selectedTask}
                  allTasks={tasks}
                  onUpdateTasks={handleSetTasks}
                  onClose={() => { setSelectedTask(null); setIsSidebarOpen(false); }}
                  onBackToOperator={selectedOperator ? () => setSelectedTask(null) : undefined}
                  operatorContext={selectedOperator}
              />
          );
      }
      if (selectedOperator) {
          const operatorTasks = tasks.filter(t => t.assignedTo === selectedOperator && t.day !== -1).sort((a,b) => (a.day*9 + a.startHour) - (b.day*9 + b.startHour));
          return (
              <OperatorDetailSidebar
                  operatorName={selectedOperator}
                  assignedTasks={operatorTasks}
                  onTaskSelect={(task) => setSelectedTask(task)}
                  onClose={() => { setSelectedOperator(null); setIsSidebarOpen(false); }}
              />
          );
      }
      return null;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Horizontal Top Navbar */}
      <nav className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/50 flex-shrink-0 flex items-center px-4 py-0 h-12 gap-1 z-40 transition-colors duration-300">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4 flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 rounded-lg shadow-md shadow-cyan-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 3 21 3s-3 0-4.5 1.5L13 8l-8.2-1.8L3 8l6.7 3.5-2.8 2.8-3.1-1.2L2 15l3.5 1.5L7 20l1.9-1.9-1.2-3.1 2.8-2.8 3.5 6.7 1.8-1.8z" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[8px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.3em]">Apex Aero</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase flex items-center">
              Sched<span className="text-cyan-500">u</span>ler
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-0 flex-1 min-w-0 justify-around">
          {navItems.map(item => (
            <div key={item.id} className="relative group flex-1 flex justify-center">
              <button
                onClick={() => { setCurrentView(item.id); setSelectedTask(null); setSelectedOperator(null); setIsSidebarOpen(false); }}
                className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 relative ${
                  currentView === item.id 
                    ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50' 
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {currentView === item.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-500 rounded-full"></div>
                )}
                <span className={`[&>svg]:h-[18px] [&>svg]:w-[18px] ${currentView === item.id ? 'text-cyan-500' : ''}`}>
                  {item.icon}
                </span>
              </button>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50 shadow-lg">
                {item.label}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
              </div>
            </div>
          ))}
        </div>
        {/* Separator */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0"></div>
        {/* Filters & Tools inline */}
        <DashboardHeader 
            pageTitle={t(`pageTitle.${currentView}`) || t('nav.gantt')}
            currentView={currentView}
            onManualSave={handleManualSave}
            columnVisibility={currentView === 'gantt' ? ganttColumnVisibility : taskDatabaseColumnVisibility}
            columnConfig={getColumnConfig()}
            isColumnMenuOpen={isColumnMenuOpen}
            onSetIsColumnMenuOpen={setIsColumnMenuOpen}
            onColumnToggle={toggleColumn}
            masterTasks={masterTasks}
            allOperators={operators}
            filters={currentView === 'gantt' ? ganttFilters : undefined}
            onFilterChange={currentView === 'gantt' ? handleGanttFilterChange : undefined}
            onClearFilters={currentView === 'gantt' ? handleClearGanttFilters : undefined}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitWeek={handleFitWeek}
            onOpenScheduleInfo={() => setIsScheduleInfoModalOpen(true)}
            dashboardMetrics={currentView === 'dashboard' ? dashboardMetrics : undefined}
            orderLogFilters={currentView === 'orderlog' ? orderLogFilters : undefined}
            onOrderLogFilterChange={currentView === 'orderlog' ? handleOrderLogFilterChange : undefined}
            onClearOrderLogFilters={currentView === 'orderlog' ? handleClearOrderLogFilters : undefined}
            taskDatabaseControls={currentView === 'taskdatabase' ? {
                searchTerm: taskDatabaseSearchTerm,
                onSearchChange: setTaskDatabaseSearchTerm,
                onUploadClick: () => taskDatabaseFileInputRef.current?.click(),
                onAddClick: () => setIsTaskDatabaseAddModalOpen(true)
            } : undefined}
            userLogControls={currentView === 'userlog' ? {
                metrics: userLogMetrics,
                areChangesUnsaved: userLogAreChangesUnsaved,
                onDiscard: () => setUserLogPendingOverrides(proficiencyOverrides),
                onSave: () => handleSetProficiencyOverrides(userLogPendingOverrides),
                onAddTask: () => setIsUserLogAddTaskModalOpen(true),
                onSettings: () => setIsUserLogSettingsModalOpen(true)
            } : undefined}
        />
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative transition-colors duration-300 overflow-hidden">
        <main className="flex-1 overflow-hidden p-0 relative">
            {renderMainContent()}
        </main>
        
        {/* Right Sidebar (Details) */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => { setIsSidebarOpen(false); setSelectedTask(null); setSelectedOperator(null); }}>
            {renderSidebarContent()}
        </Sidebar>

        <ScheduleInfoModal 
            isOpen={isScheduleInfoModalOpen} 
            onClose={() => setIsScheduleInfoModalOpen(false)} 
        />
      </div>
    </div>
  );
};
