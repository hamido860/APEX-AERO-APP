import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Task, MasterTask, TaskStatus } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from './Toast';

declare const XLSX: any;

interface AIAgentPageProps {
  onUpdateTasks: (tasks: Task[]) => void;
  onUpdateMasterTasks: (tasks: MasterTask[]) => void;
  allTasks: Task[];
  masterTasks: MasterTask[];
}

type Step = 'idle' | 'analyzing' | 'review_master_tasks' | 'review_issues' | 'review_changes' | 'complete' | 'error';
interface ChatMessage {
    id: number;
    type: 'agent' | 'user' | 'component';
    content: string | React.ReactNode;
}
interface StagedData {
    newMasterTasks: MasterTask[];
    newTasks: Task[];
    updatedTasks: Task[];
    issues: any[];
}

const DataAgentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-cyan-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v.007a.375.375 0 01-.375.375H6.375a.375.375 0 01-.375-.375V17.25m5.25 0v.007a.375.375 0 00.375.375h2.25a.375.375 0 00.375-.375V17.25m-5.25 0v-4.5a.75.75 0 01.75-.75h3.75a.75.75 0 01.75.75v4.5m-5.25 0h5.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.375 12.75v-1.5a1.125 1.125 0 112.25 0v1.5m3.375 0v-1.5a1.125 1.125 0 112.25 0v1.5m-6.75 4.5h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.375a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const AILoadingState = () => (
    <div className="flex justify-center items-center gap-3 p-3">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
    </div>
);

// --- Sub-components for steps ---

const ReviewMasterTasksComponent: React.FC<{data: MasterTask[], onConfirm: (tasks: MasterTask[]) => void}> = ({ data, onConfirm }) => {
    const { t } = useLocalization();
    const [tasks, setTasks] = useState(data);

    const handleChange = (index: number, field: keyof MasterTask, value: string | number) => {
        setTasks(prev => prev.map((task, i) => i === index ? { ...task, [field]: value } : task));
    };

    return (
        <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-lg transition-colors duration-300">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('aiAgent.steps.reviewMaster.title')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4 transition-colors duration-300">{t('aiAgent.steps.reviewMaster.description')}</p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 -mr-2">
                {tasks.map((task, index) => (
                    <div key={index} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md grid grid-cols-2 gap-3 transition-colors duration-300">
                        <input value={task.name} onChange={e => handleChange(index, 'name', e.target.value)} placeholder="Name" className="bg-white dark:bg-slate-700 rounded p-2 text-sm col-span-2 text-slate-900 dark:text-white transition-colors duration-300" />
                        <input value={task.program} onChange={e => handleChange(index, 'program', e.target.value)} placeholder="Program" className="bg-white dark:bg-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white transition-colors duration-300" />
                        <input value={task.subProgram} onChange={e => handleChange(index, 'subProgram', e.target.value)} placeholder="Sub-Program" className="bg-white dark:bg-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white transition-colors duration-300" />
                        <input value={task.shortName} onChange={e => handleChange(index, 'shortName', e.target.value)} placeholder="Short Name" className="bg-white dark:bg-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white transition-colors duration-300" />
                        <input type="number" value={task.defaultDuration} onChange={e => handleChange(index, 'defaultDuration', Number(e.target.value))} placeholder="Duration" className="bg-white dark:bg-slate-700 rounded p-2 text-sm text-slate-900 dark:text-white transition-colors duration-300" />
                    </div>
                ))}
            </div>
            <button onClick={() => onConfirm(tasks)} className="w-full mt-4 bg-cyan-600 text-white font-semibold py-2 rounded-lg hover:bg-cyan-500 transition-colors">{t('aiAgent.steps.reviewMaster.confirm')}</button>
        </div>
    );
};

