import React, { useState, useMemo } from 'react';
import { Task, MasterTask, TaskStatus } from '@/types';
import { useLocalization } from '@/contexts/LocalizationContext';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from './Toast';
import { AircraftTechnicalMap, ComputedZone } from './simulator/AircraftTechnicalMap';
import { ZoneInspectorDrawer } from './simulator/ZoneInspectorDrawer';
import { ProcessStatusLegend } from './simulator/ProcessStatusLegend';
import { ProcessSummaryCards, SimulatorSummary } from './simulator/ProcessSummaryCards';

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

const ZONE_DEFINITIONS = [
  { id: "propeller", name: "Propeller / Engine Nose", keywords: ["engine", "propeller", "pt6", "cowling", "powerplant"] },
  { id: "nose_section", name: "Nose Section", keywords: ["nose", "radome"] },
  { id: "cockpit", name: "Cockpit", keywords: ["cockpit", "flight deck"] },
  { id: "cabin", name: "Cabin", keywords: ["cabin", "fuselage", "passenger", "interior", "seats"] },
  { id: "cargo_door", name: "Cargo Door Area", keywords: ["cargo", "door"] },
  { id: "left_wing", name: "Left Wing", keywords: ["left wing", "port wing"] },
  { id: "right_wing", name: "Right Wing", keywords: ["right wing", "starboard wing", "wing"] },
  { id: "landing_gear", name: "Landing Gear", keywords: ["landing gear", "wheels", "struts", "brakes"] },
  { id: "tail_cone", name: "Tail Cone", keywords: ["tail cone", "empennage"] },
  { id: "vertical_stabilizer", name: "Vertical Stabilizer", keywords: ["vertical stabilizer", "vertical", "rudder"] },
  { id: "horizontal_stabilizer", name: "Horizontal Stabilizer", keywords: ["horizontal stabilizer", "horizontal", "elevator"] },
  { id: "electrical_systems", name: "Electrical / Avionics", keywords: ["electrical", "wiring", "harness", "power", "battery", "avionics", "instruments"] },
  { id: "final_inspection", name: "Final Inspection", keywords: ["inspection", "final", "test flight", "qa", "quality"] }
];

const AILoadingState: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <svg className="w-12 h-12 text-cyan-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-xl font-bold text-slate-300 mt-4">{title}</h2>
    </div>
);

