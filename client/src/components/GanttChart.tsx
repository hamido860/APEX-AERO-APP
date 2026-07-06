
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Task, TaskStatus, MasterTask } from '@/types';
import { TASK_STATUS_COLORS, WORK_DAY_HOURS, WORK_HOURS } from '@/constants';
import TaskBlock from './TaskBlock';
import { useLocalization } from '@/contexts/LocalizationContext';
import { FilterDropdown } from './FilterDropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { ColumnFilter } from './ColumnFilter';

interface FiltersState {
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
  [key: string]: any; // Allow other filter properties
}

interface GanttChartProps {
  tasks: Task[];
  allTasks: Task[]; // Full list for dependency lookups
  allOperators: string[];
  onTaskSelect: (task: Task) => void;
  onOperatorSelect: (operatorName: string) => void;
  selectedTaskId?: number | null;
  onTaskUpdate: (task: Task) => void;
  columnVisibility: { [key: string]: boolean };
  onGanttInteractionChange: (isInteracting: boolean) => void;
  onTaskReorder: (draggedTaskId: number, targetTaskId: number) => void;
  masterTasks: MasterTask[];
  filters: FiltersState;
  onFilterChange: (filterType: keyof FiltersState, value: string | boolean) => void;
  onClearFilters: () => void;
  hourWidth: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWeek: () => void;
}

interface InteractionState {
  type: 'drag' | 'progress' | 'resize-start' | 'resize-end';
  task: Task;
  initialMouseX: number;
  initialStartHour: number;
  initialDay: number;
  initialProgress: number;
  initialDuration: number;
}

interface ColumnResizeState {
  id: string;
  startX: number;
  startWidth: number;
}

interface ContextMenuState {
    isOpen: boolean;
    x: number;
    y: number;
    task: Task | null;
}


// Removed fixed HOUR_WIDTH constant, using state instead
const TASK_ROW_HEIGHT = 28;
const HEADER_HEIGHT = 64;
const OVERSCAN_COUNT = 5; // Number of items to render above and below the viewport

