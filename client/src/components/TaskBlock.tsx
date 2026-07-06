
import React from 'react';
import { Task, TaskStatus } from '@/types';
import { useLocalization } from '@/contexts/LocalizationContext';

interface TaskBlockProps {
  task: Task;
  onInteractionStart: (type: 'drag' | 'progress' | 'resize-start' | 'resize-end', event: React.MouseEvent, task: Task) => void;
  onDoubleClick: (task: Task) => void;
  onContextMenu: (event: React.MouseEvent, task: Task) => void;
  isSelected: boolean;
  isOverdue: boolean;
  left: number;
  width: number;
}

const TaskBlock: React.FC<TaskBlockProps> = ({ task, onInteractionStart, onDoubleClick, onContextMenu, isSelected, isOverdue, left, width }) => {
  const { t } = useLocalization();
  const baseColor = 'bg-blue-500 border-blue-700';
  const overdueColor = 'bg-red-600/90 border-red-800';
  const criticalColor = 'bg-orange-500 border-orange-700';
  
  const selectedClasses = isSelected ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-cyan-500 dark:ring-cyan-400 z-20' : 'hover:brightness-125';
  const isLocked = task.status === TaskStatus.Completed || task.status === TaskStatus.QualityOK;

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only allow left click for drag
    if (isLocked) return;
    onInteractionStart('drag', e, task);
  };
  
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (isLocked) return;
    onInteractionStart('progress', e, task);
  };
  
  const handleResizeStartMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (isLocked) return;
    onInteractionStart('resize-start', e, task);
  };

  const handleResizeEndMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (isLocked) return;
    onInteractionStart('resize-end', e, task);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu(e, task);
  };

  const colorClasses = isLocked ? baseColor : task.isCritical ? criticalColor : isOverdue ? overdueColor : baseColor;

  let progressColor = 'bg-green-500/80';
  if (task.status === TaskStatus.QualityOK) {
    progressColor = 'bg-purple-500/90';
  } else if (task.progress === 100) {
    progressColor = 'bg-emerald-500/90';
  } else if (isOverdue) {
    progressColor = 'bg-red-500/80';
  }

  const style: React.CSSProperties = {
      position: 'absolute',
      top: '4px',
      bottom: '4px',
      left: `${left}px`,
      width: `${width}px`,
  };

  return (
    <div
      style={style}
      className={`task-block group rounded-md shadow-lg flex flex-col justify-center relative overflow-hidden ${colorClasses} ${selectedClasses} ${isLocked ? '' : 'cursor-move'} ${isSelected ? '' : 'transition-all duration-150 ease-in-out'}`}
      title={t('gantt.tooltip.task', task.name, task.progress)}
      onMouseDown={handleDragMouseDown}
      onDoubleClick={() => onDoubleClick(task)}
      onContextMenu={handleContextMenu}
      aria-selected={isSelected}
      draggable={false}
    >
      {/* Start Resize Handle */}
      {!isLocked && (
        <div
            onMouseDown={handleResizeStartMouseDown}
            className="absolute top-0 bottom-0 w-3 cursor-w-resize flex items-center justify-start left-0 z-10"
            title={t('gantt.tooltip.resizeStart')}
        >
            <div className="bg-white/70 h-1/2 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      )}

      {/* Progress "Flow Bar" */}
      <div
          className={`absolute top-0 left-0 h-full ${progressColor} transition-colors`}
          style={{ width: `${task.progress}%` }}
      ></div>

      <div className="relative w-full text-center px-2 pointer-events-none">
        <strong className="font-semibold text-xs text-white truncate">{task.shortName}</strong>
      </div>
      
      {/* End Resize Handle */}
      {!isLocked && (
        <div
          onMouseDown={handleResizeEndMouseDown}
          className="absolute top-0 bottom-0 w-3 cursor-e-resize flex items-center justify-end right-0 z-10"
          title={t('gantt.tooltip.resizeEnd')}
        >
          <div className="bg-white/70 h-1/2 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      )}

      {/* Progress Adjust Handle */}
      {!isLocked && (
        <div
          onMouseDown={handleProgressMouseDown}
          className="absolute top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-end z-10"
          style={{ left: `calc(${task.progress}% - 9px)` }}
          title={t('gantt.tooltip.adjustProgress')}
        >
          <div className="bg-white/70 h-1/2 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      )}

      {isOverdue && !isLocked && (
         <div className="absolute top-1 right-1 animate-pulse" title={t('gantt.tooltip.overdue')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
         </div>
      )}
    </div>
  );
};

export default TaskBlock;
