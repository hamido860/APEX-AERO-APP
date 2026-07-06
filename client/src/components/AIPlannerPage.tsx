import React, { useState, useMemo, useEffect } from 'react';
import { Task, MasterTask, TaskStatus, Rank, getRank, RankSettings } from '@/types';
import { WORK_DAY_HOURS, RANK_THEME } from '@/constants';
import { useLocalization } from '@/contexts/LocalizationContext';
import { GoogleGenAI, Type } from "@google/genai";

interface AIPlannerPageProps {
  onUpdateTasks: (tasks: Task[]) => void;
  allTasks: Task[];
  allOperators: string[];
  masterTasks: MasterTask[];
  rankSettings: RankSettings;
}

interface AIPlanItem {
    taskId: number;
    assignedTo: string;
    justification: string;
    taskName: string;
    orderId: string;
    proficiency: Rank;
}

const AILoadingState: React.FC<{ messages: string[], title: string }> = ({ messages, title }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500);
        return () => clearInterval(intervalId);
    }, [messages.length]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-cyan-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-white mt-6">{title}</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 transition-opacity duration-500">{messages[messageIndex]}</p>
        </div>
    );
};


const AIPlannerPage: React.FC<AIPlannerPageProps> = ({ onUpdateTasks, allTasks, allOperators, masterTasks, rankSettings }) => {
  const { t, getRankName } = useLocalization();
  const [isLoading, setIsLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<AIPlanItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unplannedTasks = useMemo(() => {
    return allTasks.filter(t => t.day === -1 && t.status !== TaskStatus.Completed && t.status !== TaskStatus.QualityOK && t.status !== TaskStatus.OnHold);
  }, [allTasks]);

  const handleRunPlanner = async () => {
    setIsLoading(true);
    setError(null);
    setAiPlan(null);

    try {
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

        const operatorWorkloads = allOperators.map(op => ({
            name: op,
            currentWorkloadHours: allTasks
                .filter(t => t.assignedTo === op && t.day !== -1)
                .reduce((sum, task) => sum + task.duration, 0)
        }));

        const proficiencyData = allTasks.reduce((acc, task) => {
            if (task.assignedTo && (task.status === TaskStatus.Completed || task.status === TaskStatus.QualityOK)) {
                const key = `${task.assignedTo}::${task.name}`;
                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const proficiencyList = Object.entries(proficiencyData).map(([key, completions]) => {
            const [operator, taskName] = key.split('::');
            return { operator, taskName, completions };
        });

        const tasksForAI = unplannedTasks.map(t => ({
            taskId: t.id,
            name: t.name,
            duration: t.duration,
            dueDay: t.dueDay,
        }));

        const promptData = {
            unplannedTasks: tasksForAI,
            operators: operatorWorkloads,
            proficiency: proficiencyList
        };

        const schema = {
            type: Type.OBJECT,
            properties: {
                assignments: {
                    type: Type.ARRAY,
                    description: "The proposed task assignments.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            taskId: { type: Type.NUMBER },
                            assignedTo: { type: Type.STRING },
                            justification: { type: Type.STRING }
                        },
                        required: ['taskId', 'assignedTo', 'justification']
                    }
                }
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: JSON.stringify(promptData),
            config: {
                systemInstruction: `You are an expert production scheduler for an aerospace manufacturing facility. Your goal is to create an optimal weekly work plan by assigning all the provided unplanned tasks to available operators. You must assign every task. Prioritize operators with higher proficiency (more completions) for a given task, but also balance the total workload (in hours) across all operators. Provide a brief justification for each assignment in the 'justification' field. The output must be a valid JSON object matching the provided schema, with no additional text.`,
                responseMimeType: "application/json",
                responseSchema: schema
            },
        });
        
        const jsonText = response.text;
        const result = JSON.parse(jsonText || '{}');

        const taskMap = new Map(allTasks.map(t => [t.id, t]));
        const enrichedPlan = (result.assignments || []).map((item: any) => {
            const task = taskMap.get(item.taskId) as Task | undefined;
            const completions = proficiencyData[`${item.assignedTo}::${task?.name || ''}`] || 0;
            return {
                ...item,
                taskName: task?.name || 'Unknown Task',
                orderId: task?.orderId || 'N/A',
                proficiency: getRank(completions, rankSettings)
            };
        });
        setAiPlan(enrichedPlan);

    } catch (e: any) {
        console.error("AI Planner Error:", e);
        setError(e.message || t('aiPlanner.error.message'));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleAcceptPlan = () => {
    if (!aiPlan) return;

    const updatedTasks = [...allTasks];
    const taskMap = new Map(updatedTasks.map(t => [t.id, t]));
    
    const assignmentsByOperator = aiPlan.reduce((acc, planItem) => {
        if (!acc[planItem.assignedTo]) acc[planItem.assignedTo] = [];
        const task = taskMap.get(planItem.taskId);
        if (task) acc[planItem.assignedTo].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    Object.keys(assignmentsByOperator).forEach(operator => {
        const operatorTasks = updatedTasks
            .filter(t => t.assignedTo === operator && t.day !== -1)
            .sort((a, b) => ((a.day * WORK_DAY_HOURS) + a.startHour) - ((b.day * WORK_DAY_HOURS) + b.startHour));

        let nextAvailableTotalHour = 0;
        if (operatorTasks.length > 0) {
            const lastTask = operatorTasks[operatorTasks.length - 1];
            nextAvailableTotalHour = (lastTask.day * WORK_DAY_HOURS) + lastTask.startHour + lastTask.duration;
        }

        for (const taskToPlan of assignmentsByOperator[operator]) {
            let newDay = Math.floor(nextAvailableTotalHour / WORK_DAY_HOURS);
            let newStartHour = nextAvailableTotalHour % WORK_DAY_HOURS;

            if (newStartHour + taskToPlan.duration > WORK_DAY_HOURS) {
                newDay++;
                newStartHour = 0;
            }

            const updatedTask = { ...taskToPlan, day: newDay, startHour: newStartHour, assignedTo: operator, status: TaskStatus.ToDo, notes: null };
            taskMap.set(taskToPlan.id, updatedTask);
            nextAvailableTotalHour = (newDay * WORK_DAY_HOURS) + newStartHour + updatedTask.duration;
        }
    });

    onUpdateTasks(Array.from(taskMap.values()));
    setAiPlan(null);
    setError(null);
  };

  const handleRejectPlan = () => {
    setAiPlan(null);
    setError(null);
  };

  const renderContent = () => {
    if (isLoading) {
        return <AILoadingState title={t('aiPlanner.loading.title')} messages={t('aiPlanner.loading.messages') as unknown as string[]} />;
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg max-w-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('aiPlanner.error.title')}</h3>
                    <p className="text-sm text-center">{t('aiPlanner.error.apiError', error)}</p>
                    <button onClick={handleRunPlanner} className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold">
                        {t('actions.retry')}
                    </button>
                </div>
            </div>
        );
    }
    if (aiPlan) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-end mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('aiPlanner.results.title')}</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-300">{t('aiPlanner.results.description')}</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleRejectPlan} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg transition-colors font-semibold">
                            {t('aiPlanner.results.reject')}
                        </button>
                        <button onClick={handleAcceptPlan} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-green-900/20">
                            {t('aiPlanner.results.accept')}
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-auto border border-slate-700 rounded-lg">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="sticky top-0 bg-slate-800 shadow-md">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('aiPlanner.results.table.task')}</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('aiPlanner.results.table.orderId')}</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('aiPlanner.results.table.operator')}</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('aiPlanner.results.table.proficiency')}</th>
                                <th className="p-3 font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('aiPlanner.results.table.justification')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900/50 transition-colors duration-300">
                            {aiPlan.map((item, index) => (
                                <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/40">
                                    <td className="p-3 font-medium text-white">{item.taskName}</td>
                                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400 transition-colors duration-300">{item.orderId}</td>
                                    <td className="p-3 text-cyan-300 font-semibold">{item.assignedTo}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${RANK_THEME[item.proficiency].bg}`}></div>
                                            <span>{getRankName(item.proficiency)}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 max-w-md transition-colors duration-300">{item.justification}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            {unplannedTasks.length > 0 ? (
                <>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-full mb-6 ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xl transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('aiPlanner.title')}</h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg mb-8 text-lg transition-colors duration-300">{t('aiPlanner.description')}</p>
                    <div className="bg-slate-800 p-4 rounded-lg mb-8 border border-slate-700">
                        <span className="text-slate-300 font-medium">{t('aiPlanner.unplannedTasksTitle', unplannedTasks.length)}</span>
                    </div>
                    <button 
                        onClick={handleRunPlanner}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-lg font-bold shadow-xl shadow-cyan-900/20 transition-all transform hover:scale-105"
                    >
                        {t('aiPlanner.runButton')}
                    </button>
                </>
            ) : (
                <div className="text-slate-500">
                    <p className="text-xl font-medium">{t('aiPlanner.noTasks')}</p>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="w-full h-full bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col">
      {renderContent()}
    </div>
  );
};

export default AIPlannerPage;