

import React, { useMemo, useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { TASK_STATUS_COLORS, WORK_HOURS } from '@/constants';
import { useLocalization } from '@/contexts/LocalizationContext';
import DependencyManagerModal from './DependencyManagerModal';

interface TaskDetailSidebarProps {
  task: Task;
  allTasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
  onClose: () => void;
  onBackToOperator?: () => void;
  operatorContext?: string | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex flex-col">
        <dt className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors duration-300">
            {icon}
            {label}
        </dt>
        <dd className="mt-1 text-md font-semibold text-slate-900 dark:text-slate-100 break-words transition-colors duration-300">{value}</dd>
    </div>
);


const TaskDetailSidebar: React.FC<TaskDetailSidebarProps> = ({ task, allTasks, onUpdateTasks, onClose, onBackToOperator, operatorContext }) => {
    const { t, getDaysOfWeek, getTaskStatusName } = useLocalization();
    const DAYS_OF_WEEK_SHORT = getDaysOfWeek('short');
    const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);

    const { name, status, description, assignedTo, day, startHour, duration, dueDay, dueHour, progress, notes } = task;

    const getFormattedTime = (hourIndex: number) => {
        const hour = hourIndex + 8; // 8 AM is our base
        if (hourIndex >= WORK_HOURS.length) { // e.g., hourIndex 9 means 5 PM
            const endHour = hourIndex + 8;
            return `${endHour % 12 === 0 ? 12 : endHour % 12}:00 ${endHour >= 12 && endHour < 24 ? 'PM' : 'AM'}`;
        }
        return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 && hour < 24 ? 'PM' : 'AM'}`;
    };

    const workDayHours = WORK_HOURS.length;
    const totalEndAbsoluteHour = (day * workDayHours) + startHour + duration;
    
    let endDayIndex = Math.floor(totalEndAbsoluteHour / workDayHours);
    let endHourOfDay = totalEndAbsoluteHour % workDayHours;

    if (endHourOfDay === 0 && duration > 0) {
      endDayIndex -= 1;
      endHourOfDay = workDayHours;
    }
    
    const endTotalHour = (day * workDayHours) + startHour + duration;
    const dueTotalHour = (dueDay * workDayHours) + dueHour + 1;
    const isOverdue = endTotalHour > dueTotalHour;
    
    const startDate = `${DAYS_OF_WEEK_SHORT[day]}`;
    const startTime = getFormattedTime(startHour);
    const endDate = `${DAYS_OF_WEEK_SHORT[endDayIndex % DAYS_OF_WEEK_SHORT.length]}`;
    const endTime = getFormattedTime(endHourOfDay);

    const dueDateString = `${DAYS_OF_WEEK_SHORT[dueDay]}`;
    const dueTime = getFormattedTime(dueHour + 1);
    
    const statusColor = TASK_STATUS_COLORS[status] || TASK_STATUS_COLORS[TaskStatus.ToDo];

    let progressColor = 'bg-green-500';
    if (progress === 100) {
        progressColor = 'bg-emerald-500'; // Completed
    } else if (isOverdue) {
        progressColor = 'bg-red-500'; // Overdue
    }

    const prerequisites = useMemo(() => {
        const prereqIds = new Set(task.dependencies || []);
        return allTasks.filter(t => prereqIds.has(t.id));
    }, [task.dependencies, allTasks]);

    const dependents = useMemo(() => {
        return allTasks.filter(t => t.dependencies?.includes(task.id));
    }, [task.id, allTasks]);

    const handleSaveDependencies = (updatedTask: Task) => {
        const newTasks = allTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        onUpdateTasks(newTasks);
    };

    const calendarIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;
    const clockIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" /></svg>;
    const warningIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.227 2.348-1.227 2.984 0l6.955 13.442c.636 1.226-.29 2.71-1.492 2.71H2.794c-1.202 0-2.128-1.484-1.492-2.71L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm1-5a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
    const linkIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;

    return (
        <>
        <div className="bg-white dark:bg-slate-800 rounded-2xl h-full flex flex-col p-4 shadow-2xl transition-colors duration-300">
            <header className="flex items-start justify-between pb-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                     {operatorContext && onBackToOperator && (
                        <button
                            onClick={onBackToOperator}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400"
                            aria-label={t('details.backToOperator', operatorContext)}
                            title={t('details.backToOperator', operatorContext)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">{task.orderId}</span>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 transition-colors duration-300">{name}</h2>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:focus-visible:ring-cyan-400"
                    aria-label={t('actions.close')}
                    title={t('actions.close') || 'Close'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <div className="flex-grow overflow-y-auto pt-4 pr-2 -mr-4 space-y-6">
                <dl className="space-y-6">
                    {task.isCritical && (
                        <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg text-center">
                            <span className="text-sm font-bold text-orange-400 uppercase tracking-wider">{t('details.critical')}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                        <DetailItem 
                            label={t('details.status')}
                            value={
                                <span className={`px-3 py-1 text-sm font-bold rounded-full ${statusColor.background} ${statusColor.text}`}>
                                    {getTaskStatusName(status)}
                                </span>
                            }
                        />
                         <DetailItem 
                            label={t('details.progress')}
                            value={
                                <div className="flex items-center gap-2">
                                    <div className="w-full bg-slate-600 rounded-full h-2.5">
                                        <div 
                                            className={`${progressColor} h-2.5 rounded-full transition-colors`}
                                            style={{width: `${progress}%`}}>
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm text-slate-700 dark:text-slate-300 transition-colors duration-300">{progress}%</span>
                                </div>
                            }
                        />
                    </div>
                     <DetailItem 
                        label={t('details.assignedTo')}
                        value={assignedTo || t('unassigned')}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
                    />
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <DetailItem 
                            label={t('details.startDate')} 
                            value={day >= 0 ? startDate : t('na')}
                            icon={calendarIcon}
                        />
                        <DetailItem 
                            label={t('details.endDate')} 
                            value={
                                day >= 0 ?
                                <div className="flex items-baseline gap-2">
                                    <span>{endDate}</span>
                                    <span className={`text-xs font-normal transition-colors duration-300 ${isOverdue && progress < 100 ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                        ({t('details.due')}: {dueDateString})
                                    </span>
                                </div> : t('na')
                            }
                            icon={calendarIcon}
                        />
                         <DetailItem 
                            label={t('details.startTime')}
                            value={day >= 0 ? startTime : t('na')}
                            icon={clockIcon}
                        />
                        <DetailItem 
                            label={t('details.endTime')}
                            value={
                                day >= 0 ?
                                <div className="flex items-baseline gap-2">
                                    <span>{endTime}</span>
                                    <span className={`text-xs font-normal transition-colors duration-300 ${isOverdue && progress < 100 ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                        ({t('details.due')}: {dueTime})
                                    </span>
                                </div> : t('na')
                            }
                            icon={clockIcon}
                        />
                    </div>
                     <DetailItem 
                        label={t('details.duration')}
                        value={t('details.hours', duration)}
                        icon={clockIcon}
                    />

                    {(prerequisites.length > 0 || dependents.length > 0) && (
                        <div className="bg-slate-900/40 border border-slate-700/60 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors duration-300">{linkIcon} {t('details.dependencies')}</h3>
                                <button onClick={() => setIsDependencyModalOpen(true)} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">{t('actions.edit')}</button>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4">
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm mb-2 transition-colors duration-300">{t('details.prerequisites')} ({prerequisites.length})</h4>
                                    <ul className="space-y-1">
                                        {prerequisites.map(p => <li key={p.id} className="text-xs text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-1 rounded truncate transition-colors duration-300">{p.name}</li>)}
                                        {prerequisites.length === 0 && <li className="text-xs text-slate-500">{t('na')}</li>}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-200 text-sm mb-2 transition-colors duration-300">{t('details.dependents')} ({dependents.length})</h4>
                                    <ul className="space-y-1">
                                        {dependents.map(d => <li key={d.id} className="text-xs text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 px-2 py-1 rounded truncate transition-colors duration-300">{d.name}</li>)}
                                        {dependents.length === 0 && <li className="text-xs text-slate-500">{t('na')}</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    

                    {notes && (
                        <div className="bg-yellow-900/40 border border-yellow-700/60 p-3 rounded-lg">
                            <DetailItem
                                label={t('details.notes')}
                                value={<span className="text-yellow-300">{notes}</span>}
                                icon={warningIcon}
                            />
                        </div>
                    )}
                    
                    <div className="pt-2">
                        <dt className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 transition-colors duration-300">{t('details.description')}</dt>
                        <dd className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap transition-colors duration-300">{description}</dd>
                    </div>

                </dl>
            </div>
             {prerequisites.length === 0 && dependents.length === 0 && (
                <div className="flex-shrink-0 pt-4 mt-auto border-t border-slate-700">
                    <button onClick={() => setIsDependencyModalOpen(true)} className="w-full text-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white">
                        {t('actions.manageDependencies')}
                    </button>
                </div>
            )}
        </div>
        <DependencyManagerModal 
            isOpen={isDependencyModalOpen}
            onClose={() => setIsDependencyModalOpen(false)}
            task={task}
            allTasks={allTasks}
            onSave={handleSaveDependencies}
        />
        </>
    );
};

export default TaskDetailSidebar;