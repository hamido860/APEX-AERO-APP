
import React, { useMemo } from 'react';
import { Task, TaskStatus, MasterTask } from '../types';
import { 
    PieChart, Pie, Cell, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { AlertCircle, CheckCircle2, Clock, BarChart3, Users, Layout, FilterX } from 'lucide-react';
import { useLocalization } from '../contexts/LocalizationContext';
import { WORK_DAY_HOURS } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardPageProps {
    tasks: Task[];
    masterTasks: MasterTask[];
    allOperators: string[];
    filters: {
        status: TaskStatus[];
        operator: string[];
        showOverdueOnly: boolean;
    };
    onFilterChange: (filterType: string, value: any) => void;
    onClearFilters: () => void;
}

const STATUS_COLORS = {
    [TaskStatus.ToDo]: '#64748b', // slate-500
    [TaskStatus.InProgress]: '#3b82f6', // blue-500
    [TaskStatus.Completed]: '#10b981', // emerald-500
    [TaskStatus.OnHold]: '#f59e0b', // amber-500
    [TaskStatus.QualityOK]: '#8b5cf6', // violet-500
};

const isTaskOverdue = (task: Task) => {
    if (task.day === -1) return false;
    const endTotalHour = (task.day * WORK_DAY_HOURS) + task.startHour + task.duration;
    const dueTotalHour = (task.dueDay * WORK_DAY_HOURS) + task.dueHour + 1;
    return endTotalHour > dueTotalHour && task.status !== TaskStatus.Completed && task.status !== TaskStatus.QualityOK;
};

const DashboardPage: React.FC<DashboardPageProps> = ({ 
    tasks, 
    masterTasks, 
    allOperators, 
    filters, 
    onFilterChange, 
    onClearFilters 
}) => {
    const { t, getTaskStatusName } = useLocalization();
    const { theme } = useTheme();

    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (filters.showOverdueOnly && !isTaskOverdue(t)) return false;
            if (filters.status.length > 0 && !filters.status.includes(t.status)) return false;
            if (filters.operator.length > 0 && !filters.operator.includes(t.assignedTo)) return false;
            return true;
        });
    }, [tasks, filters]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        Object.values(TaskStatus).forEach(s => counts[s] = 0);
        filteredTasks.forEach(t => counts[t.status]++);
        
        return Object.entries(counts)
            .filter(([_, count]) => count > 0)
            .map(([status, count]) => ({
                name: getTaskStatusName(status as TaskStatus),
                value: count,
                status: status as TaskStatus
            }));
    }, [filteredTasks, getTaskStatusName]);

    const operatorWorkloadData = useMemo(() => {
        const data: Record<string, { name: string, hours: number, tasks: number }> = {};
        allOperators.forEach(op => data[op] = { name: op, hours: 0, tasks: 0 });
        
        filteredTasks.forEach(t => {
            if (t.assignedTo && data[t.assignedTo]) {
                data[t.assignedTo].hours += t.duration;
                data[t.assignedTo].tasks++;
            }
        });

        return Object.values(data).filter(d => d.tasks > 0).sort((a, b) => b.hours - a.hours);
    }, [filteredTasks, allOperators]);

    const programData = useMemo(() => {
        const data: Record<string, { name: string, completed: number, total: number }> = {};
        
        filteredTasks.forEach(t => {
            const master = masterTasks.find(mt => mt.name === t.name);
            const program = master?.program || 'Unknown';
            
            if (!data[program]) data[program] = { name: program, completed: 0, total: 0 };
            data[program].total++;
            if (t.status === TaskStatus.Completed || t.status === TaskStatus.QualityOK) {
                data[program].completed++;
            }
        });

        return Object.values(data).map(d => ({
            ...d,
            progress: Math.round((d.completed / d.total) * 100)
        })).sort((a, b) => b.total - a.total);
    }, [filteredTasks, masterTasks]);

    const overdueTasks = useMemo(() => {
        return filteredTasks
            .filter(isTaskOverdue)
            .sort((a, b) => (a.dueDay * 9 + a.dueHour) - (b.dueDay * 9 + b.dueHour))
            .slice(0, 5);
    }, [filteredTasks]);

    return (
        <div className="flex h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
            {/* Sidebar Filters */}
            <aside className="w-72 border-r border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950/50 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layout className="w-3 h-3" />
                            {t('dashboard.filters.title')}
                        </h3>
                        {(filters.status.length > 0 || filters.operator.length > 0 || filters.showOverdueOnly) && (
                            <button 
                                onClick={onClearFilters}
                                className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                            >
                                <FilterX className="w-3 h-3" />
                                {t('actions.clearAll')}
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Overdue Toggle */}
                        <button 
                            onClick={() => onFilterChange('showOverdueOnly', !filters.showOverdueOnly)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                filters.showOverdueOnly 
                                ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300'
                            }`}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.filters.showOverdueOnly')}</span>
                            <AlertCircle className={`w-4 h-4 ${filters.showOverdueOnly ? 'animate-pulse' : ''}`} />
                        </button>

                        {/* Status Filter */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">{t('dashboard.filters.byStatus')}</h4>
                            <div className="grid grid-cols-1 gap-1">
                                {Object.values(TaskStatus).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => onFilterChange('status', status)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                            filters.status.includes(status)
                                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-300 border border-transparent transition-colors duration-300'
                                        }`}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }}></div>
                                        {getTaskStatusName(status)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Operator Filter */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">{t('dashboard.filters.byOperator')}</h4>
                            <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {allOperators.map(op => (
                                    <button
                                        key={op}
                                        onClick={() => onFilterChange('operator', op)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                            filters.operator.includes(op)
                                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-300 border border-transparent transition-colors duration-300'
                                        }`}
                                    >
                                        <Users className="w-3 h-3" />
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-white dark:bg-slate-900 transition-colors duration-300">
                {/* Top Metrics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6 relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 className="w-12 h-12 text-slate-500 dark:text-slate-400 transition-colors duration-300" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors duration-300">{t('dashboard.metrics.planned')}</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{filteredTasks.filter(t => t.day !== -1).length}</p>
                        <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '75%' }}></div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6 relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="w-12 h-12 text-slate-500 dark:text-slate-400 transition-colors duration-300" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors duration-300">{t('dashboard.metrics.hours')}</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{filteredTasks.reduce((s, t) => s + (t.day !== -1 ? t.duration : 0), 0)}h</p>
                        <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: '60%' }}></div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6 relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 className="w-12 h-12 text-slate-500 dark:text-slate-400 transition-colors duration-300" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors duration-300">{t('dashboard.metrics.progress')}</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {filteredTasks.length > 0 ? Math.round(filteredTasks.reduce((s, t) => s + t.progress, 0) / filteredTasks.length) : 0}%
                        </p>
                        <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: '45%' }}></div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6 relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertCircle className="w-12 h-12 text-slate-500 dark:text-slate-400 transition-colors duration-300" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1 transition-colors duration-300">{t('dashboard.metrics.overdue')}</p>
                        <p className={`text-3xl font-bold tracking-tight ${filteredTasks.filter(isTaskOverdue).length > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                            {filteredTasks.filter(isTaskOverdue).length}
                        </p>
                        <div className="mt-4 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${filteredTasks.filter(isTaskOverdue).length > 0 ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`} style={{ width: '20%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Status Distribution */}
                    <div className="bg-slate-50 dark:bg-[#0b1745] border border-slate-200 dark:border-slate-800/50 rounded-3xl p-8 transition-colors">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3 transition-colors duration-300">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            {t('dashboard.charts.statusDistribution')}
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                                            border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                                            borderRadius: '12px' 
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a', fontSize: '12px' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value: string) => (
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Operator Workload */}
                    <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-8 transition-colors">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3 transition-colors duration-300">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {t('dashboard.charts.operatorWorkload')} (Hours)
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={operatorWorkloadData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} horizontal={false} />
                                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                                            border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                                            borderRadius: '12px' 
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a', fontSize: '12px' }}
                                        cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                                    />
                                    <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value: string) => (
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">
                                                {value}
                                            </span>
                                        )}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Program Progress */}
                    <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-8 transition-colors">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3 transition-colors duration-300">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            {t('dashboard.charts.programProgress')} (%)
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={programData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#cbd5e1'} vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                                            border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                                            borderRadius: '12px' 
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a', fontSize: '12px' }}
                                        cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
                                    />
                                    <Bar dataKey="progress" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value: string) => (
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">
                                                {value}
                                            </span>
                                        )}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Urgent Tasks */}
                    <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/50 rounded-3xl p-8 transition-colors">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3 transition-colors duration-300">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {t('dashboard.urgentTasks')}
                        </h3>
                        <div className="space-y-4">
                            {overdueTasks.length > 0 ? overdueTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-red-500/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{task.name}</p>
                                            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider transition-colors duration-300">{task.orderId} • {task.assignedTo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-red-500 uppercase">{t('dashboard.overdueLabel')}</p>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold transition-colors duration-300">{t('dashboard.day')} {task.dueDay} • {t('dashboard.hour')} {task.dueHour}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 transition-colors duration-300">
                                    <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">{t('dashboard.noUrgentTasks')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
