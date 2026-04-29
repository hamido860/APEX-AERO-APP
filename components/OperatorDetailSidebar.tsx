
import React from 'react';
import { Task, TaskStatus } from '../types';
import { TASK_STATUS_COLORS, WORK_HOURS } from '../constants';
import { useLocalization } from '../contexts/LocalizationContext';

interface OperatorDetailSidebarProps {
  operatorName: string;
  assignedTasks: Task[];
  onTaskSelect: (task: Task) => void;
  onClose: () => void;
}

const OperatorTaskItem: React.FC<{ task: Task; onSelect: () => void }> = ({ task, onSelect }) => {
    const { t, getDaysOfWeek, getTaskStatusName } = useLocalization();
    const DAYS_OF_WEEK_SHORT = getDaysOfWeek('short');

    const statusColor = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS[TaskStatus.ToDo];
    const dueDateString = `${DAYS_OF_WEEK_SHORT[task.dueDay]}`;

    const workDayHours = WORK_HOURS.length;
    const endTotalHour = (task.day * workDayHours) + task.startHour + task.duration;
    const dueTotalHour = (task.dueDay * workDayHours) + task.dueHour + 1;
    const isOverdue = endTotalHour > dueTotalHour && task.status !== TaskStatus.Completed;
    
    let progressColor = 'bg-green-500';
    if (task.progress === 100) {
        progressColor = 'bg-emerald-500';
    } else if (isOverdue) {
        progressColor = 'bg-red-500';
    }

    return (
        <button 
            onClick={onSelect} 
            className="w-full text-left p-3 rounded-lg bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-start gap-3"
        >
            <div className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-cyan-400'}`}></div>
            <div className="flex-1">
                <p className="font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{task.name}</p>
                
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-full bg-slate-600 rounded-full h-1.5">
                        <div 
                            className={`${progressColor} h-1.5 rounded-full transition-colors`} 
                            style={{ width: `${task.progress}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 w-8 text-right transition-colors duration-300">{task.progress}%</span>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={`px-2 py-0.5 font-bold rounded-full ${statusColor.background} ${statusColor.text}`}>
                        {getTaskStatusName(task.status)}
                    </span>
                    <span className={`font-medium transition-colors duration-300 ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {t('details.due')}: {dueDateString}
                    </span>
                </div>
            </div>
        </button>
    );
};


const OperatorDetailSidebar: React.FC<OperatorDetailSidebarProps> = ({ operatorName, assignedTasks, onTaskSelect, onClose }) => {
    const { t } = useLocalization();
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl h-full flex flex-col p-4 shadow-2xl transition-colors duration-300">
            <header className="flex items-start justify-between pb-4 border-b border-slate-700">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{t('operatorDetails.title')}</span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2 transition-colors duration-300">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        {operatorName}
                    </h2>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                    aria-label={t('actions.close')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-grow overflow-y-auto pt-4 pr-2 -mr-4">
                 <p className="text-sm text-slate-300 font-medium mb-4">{t('operatorDetails.assignedTasks', assignedTasks.length)}</p>
                 {assignedTasks.length > 0 ? (
                    <div className="space-y-3">
                        {assignedTasks.map(task => (
                            <OperatorTaskItem 
                                key={task.id}
                                task={task}
                                onSelect={() => onTaskSelect(task)}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-10">
                        <p className="text-slate-600 dark:text-slate-400 transition-colors duration-300">{t('operatorDetails.noTasks')}</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default OperatorDetailSidebar;