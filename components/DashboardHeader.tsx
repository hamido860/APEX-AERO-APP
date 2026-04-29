import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { MasterTask, TaskStatus } from '../types';
import { FilterDropdown } from './FilterDropdown';

interface FiltersState {
    program: string[];
    subProgram: string[];
    operator: string[];
    showCriticalOnly: boolean;
    [key: string]: any;
}

interface DashboardHeaderProps {
    pageTitle: string;
    currentView: string;
    columnVisibility?: { [key:string]: boolean };
    columnConfig?: { id: string, key: string }[];
    isColumnMenuOpen: boolean;
    onSetIsColumnMenuOpen: (isOpen: boolean) => void;
    onColumnToggle: (id: string) => void;
    // Filter props
    masterTasks?: MasterTask[];
    allOperators?: string[];
    filters?: FiltersState;
    onFilterChange?: (filterType: keyof FiltersState, value: string | boolean) => void;
    onClearFilters?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onFitWeek?: () => void;
    onOpenScheduleInfo?: () => void;
    onManualSave?: () => void;
    dashboardMetrics?: {
        plannedCount: number;
        unplannedCount: number;
        totalHours: number;
        overallProgress: number;
        overdueCount: number;
    };
    orderLogFilters?: {
        programs: string[];
        statuses: TaskStatus[];
        assignedTo: string[];
        planningStatus: 'all' | 'planned' | 'unplanned';
    };
    onOrderLogFilterChange?: (filterType: string, value: any) => void;
    onClearOrderLogFilters?: () => void;
    taskDatabaseControls?: {
        searchTerm: string;
        onSearchChange: (term: string) => void;
        onUploadClick: () => void;
        onAddClick: () => void;
    };
    userLogControls?: {
        metrics: {
            teamVersatilityScore: string;
            totalCompletions: number;
            masterRankCount: number;
            mostVersatileOperator: string;
        };
        areChangesUnsaved: boolean;
        onDiscard: () => void;
        onSave: () => void;
        onAddTask: () => void;
        onSettings: () => void;
    };
}