// Icon definitions
const iconProps = { className: "h-5 w-5 text-slate-300 group-hover:text-cyan-400 transition-colors", strokeWidth: 2, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ClipboardListIcon = () => <svg {...iconProps}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const HashtagIcon = () => <svg {...iconProps}><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>;
const ShieldCheckIcon = () => <svg {...iconProps}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>;
const LineChartIcon = () => <svg {...iconProps}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
const UserCircleIcon = () => <svg {...iconProps}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>;
const TagIcon = () => <svg {...iconProps}><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l5 5a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-5-5A2 2 0 0 0 12.586 2.586Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>;
const ChartPieIcon = () => <svg {...iconProps}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>;
const CalendarIcon = () => <svg {...iconProps}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>;
const ClockIcon = () => <svg {...iconProps}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><polyline points="12 6 12 12 16 14"/></svg>;

const GanttChart: React.FC<GanttChartProps> = ({ tasks, allTasks, allOperators, onTaskSelect, onOperatorSelect, selectedTaskId, onTaskUpdate, columnVisibility, onGanttInteractionChange, onTaskReorder, masterTasks, filters, onFilterChange, onClearFilters, hourWidth, onZoomIn, onZoomOut, onFitWeek }) => {
  const { t, getDaysOfWeek, getTaskStatusName } = useLocalization();
  const { theme } = useTheme();
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [transientTask, setTransientTask] = useState<Task | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [activeInteractionTaskId, setActiveInteractionTaskId] = useState<number | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);
  
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isOpen: false, x: 0, y: 0, task: null });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const [currentTimeLeft, setCurrentTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const updateTimeLine = () => {
      const now = new Date();
      const day = now.getDay(); // 0-6 (Sun-Sat)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Workday is 8:00 to 17:00 (9 hours)
      const workHour = hours + minutes / 60 - 8;
      const clampedWorkHour = Math.max(0, Math.min(9, workHour));
      
      const totalWorkHours = (day * WORK_DAY_HOURS) + clampedWorkHour;
      setCurrentTimeLeft(totalWorkHours * hourWidth);
    };

    updateTimeLine();
    const interval = setInterval(updateTimeLine, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [hourWidth]);

  const columnConfig = useMemo(() => [
    { id: 'task', label: t('columns.task'), width: 176, alwaysVisible: true, icon: <ClipboardListIcon /> },
    { id: 'orderId', label: t('columns.orderId'), width: 80, icon: <HashtagIcon /> },
    { id: 'quality', label: t('columns.quality'), width: 40, icon: <ShieldCheckIcon /> },
    { id: 'realisation', label: t('columns.realisation'), width: 64, icon: <LineChartIcon /> },
    { id: 'assignedTo', label: t('columns.assignedTo'), width: 96, icon: <UserCircleIcon /> },
    { id: 'status', label: t('columns.status'), width: 88, icon: <TagIcon /> },
    { id: 'progress', label: t('columns.progress'), width: 96, icon: <ChartPieIcon /> },
    { id: 'dueBy', label: t('columns.dueBy'), width: 80, icon: <CalendarIcon /> },
    { id: 'duration', label: t('columns.duration'), width: 56, icon: <ClockIcon /> },
  ], [t]);

  const [columnWidths, setColumnWidths] = useState(() => 
    Object.fromEntries(columnConfig.map(c => [c.id, c.width]))
  );
  const [resizingColumn, setResizingColumn] = useState<ColumnResizeState | null>(null);

  const [statusPopup, setStatusPopup] = useState<{ isOpen: boolean; task: Task | null; position: { top: number; left: number }; }>({ isOpen: false, task: null, position: { top: 0, left: 0 } });
  const statusPopupRef = useRef<HTMLDivElement>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const DAYS_OF_WEEK = getDaysOfWeek('long');
  const DAYS_OF_WEEK_SHORT = getDaysOfWeek('short');
  const TOTAL_HOURS = DAYS_OF_WEEK.length * WORK_DAY_HOURS;

  const visibleColumns = useMemo(() => 
    columnConfig.filter(c => c.alwaysVisible || columnVisibility[c.id as keyof typeof columnVisibility])
  , [columnVisibility, columnConfig]);

  const leftColWidths = useMemo(() => visibleColumns.map(c => columnWidths[c.id]), [visibleColumns, columnWidths]);
  const totalLeftWidth = useMemo(() => leftColWidths.reduce((a, b) => a + b, 0), [leftColWidths]);
  const timelineWidth = TOTAL_HOURS * hourWidth;
  const totalGridWidth = totalLeftWidth + timelineWidth;
  
  const gridRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  };
  
  useEffect(() => {
    if (gridRef.current) {
      setContainerHeight(gridRef.current.clientHeight);
    }
  }, []);

  // Notify parent about interaction state
  useEffect(() => {
    const isInteracting = interaction !== null || isPanning || resizingColumn !== null || draggedTaskId !== null;
    onGanttInteractionChange(isInteracting);
  }, [interaction, isPanning, resizingColumn, onGanttInteractionChange, draggedTaskId]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!interaction) return;
    
    const dx = event.clientX - interaction.initialMouseX;
    let updatedTask = { ...interaction.task };

    if (interaction.type === 'drag') {
      const hourDelta = dx / hourWidth;
      const newTotalStartHour = (interaction.initialDay * WORK_DAY_HOURS) + interaction.initialStartHour + hourDelta;
      const maxTotalStartHour = TOTAL_HOURS - updatedTask.duration;
      const clampedTotalStartHour = Math.max(0, Math.min(newTotalStartHour, maxTotalStartHour));
      updatedTask.day = Math.floor(clampedTotalStartHour / WORK_DAY_HOURS);
      updatedTask.startHour = clampedTotalStartHour % WORK_DAY_HOURS;
    } else if (interaction.type === 'progress') {
        const taskWidthPx = updatedTask.duration * hourWidth;
        if (taskWidthPx > 0) {
            const progressDelta = (dx / taskWidthPx) * 100;
            const newProgress = interaction.initialProgress + progressDelta;
            updatedTask.progress = Math.max(0, Math.min(100, newProgress));
        }
    } else if (interaction.type === 'resize-start') {
        const hourDelta = dx / hourWidth;
        const initialTotalStartHour = (interaction.initialDay * WORK_DAY_HOURS) + interaction.initialStartHour;
        const initialTotalEndHour = initialTotalStartHour + interaction.initialDuration;
        
        let newTotalStartHour = initialTotalStartHour + hourDelta;
        
        newTotalStartHour = Math.max(0, Math.min(newTotalStartHour, initialTotalEndHour - 0.5));
        
        const newDuration = initialTotalEndHour - newTotalStartHour;

        updatedTask.day = Math.floor(newTotalStartHour / WORK_DAY_HOURS);
        updatedTask.startHour = newTotalStartHour % WORK_DAY_HOURS;
        updatedTask.duration = newDuration;
    } else if (interaction.type === 'resize-end') {
        const hourDelta = dx / hourWidth;
        const newDuration = interaction.initialDuration + hourDelta;
        
        const totalStartHour = updatedTask.day * WORK_DAY_HOURS + updatedTask.startHour;
        const maxDuration = TOTAL_HOURS - totalStartHour;
        
        updatedTask.duration = Math.max(0.5, Math.min(newDuration, maxDuration));
    }
    setTransientTask(updatedTask);
  }, [interaction, TOTAL_HOURS, hourWidth]);

  const handleMouseUp = useCallback(() => {
    if (interaction && transientTask) {
        // Snap to grid on release
        const snappedTask = { ...transientTask };
        
        // Snap start position
        const totalStartHour = (snappedTask.day * WORK_DAY_HOURS) + snappedTask.startHour;
        const snappedTotalStartHour = Math.round(totalStartHour);
        snappedTask.day = Math.floor(snappedTotalStartHour / WORK_DAY_HOURS);
        snappedTask.startHour = snappedTotalStartHour % WORK_DAY_HOURS;
        
        // Snap duration
        snappedTask.duration = Math.round(snappedTask.duration);
        if (snappedTask.duration < 1) snappedTask.duration = 1;
        
        // Snap progress
        snappedTask.progress = Math.round(snappedTask.progress);

        onTaskUpdate(snappedTask);
    }
    setInteraction(null);
    setTransientTask(null);
    setActiveInteractionTaskId(null);
  }, [interaction, transientTask, onTaskUpdate]);

  const handlePanStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.group') || (e.target as HTMLElement).closest('.gantt-left-cell') || (e.target as HTMLElement).closest('.header-cell') || (e.target as HTMLElement).closest('svg')) {
        return;
    }
    
    e.preventDefault();
    setIsPanning(true);
    setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: gridRef.current?.scrollLeft || 0,
        scrollTop: gridRef.current?.scrollTop || 0,
    });
  };

  const handleColumnResizeStart = useCallback((event: React.MouseEvent, columnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setResizingColumn({
        id: columnId,
        startX: event.clientX,
        startWidth: columnWidths[columnId],
    });
  }, [columnWidths]);

  const handleColumnResize = useCallback((event: MouseEvent) => {
    if (!resizingColumn) return;
    const dx = event.clientX - resizingColumn.startX;
    const newWidth = Math.max(60, resizingColumn.startWidth + dx); // Min width 60px
    setColumnWidths(prev => ({...prev, [resizingColumn.id]: newWidth}));
  }, [resizingColumn]);

  const handleColumnResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);
  
  const handleDragStart = useCallback((e: React.DragEvent, taskId: number) => {
      e.dataTransfer.setData('text/plain', taskId.toString());
      e.dataTransfer.effectAllowed = 'move';
      setDraggedTaskId(taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, taskId: number) => {
      e.preventDefault();
      if (taskId !== dragOverTaskId) {
          setDragOverTaskId(taskId);
      }
  }, [dragOverTaskId]);

  const handleDrop = useCallback((e: React.DragEvent, targetTaskId: number) => {
      e.preventDefault();
      if (draggedTaskId !== null && draggedTaskId !== targetTaskId) {
          onTaskReorder(draggedTaskId, targetTaskId);
      }
      setDraggedTaskId(null);
      setDragOverTaskId(null);
  }, [draggedTaskId, onTaskReorder]);

  const handleDragEnd = useCallback(() => {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
  }, []);


  useEffect(() => {
    const ganttElement = gridRef.current;
    const handleWindowMouseMove = (e: MouseEvent) => {
        if (resizingColumn) {
            handleColumnResize(e);
        } else if (isPanning && ganttElement) {
            e.preventDefault();
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            ganttElement.scrollLeft = panStart.scrollLeft - dx;
            ganttElement.scrollTop = panStart.scrollTop - dy;
        } else if (interaction) {
            handleMouseMove(e);
        }
    };
    const handleWindowMouseUp = () => {
        setIsPanning(false);
        if (interaction) {
            handleMouseUp();
        }
        if (resizingColumn) {
            handleColumnResizeEnd();
        }
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning, panStart, interaction, handleMouseMove, handleMouseUp, resizingColumn, handleColumnResize, handleColumnResizeEnd]);
  
  useEffect(() => {
      const ganttElement = gridRef.current;
      if (!ganttElement) return;
      
      if (resizingColumn) {
          document.body.style.cursor = 'col-resize';
      } else if (isPanning) {
          document.body.style.cursor = 'grabbing';
          ganttElement.style.cursor = 'grabbing';
      } else if (interaction) {
          ganttElement.style.cursor = 'default';
          if (interaction.type === 'drag') document.body.style.cursor = 'move';
          else if (interaction.type === 'progress') document.body.style.cursor = 'col-resize';
          else if (interaction.type === 'resize-start') document.body.style.cursor = 'w-resize';
          else if (interaction.type === 'resize-end') document.body.style.cursor = 'e-resize';
      } else {
          document.body.style.cursor = 'default';
          ganttElement.style.cursor = 'default';
      }

      return () => { document.body.style.cursor = 'default'; };
  }, [isPanning, interaction, resizingColumn]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusPopup.isOpen && statusPopupRef.current && !statusPopupRef.current.contains(event.target as Node)) {
        setStatusPopup({ isOpen: false, task: null, position: { top: 0, left: 0 } });
      }
      if (contextMenu.isOpen && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
          setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusPopup.isOpen, contextMenu.isOpen]);

  const handleInteractionStart = (
    type: 'drag' | 'progress' | 'resize-start' | 'resize-end',
    event: React.MouseEvent,
    task: Task
  ) => {
    if (task.status === TaskStatus.Completed || task.status === TaskStatus.QualityOK || event.button !== 0) return;
    event.stopPropagation();
    setActiveInteractionTaskId(task.id);
    setInteraction({ 
        type, 
        task, 
        initialMouseX: event.clientX, 
        initialStartHour: task.startHour, 
        initialDay: task.day, 
        initialProgress: task.progress,
        initialDuration: task.duration
    });
    setTransientTask(task);
  };

  const handleStatusClick = (event: React.MouseEvent, task: Task) => {
    if (task.status === TaskStatus.QualityOK) return;
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusPopup({
      isOpen: true,
      task,
      position: { top: rect.bottom + 4, left: rect.left },
    });
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (statusPopup.task) {
      const updatedTask = { ...statusPopup.task, status: newStatus };
      if (newStatus === TaskStatus.Completed) {
        updatedTask.progress = 100;
      } else if (statusPopup.task.status === TaskStatus.Completed) {
        updatedTask.progress = 90;
      }
      onTaskUpdate(updatedTask);
    }
    setStatusPopup({ isOpen: false, task: null, position: { top: 0, left: 0 } });
  };
  
  const handleQualityCheck = (task: Task, isChecked: boolean) => {
      if (isChecked && task.status === TaskStatus.Completed) {
          onTaskUpdate({ ...task, status: TaskStatus.QualityOK });
      }
  };

  const handleContextMenuAction = (status: TaskStatus) => {
      if (contextMenu.task) {
          const updatedTask = { ...contextMenu.task, status };
          if (status === TaskStatus.Completed) {
              updatedTask.progress = 100;
          } else if (contextMenu.task.status === TaskStatus.Completed) {
              updatedTask.progress = 90; // Revert to in-progress state approximate
          }
          onTaskUpdate(updatedTask);
      }
      setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  const handleTaskContextMenu = (event: React.MouseEvent, task: Task) => {
      setContextMenu({
          isOpen: true,
          x: event.clientX,
          y: event.clientY,
          task
      });
  };

  const isTaskOverdue = (task: Task) => {
    const endTotalHour = (task.day * WORK_DAY_HOURS) + task.startHour + task.duration;
    const dueTotalHour = (task.dueDay * WORK_DAY_HOURS) + task.dueHour + 1; // Due by end of hour
    return endTotalHour > dueTotalHour;
  };
  
  const getFormattedTime = (hourIndex: number) => {
      const hour = hourIndex + 8; // 8 AM is our base
      return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 && hour < 24 ? 'PM' : 'AM'}`;
  };

  // Format duration from decimal hours to h/m format
  const formatDuration = (hours: number) => {
    if (hours === 0) return '0h';
    if (hours < 0.016667) return '0h'; // Less than 1 minute
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    // Handle rounding edge case where minutes round to 60
    if (minutes === 60) {
      return `${wholeHours + 1}h`;
    }
    
    // If less than 1 hour, show only minutes
    if (wholeHours === 0) {
      return minutes > 0 ? `${minutes}m` : '0h';
    }
    
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  };

  const renderCellContent = (task: Task, columnId: string) => {
    const isOverdueValue = isTaskOverdue(task);
    switch (columnId) {
        case 'task':
            return (
                <>
                    <div className={`w-1.5 h-full rounded-full mr-3 flex-shrink-0 ${task.isCritical ? 'bg-orange-400' : (isOverdueValue && task.status !== TaskStatus.Completed && task.status !== TaskStatus.QualityOK ? 'bg-red-500' : 'bg-transparent')}`}></div>
                    <span className="font-medium text-[#04274e] dark:text-slate-100 truncate text-[10px] transition-colors duration-300">{task.name}</span>
                </>
            );
        case 'orderId':
            return <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">{task.orderId}</span>;
        case 'quality':
            const isQualityCheckable = task.status === TaskStatus.Completed;
            const isQualityOK = task.status === TaskStatus.QualityOK;
            return (
                <div className="w-full flex justify-center">
                    <input
                        type="checkbox"
                        checked={isQualityOK}
                        disabled={!isQualityCheckable && !isQualityOK}
                        onChange={(e) => handleQualityCheck(task, e.target.checked)}
                        onClick={(e) => e.stopPropagation()} // Prevent row selection
                        className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-purple-600 dark:text-purple-500 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isQualityCheckable ? t('gantt.quality.checkableTooltip') : isQualityOK ? t('gantt.quality.checkedTooltip') : t('gantt.quality.disabledTooltip')}
                    />
                </div>
            );
        case 'realisation':
            const realisedHours = (task.duration * task.progress) / 100;
            const isTrackingLate = isOverdueValue && task.progress < 100;
            const textColor = isTrackingLate ? 'text-red-400 font-bold' : 'text-green-400';
            return (
              <span className={`font-medium ${textColor}`}>
                {formatDuration(realisedHours)}
              </span>
            );
        case 'assignedTo':
            return (
                <button
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        onOperatorSelect(task.assignedTo);
                    }}
                    className="text-slate-600 dark:text-slate-300 truncate text-left w-full h-full hover:text-cyan-600 dark:hover:text-cyan-400 font-medium transition-colors text-[10px]"
                >
                    {task.assignedTo}
                </button>
            );
        case 'status':
            const statusColor = TASK_STATUS_COLORS[task.status];
            const isQualityOKStatus = task.status === TaskStatus.QualityOK;
            return (
                <button
                    onClick={(e) => handleStatusClick(e, task)}
                    disabled={isQualityOKStatus}
                    className={`w-full text-center px-2.5 py-1 text-[10px] font-bold rounded-full whitespace-nowrap ${statusColor.background} ${statusColor.text} ${!isQualityOKStatus && 'transition-all hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-800 hover:ring-cyan-400'} disabled:cursor-default disabled:hover:ring-0`}
                >
                    {getTaskStatusName(task.status)}
                </button>
            );
        case 'progress':
            let progressColor = 'bg-green-500';
            if (task.status === TaskStatus.QualityOK) {
                progressColor = 'bg-purple-500';
            } else if (task.progress === 100) {
                progressColor = 'bg-emerald-500';
            } else if (isOverdueValue) {
                progressColor = 'bg-red-500';
            }

            return (
                <div className="w-full flex items-center gap-2">
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div 
                            className={`${progressColor} h-2 rounded-full transition-colors`} 
                            style={{ width: `${task.progress}%` }}
                        ></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-8 text-right">{task.progress}%</span>
                </div>
            );
        case 'dueBy':
            const dueDateString = `${DAYS_OF_WEEK_SHORT[task.dueDay]}`;
            const dueTime = getFormattedTime(task.dueHour + 1);
            return <span className="text-slate-600 dark:text-slate-300 text-[10px] font-medium">{`${dueDateString}, ${dueTime}`}</span>;
        case 'duration':
            return <span className="text-slate-600 dark:text-slate-300 font-medium text-[10px]">{formatDuration(task.duration)}</span>;
        default:
            return null;
    }
  };

  // 1. Stable map of all tasks with their indices. Re-computes only when tasks list changes (order/add/remove).
  const taskMapWithIndex = useMemo(() => new Map(tasks.map((t, i) => [t.id, { task: t, index: i }])), [tasks]);

  // VIRTUALIZATION LOGIC
  const startIndex = Math.max(0, Math.floor(scrollTop / TASK_ROW_HEIGHT) - OVERSCAN_COUNT);
  const visibleItemCount = containerHeight ? Math.ceil(containerHeight / TASK_ROW_HEIGHT) : 0;
  const endIndex = Math.min(tasks.length, startIndex + visibleItemCount + OVERSCAN_COUNT * 2);

  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i < endIndex; i++) {
        let task = tasks[i];
        if (transientTask && task.id === transientTask.id) {
            task = transientTask;
        }
        items.push({ task, index: i });
    }
    return items;
  }, [startIndex, endIndex, tasks, transientTask]);

  const hasActiveFilters = () => {
    return (
      filters.program.length > 0 ||
      filters.subProgram.length > 0 ||
      filters.operator.length > 0 ||
      filters.status.length > 0 ||
      filters.taskName !== '' ||
      filters.orderId !== '' ||
      filters.assignedTo !== '' ||
      filters.quality.length > 0 ||
      filters.progressMin > 0 ||
      filters.progressMax < 100 ||
      filters.durationMin > 0 ||
      filters.durationMax < 24 ||
      filters.realisationMin > 0 ||
      filters.realisationMax < 24 ||
      filters.dueByMin > 0 ||
      filters.dueByMax < 6 ||
      filters.showCriticalOnly
    );
  };

  const getActiveFilterColumns = () => {
    const active = [];
    if (filters.taskName) active.push('task');
    if (filters.orderId) active.push('orderId');
    if (filters.quality.length > 0) active.push('quality');
    if (filters.realisationMin > 0 || filters.realisationMax < 24) active.push('realisation');
    if (filters.assignedTo) active.push('assignedTo');
    if (filters.status.length > 0) active.push('status');
    if (filters.progressMin > 0 || filters.progressMax < 100) active.push('progress');
    if (filters.dueByMin > 0 || filters.dueByMax < 6) active.push('dueBy');
    if (filters.durationMin > 0 || filters.durationMax < 24) active.push('duration');
    return active;
  };

  const activeColumns = getActiveFilterColumns();

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-full flex flex-col overflow-hidden transition-colors duration-300">
        {hasActiveFilters() && (
            <div className="bg-cyan-50 dark:bg-slate-800/50 border-b border-cyan-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Active Filters:</span>
                    {activeColumns.map(col => (
                        <span key={col} className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-200 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-300 rounded text-[9px] font-medium">
                            {col.charAt(0).toUpperCase() + col.slice(1)}
                            <span className="text-cyan-600 dark:text-cyan-400">✓</span>
                        </span>
                    ))}
                </div>
                <button
                    onClick={onClearFilters}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-semibold rounded transition-colors duration-200 flex-shrink-0"
                    title="Clear all active filters"
                >
                    Clear All
                </button>
            </div>
        )}
        <div 
            ref={gridRef} 
            onScroll={handleScroll}
            className="overflow-auto flex-grow w-full select-none relative custom-scrollbar scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent"
        >
            {/* STICKY HEADER */}
            <div 
                className="sticky top-0 z-20 flex"
                style={{ width: totalGridWidth, height: HEADER_HEIGHT }}
            >
                {/* Left Columns Header */}
                <div className="flex flex-shrink-0 bg-white dark:bg-slate-900">
                    {visibleColumns.map((col) => (
                        <div key={col.id} title={col.label} className={`group relative font-bold text-[9px] uppercase tracking-widest p-2 flex flex-col items-center justify-center text-center border-b border-r border-slate-200 dark:border-slate-800/50 header-cell transition-colors ${activeColumns.includes(col.id) ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-500'}`} style={{width: columnWidths[col.id], height: HEADER_HEIGHT}}>
                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                {col.icon}
                            </div>
                            <span className="transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400 text-[8px]">{col.label}</span>
                            <ColumnFilter columnId={col.id} filters={filters} onFilterChange={onFilterChange} />
                            <div
                                onMouseDown={(e) => handleColumnResizeStart(e, col.id)}
                                className="absolute top-0 right-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-cyan-500/30 transition-all"
                                title={t('gantt.resizeColumn', col.label)}
                            />
                        </div>
                    ))}
                </div>
                {/* Timeline Header */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 relative" style={{height: HEADER_HEIGHT}}>
                    {/* Current Time Header Marker */}
                    {currentTimeLeft !== null && (
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
                            style={{ left: currentTimeLeft }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                        </div>
                    )}
                    <div className="flex flex-1">
                    {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center justify-center text-cyan-600 dark:text-cyan-500 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/50" style={{width: WORK_DAY_HOURS * hourWidth}}>{day}</div>
                    ))}
                    </div>
                    <div className="flex flex-1">
                    {Array.from({length: TOTAL_HOURS}).map((_, hourIndex) => (
                        <div key={`h-${hourIndex}`} className="flex items-center justify-center text-slate-500 dark:text-slate-500 font-mono text-[9px] font-bold border-b border-r border-slate-200 dark:border-slate-800/30 bg-white dark:bg-slate-900" style={{width: hourWidth}}>{WORK_HOURS[hourIndex % WORK_DAY_HOURS]}</div>
                    ))}
                    </div>
                </div>
            </div>

            {/* EMPTY STATE */}
            {tasks.length === 0 && (
                <div className="flex items-center justify-center h-96 w-full">
                    <div className="text-center">
                        <div className="text-5xl mb-4 opacity-30">📭</div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No tasks found</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No tasks match your current filters.</p>
                        <button
                            onClick={onClearFilters}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded transition-colors duration-200"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* VIRTUALIZED BODY */}
            <div style={{ height: tasks.length * TASK_ROW_HEIGHT, width: totalGridWidth, position: 'relative' }} onDragOver={(e) => e.preventDefault()}>
                
                {/* Current Time Line */}
                {currentTimeLeft !== null && (
                    <div 
                        className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
                        style={{ left: totalLeftWidth + currentTimeLeft }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                    </div>
                )}

                {/* Dependency Lines removed as requested */}

                {visibleItems.map(({ task, index }) => {
                    const isBeingDragged = draggedTaskId === task.id;
                    const isDragTarget = dragOverTaskId === task.id;
                    return (
                        <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragOver={(e) => handleDragOver(e, task.id)}
                            onDrop={(e) => handleDrop(e, task.id)}
                            onDragEnd={handleDragEnd}
                            onDragLeave={() => setDragOverTaskId(null)}
                            style={{
                                position: 'absolute',
                                top: index * TASK_ROW_HEIGHT,
                                left: 0,
                                height: TASK_ROW_HEIGHT,
                                width: totalGridWidth,
                            }}
                            className={`flex items-stretch cursor-grab ${isBeingDragged ? 'opacity-50' : ''} ${isDragTarget ? 'bg-cyan-500/20' : ''}`}
                        >
                             {/* Left Cells */}
                            <div 
                                className={`flex flex-shrink-0 ${
                                    task.id === selectedTaskId || task.id === activeInteractionTaskId 
                                        ? 'bg-cyan-50 dark:bg-slate-700' 
                                        : (index % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-900' : 'bg-white dark:bg-slate-800')
                                } transition-colors duration-200`}
                                style={{ width: totalLeftWidth }}
                            >
                                {visibleColumns.map(col => (
                                    <div
                                        key={col.id}
                                        onDoubleClick={() => onTaskSelect(task)}
                                        className="flex items-center px-3 border-b border-r border-slate-200 dark:border-slate-800/50 gantt-left-cell group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50 transition-colors"
                                        style={{width: columnWidths[col.id]}}
                                    >
                                        <div className="w-full truncate">
                                            {renderCellContent(task, col.id)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Timeline Pane */}
                            <div
                                style={{ 
                                    width: timelineWidth, 
                                    height: TASK_ROW_HEIGHT,
                                    backgroundImage: theme === 'dark' 
                                        ? `linear-gradient(to right, transparent ${hourWidth - 1}px, rgba(51, 65, 85, 0.3) ${hourWidth - 1}px, rgba(51, 65, 85, 0.3) ${hourWidth}px)`
                                        : `linear-gradient(to right, transparent ${hourWidth - 1}px, rgba(203, 213, 225, 0.4) ${hourWidth - 1}px, rgba(203, 213, 225, 0.4) ${hourWidth}px)`,
                                    backgroundSize: `${hourWidth}px 100%`
                                }}
                                className={`relative border-b border-slate-200 dark:border-slate-700/50 ${
                                    task.id === selectedTaskId || task.id === activeInteractionTaskId 
                                        ? 'bg-cyan-50 dark:bg-slate-700' 
                                        : (index % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-900' : 'bg-white dark:bg-slate-800')
                                } transition-colors duration-200`}
                            >
                                <TaskBlock
                                    task={task}
                                    onInteractionStart={handleInteractionStart}
                                    onDoubleClick={onTaskSelect}
                                    onContextMenu={handleTaskContextMenu}
                                    isSelected={task.id === selectedTaskId || task.id === activeInteractionTaskId}
                                    isOverdue={isTaskOverdue(task)}
                                    left={ (task.day * WORK_DAY_HOURS + task.startHour) * hourWidth}
                                    width={task.duration * hourWidth}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      {/* Status Popup (Left Column) */}
      {statusPopup.isOpen && statusPopup.task && (
        <div
          ref={statusPopupRef}
          className="fixed z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg shadow-2xl p-2 transition-colors duration-300"
          style={{ top: statusPopup.position.top, left: statusPopup.position.left }}
        >
          <div className="flex flex-col gap-1 w-36">
            {Object.values(TaskStatus).filter(s => s !== TaskStatus.QualityOK).map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 text-sm text-left rounded-md w-full ${TASK_STATUS_COLORS[status].text} ${TASK_STATUS_COLORS[status].background} hover:brightness-125 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100`}
                disabled={status === statusPopup.task?.status}
              >
                {getTaskStatusName(status)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context Menu (Task Blocks) */}
      {contextMenu.isOpen && contextMenu.task && (
          <div
              ref={contextMenuRef}
              className="fixed z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1.5 min-w-[160px] animate-fade-in-up transition-colors duration-300"
              style={{ top: contextMenu.y, left: contextMenu.x }}
          >
              <div className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 mb-1 transition-colors duration-300">
                  {t('columns.status')}
              </div>
              <div className="flex flex-col gap-1">
                  {Object.values(TaskStatus).filter(s => s !== TaskStatus.QualityOK).map(status => (
                      <button
                          key={status}
                          onClick={() => handleContextMenuAction(status)}
                          className={`px-3 py-2 text-sm text-left rounded-lg w-full flex items-center gap-2 transition-all ${
                              contextMenu.task?.status === status 
                                  ? 'bg-slate-700 dark:bg-slate-800 text-white' 
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                      >
                          <div className={`w-2 h-2 rounded-full ${TASK_STATUS_COLORS[status].background.replace('bg-', 'bg-')}`}></div>
                          {getTaskStatusName(status)}
                      </button>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default GanttChart;
