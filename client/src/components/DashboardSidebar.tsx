

import React, { useMemo, useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { WORK_DAY_HOURS } from '@/constants';
import { useLocalization } from '@/contexts/LocalizationContext';

interface FiltersState {
  status: TaskStatus[];
  operator: string[];
  showOverdueOnly: boolean;
}

interface DashboardSidebarProps {
  tasks: Task[];
  filters: FiltersState;
  onFilterChange: (filterType: keyof FiltersState, value: string | boolean) => void;
  onClearFilters: () => void;
  allOperators: string[];
  allStatuses: TaskStatus[];
  onClose: () => void;
  isPage?: boolean;
}

const isTaskOverdue = (task: Task) => {
    if (task.day === -1) return false;
    const endTotalHour = (task.day * WORK_DAY_HOURS) + task.startHour + task.duration;
    const dueTotalHour = (task.dueDay * WORK_DAY_HOURS) + task.dueHour + 1; // Due by end of hour
    return endTotalHour > dueTotalHour && task.status !== TaskStatus.Completed && task.status !== TaskStatus.QualityOK;
};

const MetricItem: React.FC<{ label: string, value: string | number, color: string }> = ({ label, value, color }) => (
    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800/50">
        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-[0.1em] mb-1 transition-colors duration-300">{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
);

const FilterCheckbox: React.FC<{ label: string, isChecked: boolean, onChange: () => void }> = ({ label, isChecked, onChange }) => (
    <label className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
        <input
            type="checkbox"
            className="h-4 w-4 rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500 transition"
            checked={isChecked}
            onChange={onChange}
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
    </label>
);


const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ tasks, filters, onFilterChange, onClearFilters, allOperators, allStatuses, onClose, isPage = false }) => {
    const { t, getTaskStatusName } = useLocalization();
    const [operatorSearch, setOperatorSearch] = useState('');

    const metrics = useMemo(() => {
        const plannedTasks = tasks.filter(t => t.day !== -1);
        const unplannedCount = tasks.length - plannedTasks.length;
        const totalHours = plannedTasks.reduce((sum, task) => sum + task.duration, 0);
        const totalWeightedProgress = plannedTasks.reduce((sum, task) => sum + (task.progress * task.duration), 0);
        const overallProgress = totalHours > 0 ? Math.round(totalWeightedProgress / totalHours) : 0;
        const overdueCount = plannedTasks.filter(isTaskOverdue).length;

        return { 
            plannedCount: plannedTasks.length,
            unplannedCount, 
            totalHours,
            overallProgress,
            overdueCount
        };
    }, [tasks]);
    
    const hasActiveFilters = useMemo(() => {
        return filters.status.length > 0 || filters.operator.length > 0 || filters.showOverdueOnly;
    }, [filters]);

    const filteredOperators = useMemo(() => 
        allOperators.filter(op => op.toLowerCase().includes(operatorSearch.toLowerCase()))
    , [allOperators, operatorSearch]);

    return (
        <div className={isPage ? "h-full flex flex-col" : "bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800/50 h-full flex flex-col shadow-2xl transition-colors duration-300"}>
            {!isPage && (
                <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-500 uppercase tracking-[0.2em]">{t('dashboard.title')}</span>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase">{t('dashboard.subtitle')}</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        aria-label={t('actions.close')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
            )}

            <div className={`flex-grow overflow-y-auto custom-scrollbar ${!isPage ? 'px-6 py-6' : ''} space-y-8`}>
                {/* Metrics Section */}
                {!isPage && (
                    <section>
                        <div className="grid grid-cols-2 border-t border-l border-slate-200 dark:border-slate-800/50">
                            <MetricItem label={t('dashboard.metrics.planned')} value={metrics.plannedCount} color="text-blue-600 dark:text-blue-400" />
                            <MetricItem label={t('dashboard.metrics.unplanned')} value={metrics.unplannedCount} color="text-amber-600 dark:text-amber-400" />
                            <MetricItem label={t('dashboard.metrics.hours')} value={metrics.totalHours} color="text-emerald-600 dark:text-emerald-400" />
                            <MetricItem label={t('dashboard.metrics.progress')} value={`${metrics.overallProgress}%`} color="text-purple-600 dark:text-purple-400" />
                            <div className="col-span-2">
                                <MetricItem label={t('dashboard.metrics.overdue')} value={metrics.overdueCount} color={metrics.overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-500"} />
                            </div>
                        </div>
                    </section>
                )}
                {/* Filters Section */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">{t('dashboard.filters.title')}</h3>
                        {hasActiveFilters && (
                            <button
                                onClick={onClearFilters}
                                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            >
                                {t('actions.clearAll')}
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Overdue Toggle */}
                        <label className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-900 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{t('dashboard.filters.showOverdueOnly')}</span>
                             <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={filters.showOverdueOnly}
                                    onChange={(e) => onFilterChange('showOverdueOnly', e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${filters.showOverdueOnly ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${filters.showOverdueOnly ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </label>

                        {/* Status Filter */}
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2 px-1">{t('dashboard.filters.byStatus')}</h4>
                            <div className="space-y-1">
                                {allStatuses.map(status => (
                                    <FilterCheckbox
                                        key={status}
                                        label={getTaskStatusName(status)}
                                        isChecked={filters.status.includes(status)}
                                        onChange={() => onFilterChange('status', status)}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        {/* Operator Filter */}
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-2 px-1">{t('dashboard.filters.byOperator')}</h4>
                             <div className="relative mb-2">
                                <input
                                type="search"
                                placeholder={t('dashboard.filters.searchOperators')}
                                value={operatorSearch}
                                onChange={(e) => setOperatorSearch(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                {filteredOperators.map(op => (
                                    <FilterCheckbox
                                        key={op}
                                        label={op}
                                        isChecked={filters.operator.includes(op)}
                                        onChange={() => onFilterChange('operator', op)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DashboardSidebar;