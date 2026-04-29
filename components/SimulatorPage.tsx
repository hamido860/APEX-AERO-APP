import React, { useState, useMemo } from 'react';
import { Task, MasterTask, TaskStatus } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from './Toast';

interface SimulatorPageProps {
  onUpdateTasks: (tasks: Task[]) => void;
  allTasks: Task[];
  allOperators: string[];
  masterTasks: MasterTask[];
}

interface GeneratedOrder {
    orderId: string;
    productName: string;
    priority: 'normal' | 'high' | 'rush';
    dueDay: number;
    dueHour: number;
    tasks: {
        taskName: string;
        duration: number;
        dependencies: string[];
        description: string;
        isCritical: boolean;
    }[];
}

const AILoadingState: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="w-16 h-16 text-cyan-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-2xl font-bold text-white mt-6">{title}</h2>
    </div>
);

const SimulatorPage: React.FC<SimulatorPageProps> = ({ onUpdateTasks, allTasks, allOperators, masterTasks }) => {
    const { t } = useLocalization();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [lastGeneratedOrder, setLastGeneratedOrder] = useState<GeneratedOrder | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateOrder = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

            const operatorWorkloads = allOperators.map(op => ({
                name: op,
                currentWorkloadHours: allTasks.filter(t => t.assignedTo === op && t.day !== -1).reduce((sum, task) => sum + task.duration, 0)
            }));

            const taskCompletionCounts = allTasks.reduce((acc, task) => {
                if (task.status === TaskStatus.Completed || task.status === TaskStatus.QualityOK) {
                    acc[task.name] = (acc[task.name] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const promptContext = {
                totalTasks: allTasks.length,
                unplannedTasks: allTasks.filter(t => t.day === -1).length,
                operatorWorkloads,
                masterTaskList: masterTasks.map(mt => mt.name),
                taskCompletionCounts,
                existingOrderIds: allTasks.map(t => t.orderId),
            };

            const schema = {
                type: Type.OBJECT,
                properties: {
                    orderId: { type: Type.STRING, description: "A unique fabrication work order ID in the format WO-8XXXX." },
                    productName: { type: Type.STRING, description: "A plausible name for a complex, custom fabricated metal product for the aerospace industry." },
                    priority: { type: Type.STRING, description: "The order priority, must be one of: 'normal', 'high', or 'rush'." },
                    dueDay: { type: Type.NUMBER, description: "The day of the week the entire order is due (0-6, Sunday-Saturday)." },
                    dueHour: { type: Type.NUMBER, description: "The hour of the day the order is due (0-8)." },
                    tasks: {
                        type: Type.ARRAY,
                        description: "A sequence of 2 to 5 tasks required to build the product. The tasks must be chosen from the provided master task list.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                taskName: { type: Type.STRING, description: "The name of the task, must be an exact match from the master task list." },
                                duration: { type: Type.NUMBER, description: "An estimated duration in hours for this specific task, can be different from the default." },
                                dependencies: {
                                    type: Type.ARRAY,
                                    description: "A list of other taskNames from THIS generated order that must be completed first.",
                                    items: { type: Type.STRING }
                                },
                                description: { type: Type.STRING, description: "A brief, one-sentence description for this specific task." },
                                isCritical: { type: Type.BOOLEAN, description: "Whether this task is on the critical path for the order." }
                            },
                            required: ['taskName', 'duration', 'dependencies', 'isCritical', 'description']
                        }
                    }
                },
                required: ['orderId', 'productName', 'priority', 'dueDay', 'dueHour', 'tasks']
            };

            const systemInstruction = `You are a Factory Production Simulator for an aerospace manufacturing facility. Your goal is to generate a single, new, realistic fabrication order to stress-test the scheduling system. Analyze the provided summary of the current factory state. Based on this state, generate a SINGLE, NEW, and REALISTIC fabrication order. Be creative and simulate real-world scenarios.
- If the system seems idle (low operator workload), create a large, complex order with multiple dependent tasks.
- If the system is busy, create a smaller, high-priority "rush" job to add pressure.
- If a particular task type is rarely performed, consider generating an order that includes it.
- Ensure the orderId is unique and not in the existing list. It must follow the 'WO-8XXXX' format, where XXXX are random digits.
- The productName should sound like a real industrial aerospace part.
- Choose tasks ONLY from the provided master task list.
- Task dependencies should only refer to other taskNames within this new order you are creating.
- The output must be a valid JSON object matching the provided schema, with no additional text or markdown.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: JSON.stringify(promptContext),
                config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema },
            });

            const result: GeneratedOrder = JSON.parse(response.text);
            
            setLastGeneratedOrder(result);
            
            const maxId = Math.max(0, ...allTasks.map(t => t.id));
            let nextId = maxId + 1;
            
            const newTasksMap = new Map<string, number>();
            const newTasks: Task[] = result.tasks.map((taskData) => {
                const newId = nextId++;
                newTasksMap.set(taskData.taskName, newId);
                const masterTask = masterTasks.find(mt => mt.name === taskData.taskName);
                return {
                    id: newId,
                    orderId: result.orderId,
                    name: taskData.taskName,
                    shortName: masterTask?.shortName || taskData.taskName.substring(0, 8),
                    day: -1,
                    startHour: -1,
                    duration: taskData.duration,
                    assignedTo: '',
                    status: TaskStatus.ToDo,
                    description: taskData.description,
                    dueDay: result.dueDay,
                    dueHour: result.dueHour,
                    progress: 0,
                    notes: null,
                    dependencies: [],
                    isCritical: taskData.isCritical,
                    displayOrder: allTasks.length + newTasksMap.size
                };
            });

            const finalNewTasks = newTasks.map(newTask => {
                const originalTaskData = result.tasks.find(t => t.taskName === newTask.name)!;
                const dependencyIds = originalTaskData.dependencies.map(depName => newTasksMap.get(depName)).filter((id): id is number => id !== undefined);
                return { ...newTask, dependencies: dependencyIds };
            });

            onUpdateTasks([...allTasks, ...finalNewTasks]);
            addToast(`Order ${result.orderId} generated and added to unplanned tasks.`, 'success');

        } catch(e: any) {
            console.error("Simulator Error:", e);
            setError(e.message || t('simulator.error.message'));
        } finally {
            setIsLoading(false);
        }
    };

    const renderPriority = (priority: string) => {
        const p = priority.toLowerCase();
        let colorClass = "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors duration-300";
        if (p === 'high') colorClass = "bg-amber-500 text-white";
        if (p === 'rush') colorClass = "bg-red-600 text-white";
        return <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${colorClass}`}>{t(`simulator.priorityLevel.${p}`)}</span>
    }

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col transition-colors duration-300">
            <header className="pb-4 border-b border-slate-700 mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('simulator.title')}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-300">{t('simulator.description')}</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Control Panel */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg flex flex-col items-center justify-center text-center transition-colors">
                    {masterTasks.length > 0 ? (
                        <button
                            onClick={handleGenerateOrder}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-6 py-3 text-base font-semibold rounded-lg transition-all bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg hover:shadow-cyan-500/30 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 15.75l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 18l-1.035.259a3.375 3.375 0 00-2.456 2.456L18 21.75l-.259-1.035a3.375 3.375 0 00-2.456-2.456L14.25 18l1.035-.259a3.375 3.375 0 002.456-2.456z" /></svg>
                            {t('simulator.runButton')}
                        </button>
                    ) : (
                        <p className="text-amber-400">{t('simulator.noMasterTasks')}</p>
                    )}
                </div>

                {/* Results Panel */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg transition-colors">
                    {isLoading ? (
                        <AILoadingState title={t('simulator.loadingTitle')} />
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-red-900/50 border border-red-700 text-red-300 p-6 rounded-lg max-w-lg">
                                <h3 className="text-lg font-semibold text-white mb-2">{t('simulator.error.title')}</h3>
                                <p className="text-sm text-center">{t('simulator.error.apiError', error)}</p>
                            </div>
                        </div>
                    ) : lastGeneratedOrder ? (
                        <div className="flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('simulator.lastGenerated')}</h3>
                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg space-y-3 transition-colors duration-300">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">{t('simulator.orderId')} / {t('simulator.productName')}</div>
                                        <div className="font-semibold text-slate-900 dark:text-white transition-colors duration-300">{lastGeneratedOrder.orderId} - {lastGeneratedOrder.productName}</div>
                                    </div>
                                    <div>
                                         <div className="text-xs text-slate-600 dark:text-slate-400 text-right mb-1 transition-colors duration-300">{t('simulator.priority')}</div>
                                         {renderPriority(lastGeneratedOrder.priority)}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2 transition-colors duration-300">{t('simulator.tasks', lastGeneratedOrder.tasks.length)}</h4>
                                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 -mr-2">
                                    {lastGeneratedOrder.tasks.map(task => (
                                        <li key={task.taskName} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md flex justify-between items-center transition-colors duration-300">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 transition-colors duration-300">{task.taskName}</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">"{task.description}"</p>
                                            </div>
                                            {task.isCritical && <span className="text-xs font-bold text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">{t('simulator.critical')}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                             <p className="mt-4 font-semibold">{t('simulator.noOrderGenerated')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimulatorPage;