const ReviewIssuesComponent: React.FC<{issues: any[], onConfirm: () => void}> = ({ issues, onConfirm }) => {
    const { t } = useLocalization();
    return (
        <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-lg transition-colors duration-300">
             <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('aiAgent.steps.reviewIssues.title')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4 transition-colors duration-300">{t('aiAgent.steps.reviewIssues.description')}</p>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 -mr-2">
                {issues.map((issue, index) => (
                    <div key={index} className="bg-amber-900/40 border border-amber-700/50 p-3 rounded-md">
                        <p className="font-semibold text-amber-300 text-sm">{t('aiAgent.steps.reviewIssues.issue')}: {issue.issue}</p>
                        <p className="text-xs text-amber-400/80 mt-1 font-mono">{issue.rowData}</p>
                    </div>
                ))}
            </div>
            <button onClick={onConfirm} className="w-full mt-4 bg-cyan-600 text-white font-semibold py-2 rounded-lg hover:bg-cyan-500 transition-colors">{t('aiAgent.steps.reviewIssues.confirm')}</button>
        </div>
    )
};

const ReviewChangesComponent: React.FC<{data: StagedData, onConfirm: () => void, onStartOver: () => void}> = ({ data, onConfirm, onStartOver }) => {
    const { t } = useLocalization();
    return (
         <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-lg transition-colors duration-300">
             <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('aiAgent.steps.reviewChanges.title')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4 transition-colors duration-300">{t('aiAgent.steps.reviewChanges.description')}</p>
            <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 -mr-2">
                <div>
                    <h4 className="font-semibold text-slate-300 mb-2">{t('aiAgent.steps.reviewChanges.newTasks', data.newTasks.length)}</h4>
                    <ul className="text-xs space-y-1">
                        {data.newTasks.map(t => <li key={t.id} className="bg-slate-100 dark:bg-slate-800 p-2 rounded truncate transition-colors duration-300">{t.orderId} - {t.name}</li>)}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-slate-300 mb-2">{t('aiAgent.steps.reviewChanges.updatedTasks', data.updatedTasks.length)}</h4>
                    <ul className="text-xs space-y-1">
                         {data.updatedTasks.map(t => <li key={t.id} className="bg-slate-100 dark:bg-slate-800 p-2 rounded truncate transition-colors duration-300">{t.orderId} - {t.name}</li>)}
                    </ul>
                </div>
            </div>
            <div className="flex gap-4 mt-4">
                 <button onClick={onStartOver} className="w-full bg-slate-600 text-white font-semibold py-2 rounded-lg hover:bg-slate-500 transition-colors">{t('aiAgent.steps.reviewChanges.startOver')}</button>
                 <button onClick={onConfirm} className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-500 transition-colors">{t('aiAgent.steps.reviewChanges.confirm')}</button>
            </div>
        </div>
    )
};

const CompleteComponent: React.FC<{onStartOver: () => void}> = ({ onStartOver }) => {
    const { t } = useLocalization();
    return (
        <div className="bg-slate-100/50 dark:bg-slate-700/50 p-4 rounded-lg text-center transition-colors duration-300">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('aiAgent.steps.complete.title')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4 transition-colors duration-300">{t('aiAgent.steps.complete.description')}</p>
            <button onClick={onStartOver} className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-colors">{t('aiAgent.steps.complete.again')}</button>
        </div>
    );
};