const SimulatorPage: React.FC<SimulatorPageProps> = ({ onUpdateTasks, allTasks, allOperators, masterTasks }) => {
    const { t } = useLocalization();
    const { addToast } = useToast();
    
    // AI Panel State
    const [isLoading, setIsLoading] = useState(false);
    const [lastGeneratedOrder, setLastGeneratedOrder] = useState<GeneratedOrder | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Process Simulator State
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

    // Compute Zones
    const computedZones: ComputedZone[] = useMemo(() => {
        return ZONE_DEFINITIONS.map(def => {
            // Find tasks matching keywords
            const matchedTasks = allTasks.filter(task => {
                const searchString = `${task.name} ${task.description || ''} ${task.orderId} ${task.shortName}`.toLowerCase();
                // Match if any keyword is in the search string. 
                // Special case for 'wing' -> avoid matching 'left wing' if 'right wing'
                // For simplicity, just check direct string inclusions
                return def.keywords.some(kw => searchString.includes(kw));
            });

            // Calculate status
            let status: ComputedZone['status'] = 'not_started';
            let progress = 0;

            if (matchedTasks.length > 0) {
                const hasOnHold = matchedTasks.some(t => t.status === TaskStatus.OnHold);
                const hasInProgress = matchedTasks.some(t => t.status === TaskStatus.InProgress);
                const allCompleted = matchedTasks.every(t => t.status === TaskStatus.Completed || t.status === TaskStatus.QualityOK);
                
                if (hasOnHold) status = 'on_hold';
                else if (hasInProgress) status = 'in_progress';
                else if (allCompleted) status = 'completed';
                
                const totalProgress = matchedTasks.reduce((sum, t) => sum + t.progress, 0);
                progress = Math.round(totalProgress / matchedTasks.length);
            }

            return {
                id: def.id,
                name: def.name,
                status,
                progress,
                taskCount: matchedTasks.length
            };
        });
    }, [allTasks]);

    const activeZoneTasks = useMemo(() => {
        if (!selectedZoneId) return [];
        const def = ZONE_DEFINITIONS.find(d => d.id === selectedZoneId);
        if (!def) return [];
        
        return allTasks.filter(task => {
            const searchString = `${task.name} ${task.description || ''} ${task.orderId} ${task.shortName}`.toLowerCase();
            return def.keywords.some(kw => searchString.includes(kw));
        });
    }, [selectedZoneId, allTasks]);

    const activeZone = useMemo(() => {
        return computedZones.find(z => z.id === selectedZoneId) || null;
    }, [selectedZoneId, computedZones]);

    const summary: SimulatorSummary = useMemo(() => {
        const result = { completed: 0, inProgress: 0, onHold: 0, blocked: 0, notStarted: 0, overallProgress: 0 };
        if (computedZones.length === 0) return result;
        
        let totalProgress = 0;
        computedZones.forEach(z => {
            if (z.status === 'completed') result.completed++;
            else if (z.status === 'in_progress') result.inProgress++;
            else if (z.status === 'on_hold') result.onHold++;
            else if (z.status === 'blocked') result.blocked++;
            else result.notStarted++;
            totalProgress += z.progress;
        });

        result.overallProgress = Math.round(totalProgress / computedZones.length);
        return result;
    }, [computedZones]);

    const handleGenerateOrder = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

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
                model: 'gemini-3.1-pro-preview',
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
        let colorClass = "bg-slate-700 text-slate-200";
        if (p === 'high') colorClass = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
        if (p === 'rush') colorClass = "bg-red-500/20 text-red-400 border border-red-500/30";
        return <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded ${colorClass}`}>{t(`simulator.priorityLevel.${p}`)}</span>
    }

    return (
        <div className="w-full h-full bg-slate-900 rounded-2xl shadow-2xl flex flex-col font-sans overflow-hidden">
            
            <header className="p-6 border-b border-slate-800 flex-shrink-0 bg-slate-950 flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight leading-none mb-1">Process Simulator</h2>
                        <p className="text-sm font-medium text-cyan-500 tracking-wider uppercase">Interactive Production Board</p>
                    </div>
                </div>
                <ProcessSummaryCards summary={summary} />
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                
                {/* Visual Aircraft Map */}
                <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
                    <AircraftTechnicalMap 
                        zones={computedZones} 
                        selectedZoneId={selectedZoneId} 
                        onSelectZone={setSelectedZoneId} 
                    />
                    <div className="mt-8">
                        <ProcessStatusLegend />
                    </div>
                </div>

                {/* AI Stress Test Panel */}
                <div className="mt-16 w-full max-w-6xl mx-auto border-t border-slate-800 pt-8">
                    <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest mb-6">AI Stress Test</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Control Panel */}
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                            {masterTasks.length > 0 ? (
                                <button
                                    onClick={handleGenerateOrder}
                                    disabled={isLoading}
                                    className="flex items-center gap-3 px-6 py-4 text-sm uppercase tracking-widest font-bold rounded-lg transition-all bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>
                                    Inject Work Order
                                </button>
                            ) : (
                                <p className="text-amber-400 font-medium">No master tasks available.</p>
                            )}
                            <p className="text-xs text-slate-500 mt-4 leading-relaxed">Generates a smart, context-aware work order using Google Gemini based on the current workload of your factory.</p>
                        </div>

                        {/* Results Panel */}
                        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                            {isLoading ? (
                                <AILoadingState title="Generating Order..." />
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center p-4">
                                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Error</h3>
                                        <p className="text-xs text-center text-slate-400">{error}</p>
                                </div>
                            ) : lastGeneratedOrder ? (
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Last Injected Order</h3>
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] text-cyan-500 uppercase tracking-widest mb-1">{lastGeneratedOrder.orderId}</div>
                                                <div className="font-bold text-slate-200">{lastGeneratedOrder.productName}</div>
                                            </div>
                                            {renderPriority(lastGeneratedOrder.priority)}
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                            {lastGeneratedOrder.tasks.map(task => (
                                                <div key={task.taskName} className="bg-slate-800 p-3 rounded flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-300">{task.taskName}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1">{task.description}</p>
                                                    </div>
                                                    {task.isCritical && <span className="text-[9px] font-bold text-amber-500 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase uppercase tracking-widest">Critical</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mb-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     <p className="text-sm font-semibold">Waiting for orders...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            <ZoneInspectorDrawer 
                zone={activeZone}
                isOpen={!!selectedZoneId}
                onClose={() => setSelectedZoneId(null)}
                relatedTasks={activeZoneTasks}
                onUpdateTasks={onUpdateTasks}
                allTasks={allTasks}
            />
        </div>
    );
};

export default SimulatorPage;