// New Icon Components - Lucide Style
const ColumnsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg> );
const PrintIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg> );
const SaveIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> );
const CalendarIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> );
const WeekIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg> );
const LanguageIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> );
const SunIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> );
const MoonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> );
const InfoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> );
const TeamIcon = () => <svg className="h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962A3.375 3.375 0 0110.5 12h3a3.375 3.375 0 013.369 3.369m-3.375 0a3.375 3.375 0 01-3.375 0M12.75 21a3.375 3.375 0 01-3.375 0M3.75 18.72a9.094 9.094 0 013.741-.479 3 3 0 01-4.682-2.72m-7.5-2.962A3.375 3.375 0 003 12h3a3.375 3.375 0 003.369 3.369m-3.375 0a3.375 3.375 0 00-3.375 0m12.75 5.25v-3.75a3.375 3.375 0 00-3.375-3.375h-3.75a3.375 3.375 0 00-3.375 3.375v3.75" /></svg>;
const CheckBadgeIcon = () => <svg className="h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StarIcon = () => <svg className="h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
const CrownIcon = () => <svg className="h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.79-.44 1.06l-1.5 1.5c-.27.27-.44.646-.44 1.06v4.5M14.25 9.75c0 .414.168.79.44 1.06l1.5 1.5c.27.27.44.646.44 1.06v4.5" /></svg>;

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
    return weekNo;
}

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; colorClass: string }> = ({ icon, title, value, colorClass }) => (
    <div className="flex flex-col border-l border-slate-800/50 pl-6 first:border-l-0 first:pl-0">
        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-[0.15em] mb-0.5">{title}</span>
        <div className="flex items-baseline gap-2">
            <span className={`text-lg font-bold tracking-tight ${colorClass}`}>{value}</span>
            <div className="opacity-30">{icon}</div>
        </div>
    </div>
);

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
    pageTitle,
    currentView,
    columnVisibility,
    columnConfig,
    isColumnMenuOpen,
    onSetIsColumnMenuOpen,
    onColumnToggle,
    masterTasks = [],
    allOperators = [],
    filters,
    onFilterChange,
    onClearFilters,
    onZoomIn,
    onZoomOut,
    onFitWeek,
    onOpenScheduleInfo,
    onManualSave,
    dashboardMetrics,
    orderLogFilters,
    onOrderLogFilterChange,
    onClearOrderLogFilters,
    taskDatabaseControls,
    userLogControls,
}) => {
    const { language, setLanguage, t, getTaskStatusName } = useLocalization();
    const { theme, toggleTheme } = useTheme();
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [weekNumber, setWeekNumber] = useState(0);

    const canToggleColumns = ['gantt', 'orderlog', 'taskdatabase'].includes(currentView);

    const uniquePrograms = useMemo(() => Array.from(new Set(masterTasks.map(mt => mt.program))), [masterTasks]);
    const uniqueSubPrograms = useMemo(() => {
        if (!filters) return [];
        const relevantSubPrograms = masterTasks
            .filter(mt => filters.program.length === 0 || filters.program.includes(mt.program))
            .map(mt => mt.subProgram);
        return Array.from(new Set(relevantSubPrograms));
    }, [masterTasks, filters?.program]);

    const hasActiveFilters = filters && (filters.program.length > 0 || filters.subProgram.length > 0 || filters.operator.length > 0 || filters.showCriticalOnly);

    useEffect(() => {
        const today = new Date();
        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(today.toLocaleDateString(language, dateOptions));
        setWeekNumber(getWeekNumber(today));
    }, [language]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (isColumnMenuOpen && columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
            onSetIsColumnMenuOpen(false);
          }
          if (isLangMenuOpen && langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
            setIsLangMenuOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isColumnMenuOpen, onSetIsColumnMenuOpen, isLangMenuOpen]);

    return (
        <header className="bg-white dark:bg-slate-900 px-8 py-3 border-b border-slate-200 dark:border-slate-800/50 flex-shrink-0 flex justify-between items-center gap-6 z-30 transition-colors duration-300">
            <div className="flex items-center gap-8">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-cyan-500 uppercase tracking-[0.25em] mb-0.5">Apex Aero Systems</span>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase leading-none">{pageTitle}</h1>
                 </div>
                 
                 {currentView === 'gantt' && filters && onFilterChange && onClearFilters && (
                    <div className="flex items-center gap-4 ml-4 border-l border-slate-200 dark:border-slate-800/50 pl-8">
                        <FilterDropdown label={t('ganttFilters.program')} options={uniquePrograms} selected={filters.program} onToggle={(option) => onFilterChange('program', option)} />
                        <FilterDropdown label={t('ganttFilters.subProgram')} options={uniqueSubPrograms} selected={filters.subProgram} onToggle={(option) => onFilterChange('subProgram', option)} />
                        <FilterDropdown label={t('ganttFilters.operator')} options={allOperators} selected={filters.operator || []} onToggle={(option) => onFilterChange('operator', option)} />
                        
                        <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-full px-3 py-1 border border-slate-200 dark:border-slate-800/50 transition-colors">
                            <button onClick={onZoomOut} className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300" title="Zoom Out">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            </button>
                            <div className="w-px h-3 bg-slate-200 dark:bg-slate-800 mx-2"></div>
                            <button onClick={onFitWeek} className="text-[9px] font-bold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-300 uppercase tracking-widest" title="Fit one week to screen">
                                FIT
                            </button>
                            <div className="w-px h-3 bg-slate-200 dark:bg-slate-800 mx-2"></div>
                            <button onClick={onZoomIn} className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-300" title="Zoom In">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                 )}
 
                 {currentView === 'dashboard' && dashboardMetrics && (
                    <div className="flex items-center gap-0 ml-4 border-l border-slate-200 dark:border-slate-800/50 pl-8">
                        <MetricCard title={t('dashboard.metrics.planned')} value={dashboardMetrics.plannedCount} colorClass="text-blue-600 dark:text-blue-400" icon={<div className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />} />
                        <MetricCard title={t('dashboard.metrics.unplanned')} value={dashboardMetrics.unplannedCount} colorClass="text-amber-600 dark:text-amber-400" icon={<div className="w-1 h-1 rounded-full bg-amber-600 dark:bg-amber-400" />} />
                        <MetricCard title={t('dashboard.metrics.hours')} value={dashboardMetrics.totalHours} colorClass="text-emerald-600 dark:text-emerald-400" icon={<div className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />} />
                        <MetricCard title={t('dashboard.metrics.progress')} value={`${dashboardMetrics.overallProgress}%`} colorClass="text-purple-600 dark:text-purple-400" icon={<div className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400" />} />
                        <MetricCard title={t('dashboard.metrics.overdue')} value={dashboardMetrics.overdueCount} colorClass={dashboardMetrics.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'} icon={<div className={`w-1 h-1 rounded-full transition-colors duration-300 ${dashboardMetrics.overdueCount > 0 ? 'bg-red-600 dark:bg-red-400' : 'bg-slate-600 dark:bg-slate-400'}`} />} />
                    </div>
                 )}

                 {currentView === 'orderlog' && orderLogFilters && onOrderLogFilterChange && onClearOrderLogFilters && (
                    <div className="flex items-center gap-3 ml-4 border-l border-slate-700 pl-4">
                        <FilterDropdown 
                            label={t('orderlog.filters.program')} 
                            options={uniquePrograms} 
                            selected={orderLogFilters.programs} 
                            onToggle={(option) => {
                                const list = orderLogFilters.programs;
                                const newList = list.includes(option) ? list.filter(v => v !== option) : [...list, option];
                                onOrderLogFilterChange('programs', newList);
                            }} 
                        />
                        <FilterDropdown 
                            label={t('orderlog.filters.status')} 
                            options={Object.values(TaskStatus)} 
                            selected={orderLogFilters.statuses} 
                            onToggle={(option) => {
                                const list = orderLogFilters.statuses;
                                const newList = list.includes(option as TaskStatus) ? list.filter(v => v !== option) : [...list, option];
                                onOrderLogFilterChange('statuses', newList);
                            }}
                            getLabel={(val) => getTaskStatusName(val as TaskStatus)}
                        />
                        <FilterDropdown 
                            label={t('orderlog.filters.assignedTo')} 
                            options={allOperators} 
                            selected={orderLogFilters.assignedTo} 
                            onToggle={(option) => {
                                const list = orderLogFilters.assignedTo;
                                const newList = list.includes(option) ? list.filter(v => v !== option) : [...list, option];
                                onOrderLogFilterChange('assignedTo', newList);
                            }} 
                        />
                        <div className="flex items-center bg-slate-900/50 rounded-lg p-1 border border-slate-700/80">
                            {(['all', 'planned', 'unplanned'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => onOrderLogFilterChange('planningStatus', status)}
                                    className={`capitalize px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                        orderLogFilters.planningStatus === status
                                            ? 'bg-cyan-600 text-white shadow-lg'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {t(`orderlog.filters.${status}`)}
                                </button>
                            ))}
                        </div>
                        {(orderLogFilters.programs.length > 0 || orderLogFilters.statuses.length > 0 || orderLogFilters.assignedTo.length > 0 || orderLogFilters.planningStatus !== 'all') && (
                            <button onClick={onClearOrderLogFilters} className="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors ml-1">{t('actions.clearFilters')}</button>
                        )}
                    </div>
                 )}

                  {currentView === 'taskdatabase' && taskDatabaseControls && (
                    <div className="flex items-center gap-3 ml-4 border-l border-slate-700 pl-4">
                        <div className="relative">
                            <input
                                type="search"
                                placeholder={t('taskdatabase.searchPlaceholder')}
                                value={taskDatabaseControls.searchTerm}
                                onChange={(e) => taskDatabaseControls.onSearchChange(e.target.value)}
                                className="w-64 bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <button onClick={taskDatabaseControls.onAddClick} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            {t('taskdatabase.add.button')}
                        </button>
                        <button onClick={taskDatabaseControls.onUploadClick} className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-600 active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5z" /><path d="M9 13h2v5a1 1 0 11-2 0v-5z" /></svg>
                            {t('taskdatabase.upload.button')}
                        </button>
                    </div>
                 )}

                 {currentView === 'userlog' && userLogControls && (
                    <div className="flex items-center gap-4 ml-4 border-l border-slate-700 pl-4">
                        <div className="flex items-center gap-6 mr-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-300">{t('userlog.metrics.teamVersatility')}</span>
                                <span className="text-base font-bold text-cyan-400 leading-none">{userLogControls.metrics.teamVersatilityScore}%</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-300">{t('userlog.metrics.totalCompletions')}</span>
                                <span className="text-base font-bold text-cyan-400 leading-none">{userLogControls.metrics.totalCompletions}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-300">{t('userlog.metrics.masterOperators')}</span>
                                <span className="text-base font-bold text-cyan-400 leading-none">{userLogControls.metrics.masterRankCount}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 transition-colors duration-300">{t('userlog.metrics.mostVersatile')}</span>
                                <span className="text-base font-bold text-cyan-400 leading-none">{userLogControls.metrics.mostVersatileOperator}</span>
                            </div>
                        </div>
                        {userLogControls.areChangesUnsaved && (
                            <div className="flex items-center gap-2 animate-pulse bg-yellow-900/20 px-2 py-1 rounded-lg border border-yellow-700/50">
                                <span className="text-xs font-semibold text-yellow-400">{t('userlog.unsavedChanges')}</span>
                                <button onClick={userLogControls.onDiscard} className="px-2 py-1 text-xs font-bold rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white transition-colors">{t('actions.discard')}</button>
                                <button onClick={userLogControls.onSave} className="px-2 py-1 text-xs font-bold rounded-md bg-green-600 hover:bg-green-500 text-white transition-colors shadow-lg shadow-green-900/20">{t('actions.saveChanges')}</button>
                            </div>
                        )}
                        <button onClick={userLogControls.onSettings} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white transition-all border border-slate-200 dark:border-slate-600 active:scale-95">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                            {t('userlog.actions.settings')}
                        </button>
                        <button onClick={userLogControls.onAddTask} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-lg shadow-cyan-900/20 active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            {t('userlog.actions.addTask')}
                        </button>
                    </div>
                 )}

                 {canToggleColumns && columnVisibility && columnConfig && (
                   <div className="relative" ref={columnMenuRef}>
                       <button
                           onClick={() => onSetIsColumnMenuOpen(!isColumnMenuOpen)}
                           className="p-2 rounded-lg text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"
                           title={t('header.toggleColumns')}
                       >
                           <ColumnsIcon />
                       </button>
                       {isColumnMenuOpen && (
                           <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl p-2 z-50">
                               <p className="text-sm font-semibold text-slate-300 px-2 py-1 mb-1">{t('header.toggleColumns')}</p>
                               {columnConfig.map(col => (
                                   <label key={col.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer">
                                       <input
                                           type="checkbox"
                                           className="h-4 w-4 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500 transition"
                                           checked={!!columnVisibility[col.id]}
                                           onChange={() => onColumnToggle(col.id)}
                                       />
                                       <span className="text-sm text-slate-200">{t(col.key)}</span>
                                   </label>
                               ))}
                           </div>
                       )}
                   </div>
               )}
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="hidden sm:flex items-center gap-4 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 px-4 py-1.5 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                        <CalendarIcon />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{currentDate}</span>
                    </div>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-2">
                        <WeekIcon />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('header.week', weekNumber)}</span>
                    </div>
                </div>
                 <div className="relative" ref={langMenuRef}>
                    <button
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                        className="p-2 rounded-lg text-[#04274e] dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        title={t('language')}
                    >
                         <LanguageIcon />
                    </button>
                    {isLangMenuOpen && (
                         <div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 z-50">
                             <button onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${language === 'en' ? 'bg-cyan-500 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>{t('english')}</button>
                             <button onClick={() => { setLanguage('fr'); setIsLangMenuOpen(false); }} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${language === 'fr' ? 'bg-cyan-500 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>{t('french')}</button>
                         </div>
                    )}
                </div>
                 <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-[#04274e] dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                     {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                 <button
                    onClick={onOpenScheduleInfo}
                    className="p-2 rounded-lg text-[#04274e] dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    title={t('header.scheduleInfo') || 'Schedule Info'}
                >
                     <InfoIcon />
                </button>
                <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg text-[#04274e] dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    title={t('header.printSchedule')}
                >
                     <PrintIcon />
                </button>
                <button
                    onClick={onManualSave}
                    className="p-2 rounded-lg text-[#04274e] dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                    title={t('actions.save')}
                >
                     <SaveIcon />
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;