const AIAgentPage: React.FC<AIAgentPageProps> = ({ allTasks, masterTasks, onUpdateTasks, onUpdateMasterTasks }) => {
    const { t } = useLocalization();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentStep, setCurrentStep] = useState<Step>('idle');
    const [isLoading, setIsLoading] = useState(false);
    const [stagedData, setStagedData] = useState<StagedData>({ newMasterTasks: [], newTasks: [], updatedTasks: [], issues: [] });
    const [uploadedFile, setUploadedFile] = useState<any[] | null>(null);

    const addMessage = (type: ChatMessage['type'], content: ChatMessage['content']) => {
        setChatMessages(prev => [...prev, { id: Date.now() + Math.random(), type, content }]);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        if (currentStep === 'idle') {
            addMessage('agent', t('aiAgent.greeting'));
        }
    }, [currentStep, t]);
    
    const handleFileClick = () => fileInputRef.current?.click();

    const resetState = () => {
        setChatMessages([]);
        setCurrentStep('idle');
        setIsLoading(false);
        setStagedData({ newMasterTasks: [], newTasks: [], updatedTasks: [], issues: [] });
        setUploadedFile(null);
    };

    const runAIAnalysis = async (parsedData: any[]) => {
        addMessage('agent', t('aiAgent.analysis.start'));
        setIsLoading(true);
        setCurrentStep('analyzing');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const existingMasterTaskNames = masterTasks.map(mt => mt.name);
            const existingOrderIds = allTasks.map(t => t.orderId);
            const dataSample = parsedData.slice(0, 5); // Send a sample to save tokens

            const schema = {
                type: Type.OBJECT,
                properties: {
                    analysisSummary: { type: Type.STRING, description: "A brief, human-readable summary of the findings." },
                    newMasterTaskNames: {
                        type: Type.ARRAY,
                        description: "A list of task names from the upload that are not in the existing master task list.",
                        items: { type: Type.STRING }
                    },
                    tasksToUpdate: {
                        type: Type.ARRAY,
                        description: "A list of Order IDs from the upload that match existing Order IDs, indicating an update.",
                        items: { type: Type.STRING }
                    },
                    dataQualityIssues: {
                        type: Type.ARRAY,
                        description: "A list of rows with potential data quality issues.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                rowData: { type: Type.STRING },
                                issue: { type: Type.STRING, description: "A description of the problem, e.g., 'Missing required field: Name' or 'Invalid duration value'." }
                            }
                        }
                    }
                }
            };
            
            const systemInstruction = `You are a data analysis agent for a manufacturing scheduler. Analyze the provided JSON data from a user-uploaded file. Compare it against the lists of existing master tasks and order IDs. Your goal is to identify new master tasks, tasks to update, and data quality issues.
- A task is a 'new master task' if its name is not in 'existingMasterTaskNames'.
- An order is an 'update' if its 'Order ID' is in 'existingOrderIds'.
- A 'data quality issue' occurs if essential fields like 'Order ID' or 'Name' are missing.
Return your analysis as a single JSON object matching the provided schema. Do not include any other text or markdown formatting.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Context:
- Existing Master Tasks: ${JSON.stringify(existingMasterTaskNames)}
- Existing Order IDs: ${JSON.stringify(existingOrderIds)}
- Uploaded Data Sample: ${JSON.stringify(dataSample)}

Analyze the full uploaded dataset based on this context and provide your findings in the required JSON format.`,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema },
            });

            const result = JSON.parse(response.text);
            processAIResult(result);

        } catch (e: any) {
            console.error("AI Agent Error:", e);
            addMessage('agent', t('aiAgent.error.api', e.message));
            setCurrentStep('error');
        } finally {
            setIsLoading(false);
        }
    };

    const processAIResult = (result: any) => {
        addMessage('agent', t('aiAgent.analysis.summary'));

        // Process Master Tasks
        const newMasterTasksFromAI = (result.newMasterTaskNames || []).map((name: string) => ({
            name, program: 'Default', subProgram: 'Default', shortName: name.substring(0,8).toUpperCase(), defaultDuration: 4
        }));

        const existingOrderIds = new Set(allTasks.map(t => t.orderId));
        const updatedOrderIds = new Set(result.tasksToUpdate || []);
        
        const newTasksFromFile: Task[] = [];
        const updatedTasksFromFile: Task[] = [];
        
        const maxId = Math.max(0, ...allTasks.map(t => t.id));
        let nextId = maxId + 1;
        const maxDisplayOrder = Math.max(0, ...allTasks.map(t => t.displayOrder));
        let nextDisplayOrder = maxDisplayOrder + 1;

        uploadedFile?.forEach(row => {
            const orderId = String(row['Order ID'] || row['orderId'] || '');
            const name = String(row['Name'] || row['name'] || '');
            if (!orderId || !name) return; // Skip rows with critical missing info

            if (updatedOrderIds.has(orderId)) {
                 const existingTask = allTasks.find(t => t.orderId === orderId && t.name === name);
                 if(existingTask) updatedTasksFromFile.push({ ...existingTask, /* add other updated fields */ });
            } else if (!existingOrderIds.has(orderId)) {
                newTasksFromFile.push({
                    id: nextId++,
                    orderId, name,
                    shortName: String(row['Short Name'] || row['shortName'] || '').substring(0,8),
                    day: -1, startHour: -1, assignedTo: '',
                    status: TaskStatus.ToDo,
                    progress: 0, notes: null,
                    duration: Number(row['Duration'] || row['duration'] || 4),
                    dueDay: Number(row['Due Day'] || row['dueDay'] || 0),
                    dueHour: Number(row['Due Hour'] || row['dueHour'] || 8),
                    description: String(row['Description'] || row['description'] || ''),
                    displayOrder: nextDisplayOrder++,
                    isCritical: !!row['Is Critical'],
                    dependencies: []
                });
            }
        });

        setStagedData({
            newMasterTasks: newMasterTasksFromAI,
            newTasks: newTasksFromFile,
            updatedTasks: updatedTasksFromFile,
            issues: result.dataQualityIssues || []
        });

        if (newMasterTasksFromAI.length > 0) {
            setCurrentStep('review_master_tasks');
        } else if ((result.dataQualityIssues || []).length > 0) {
            setCurrentStep('review_issues');
        } else {
            setCurrentStep('review_changes');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        addMessage('user', t('aiAgent.userUpload', file.name));

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
                setUploadedFile(jsonData);
                runAIAnalysis(jsonData);
            } catch (err: any) {
                addMessage('agent', t('aiAgent.error.file', err.message));
                setCurrentStep('error');
            }
        };
        reader.onerror = (err) => {
            addMessage('agent', t('aiAgent.error.file', reader.error?.message));
            setCurrentStep('error');
        };
        reader.readAsArrayBuffer(file);
        event.target.value = ''; // Reset input
    };
    
    const handleConfirmMasterTasks = (confirmedTasks: MasterTask[]) => {
        setStagedData(prev => ({ ...prev, newMasterTasks: confirmedTasks }));
        if(stagedData.issues.length > 0) {
            setCurrentStep('review_issues');
        } else {
            setCurrentStep('review_changes');
        }
    };
    
    const handleConfirmIssues = () => setCurrentStep('review_changes');

    const handleApplyChanges = () => {
        if(stagedData.newMasterTasks.length > 0) {
            onUpdateMasterTasks([...masterTasks, ...stagedData.newMasterTasks]);
        }
        
        const updatedTaskMap = new Map(allTasks.map(t => [t.id, t]));
        stagedData.updatedTasks.forEach(ut => updatedTaskMap.set(ut.id, ut));
        const finalTasks = [...Array.from(updatedTaskMap.values()), ...stagedData.newTasks];
        
        onUpdateTasks(finalTasks);
        addToast("Data successfully imported!", 'success');
        setCurrentStep('complete');
    };

    const renderCurrentStep = () => {
        switch(currentStep) {
            case 'review_master_tasks':
                return <ReviewMasterTasksComponent data={stagedData.newMasterTasks} onConfirm={handleConfirmMasterTasks} />;
            case 'review_issues':
                return <ReviewIssuesComponent issues={stagedData.issues} onConfirm={handleConfirmIssues} />;
            case 'review_changes':
                return <ReviewChangesComponent data={stagedData} onConfirm={handleApplyChanges} onStartOver={resetState} />;
            case 'complete':
                return <CompleteComponent onStartOver={resetState} />;
            default: return null;
        }
    }

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col transition-colors duration-300">
            <header className="flex items-center justify-between pb-4 border-b border-slate-700 mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('aiAgent.title')}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-300">{t('aiAgent.description')}</p>
                </div>
            </header>
            
            <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 animate-fade-in-up ${msg.type === 'user' ? 'justify-end' : ''}`}>
                        {msg.type === 'agent' && <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center flex-shrink-0"><DataAgentIcon /></div>}
                        <div className={`p-3 rounded-lg max-w-xl transition-colors duration-300 ${msg.type === 'agent' ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-transparent w-full'}`}>
                            {typeof msg.content === 'string' ? <p className="text-sm text-slate-200">{msg.content}</p> : msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && <AILoadingState />}
                {renderCurrentStep() && (
                    <div className="animate-fade-in-up">
                        {renderCurrentStep()}
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <footer className="flex-shrink-0 pt-6 mt-auto border-t border-slate-700">
                {currentStep === 'idle' && (
                    <button onClick={handleFileClick} className="w-full text-center px-4 py-3 text-sm font-semibold rounded-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white">
                        {t('aiAgent.uploadButton')}
                    </button>
                )}
            </footer>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.xlsx,.xls" className="hidden" />
        </div>
    );
};

export default AIAgentPage;