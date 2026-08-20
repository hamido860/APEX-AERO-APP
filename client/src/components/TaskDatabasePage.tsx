
import React, { useState, useMemo } from 'react';
import { MasterTask, Task } from '@/types';
import { useLocalization } from '@/contexts/LocalizationContext';
import { AddTaskModal } from './AddTaskModal';
import { useToast } from './Toast';

declare const XLSX: any;

interface TaskDatabasePageProps {
  allTasks: Task[];
  masterTasks: MasterTask[];
  onUpdateMasterTasks: (tasks: MasterTask[]) => void;
  columnVisibility: { [key: string]: boolean };
  searchTerm: string;
  isAddTaskModalOpen: boolean;
  setIsAddTaskModalOpen: (isOpen: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

type SortKey = keyof MasterTask;
interface SortConfig {
    key: SortKey;
    direction: 'ascending' | 'descending';
}

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    sortConfig: SortConfig | null;
    requestSort: (key: SortKey) => void;
    className?: string;
}> = ({ label, sortKey, sortConfig, requestSort, className }) => {
    const isSorted = sortConfig?.key === sortKey;
    const directionIcon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
    const ariaSort = isSorted ? sortConfig.direction : 'none';

    return (
        <th aria-sort={ariaSort} className={`p-0 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${className || ''}`}>
            <button
                onClick={() => requestSort(sortKey)}
                className="w-full flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-inset rounded"
            >
                {label}
                <span className="text-cyan-400" aria-hidden="true">{directionIcon}</span>
            </button>
        </th>
    );
};

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;


const TaskDatabasePage: React.FC<TaskDatabasePageProps> = ({ allTasks, masterTasks, onUpdateMasterTasks, columnVisibility, searchTerm, isAddTaskModalOpen, setIsAddTaskModalOpen, fileInputRef }) => {
    const { t } = useLocalization();
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'program', direction: 'ascending' });
    const { addToast } = useToast();
    
    const [editingTask, setEditingTask] = useState<MasterTask | null>(null);

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [tasksToUpload, setTasksToUpload] = useState<MasterTask[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredTasks = useMemo(() => {
        let sortableItems = [...masterTasks];
        const lowercasedFilter = searchTerm.toLowerCase();

        if (lowercasedFilter) {
            sortableItems = sortableItems.filter(item =>
                item.name.toLowerCase().includes(lowercasedFilter) ||
                item.program.toLowerCase().includes(lowercasedFilter) ||
                item.subProgram.toLowerCase().includes(lowercasedFilter) ||
                item.shortName.toLowerCase().includes(lowercasedFilter)
            );
        }

        if (sortConfig !== null) {
          sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
          });
        }
        return sortableItems;
    }, [masterTasks, searchTerm, sortConfig]);

    // --- CRUD Handlers ---
    const handleEdit = (task: MasterTask) => {
        setEditingTask({ ...task });
    };
    const handleCancelEdit = () => {
        setEditingTask(null);
    };
    const handleSaveEdit = () => {
        if (!editingTask) return;
        if (!editingTask.name || !editingTask.shortName || !editingTask.program || !editingTask.subProgram || editingTask.defaultDuration < 1) {
            addToast(t('settingsModal.error.allFieldsRequired'), 'error');
            return;
        }
        const updatedTasks = masterTasks.map(t => t.name === editingTask.name ? editingTask : t);
        onUpdateMasterTasks(updatedTasks);
        setEditingTask(null);
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingTask) return;
        const { name, value } = e.target;
        setEditingTask({ ...editingTask, [name]: name === 'defaultDuration' ? parseInt(value, 10) : value });
    };
    const handleDelete = (taskName: string) => {
        const isTaskInUse = allTasks.some(t => t.name === taskName);
        if (isTaskInUse) {
            addToast(t('taskdatabase.delete.inUseError', taskName), 'error');
            return;
        }
        if (window.confirm(t('taskdatabase.delete.confirmMessage', taskName))) {
            const updatedTasks = masterTasks.filter(t => t.name !== taskName);
            onUpdateMasterTasks(updatedTasks);
        }
    };
    const handleAddTask = (newTask: MasterTask) => {
        onUpdateMasterTasks([...masterTasks, newTask]);
    };
    const uniquePrograms = useMemo(() => Array.from(new Set(masterTasks.map(mt => mt.program))), [masterTasks]);
    
    // --- File Upload Handlers ---
    const closeUploadModal = () => { setIsUploadModalOpen(false); setUploadError(null); setTasksToUpload([]); };
    const getValueFromRow = (row: any, keys: string[]): any => {
        const rowKeys = Object.keys(row);
        for (const alias of keys) {
            const matchingRowKey = rowKeys.find(rk => rk.trim().toLowerCase() === alias.toLowerCase());
            if (matchingRowKey) { const value = row[matchingRowKey]; if (value !== undefined && value !== null && String(value).trim() !== '') return value; }
        }
        return undefined;
    };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        const handleError = (error: unknown) => {
            console.error("File upload error:", error);
            const message = error instanceof Error ? error.message : t('taskdatabase.upload.unknownError');
            setUploadError(message); setTasksToUpload([]); setIsUploadModalOpen(true);
        };
        const processData = (data: Partial<MasterTask>[]) => {
            const existingTaskNames = new Set(masterTasks.map(t => t.name.toLowerCase()));
            const newTasks = data.filter((task): task is MasterTask => {
                const isComplete = task.name && task.program && task.subProgram && task.shortName && task.defaultDuration;
                if (!isComplete) return false;
                return !existingTaskNames.has(task.name.toLowerCase());
            });
            if (newTasks.length === 0) { handleError(new Error(t('taskdatabase.upload.noNewTasks'))); return; }
            setTasksToUpload(newTasks); setUploadError(null); setIsUploadModalOpen(true);
        };
        if (file.name.endsWith('.json')) {
            reader.onload = (e) => { try { const text = e.target?.result; if (typeof text !== 'string') throw new Error(t('orderlog.upload.notReadable')); const data = JSON.parse(text); if (!Array.isArray(data)) throw new Error(t('taskdatabase.upload.invalidJsonFormat')); processData(data); } catch (error) { handleError(error); } };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.onload = (e) => {
                try {
                    const data = e.target?.result; if (!data) throw new Error(t('orderlog.upload.emptyFile'));
                    const workbook = XLSX.read(data, { type: 'array' }); const worksheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
                    const tasksFromExcel = jsonData.map((row): Partial<MasterTask> | null => {
                        const name = getValueFromRow(row, ['Name', 'Task Name', 'Task', 'Nom', 'Tâche']); const program = getValueFromRow(row, ['Program', 'Programme']); const subProgram = getValueFromRow(row, ['Sub-Program', 'Sub Program', 'Sous-Programme']); const shortName = getValueFromRow(row, ['Short Name', 'Shortname', 'Nom Court']); const defaultDuration = getValueFromRow(row, ['Default Duration (hrs)', 'Default Duration', 'Duration', 'Durée par Défaut (h)', 'Durée par Défaut', 'Durée']);
                        if (!name || !program || !subProgram || !shortName || defaultDuration === undefined) return null;
                        const durationNum = Number(defaultDuration); if (isNaN(durationNum) || durationNum <= 0) return null;
                        return { name, program, subProgram, shortName, defaultDuration: durationNum };
                    }).filter((task): task is Partial<MasterTask> => task !== null);
                    if (tasksFromExcel.length === 0 && jsonData.length > 0) { const foundHeaders = Object.keys(jsonData[0]).join(', '); const errorMessage = `${t('taskdatabase.upload.missingFields')}\n${t('taskdatabase.upload.foundHeaders')}: ${foundHeaders}`; throw new Error(errorMessage); }
                    processData(tasksFromExcel);
                } catch (error) { handleError(error); }
            };
            reader.readAsArrayBuffer(file);
        } else { handleError(new Error(t('orderlog.upload.unsupportedType'))); }
        event.target.value = '';
    };
    const handleConfirmUpload = () => { onUpdateMasterTasks([...masterTasks, ...tasksToUpload]); closeUploadModal(); };

    return (
         <div className="w-full h-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col transition-colors duration-300">
          <div className="flex-grow overflow-auto border border-slate-700 rounded-lg">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow-md transition-colors duration-300">
                <tr>
                  {columnVisibility.program && <SortableHeader label={t('columns.program')} sortKey="program" sortConfig={sortConfig} requestSort={requestSort} />}
                  {columnVisibility.subProgram && <SortableHeader label={t('columns.subProgram')} sortKey="subProgram" sortConfig={sortConfig} requestSort={requestSort} />}
                  {columnVisibility.task && <SortableHeader label={t('columns.task')} sortKey="name" sortConfig={sortConfig} requestSort={requestSort} />}
                  {columnVisibility.shortName && <SortableHeader label={t('columns.shortName')} sortKey="shortName" sortConfig={sortConfig} requestSort={requestSort} />}
                  {columnVisibility.defaultDuration && <SortableHeader label={t('columns.defaultDuration')} sortKey="defaultDuration" sortConfig={sortConfig} requestSort={requestSort} />}
                  {columnVisibility.actions && <th className="py-1.5 px-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-32 transition-colors duration-300">{t('taskdatabase.actions.title')}</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900/50 transition-colors duration-300">
                {sortedAndFilteredTasks.map(task => {
                    const isEditing = editingTask?.name === task.name;
                    const inputClass = "w-full bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-colors duration-300";
                    return (
                        <tr key={task.name} className={`border-b border-slate-200 dark:border-slate-700/50 transition-colors ${isEditing ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                            {isEditing && editingTask ? (
                                <>
                                    {columnVisibility.program && <td className="p-2"><input name="program" value={editingTask.program} onChange={handleInputChange} className={inputClass} /></td>}
                                    {columnVisibility.subProgram && <td className="p-2"><input name="subProgram" value={editingTask.subProgram} onChange={handleInputChange} className={inputClass} /></td>}
                                    {columnVisibility.task && <td className="p-2 font-semibold text-white">{editingTask.name}</td>}
                                    {columnVisibility.shortName && <td className="p-2"><input name="shortName" value={editingTask.shortName} onChange={handleInputChange} className={inputClass} /></td>}
                                    {columnVisibility.defaultDuration && <td className="p-2"><input type="number" min="1" name="defaultDuration" value={editingTask.defaultDuration} onChange={handleInputChange} className={`${inputClass} text-center`} /></td>}
                                    {columnVisibility.actions && <td className="p-2">
                                        <div className="flex items-center gap-2">
                                            <button onClick={handleSaveEdit} title={t('taskdatabase.actions.save')} aria-label={t('taskdatabase.actions.save')} className="p-2 rounded text-slate-200 bg-green-600 hover:bg-green-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"><SaveIcon /></button>
                                            <button onClick={handleCancelEdit} title={t('taskdatabase.actions.cancel')} aria-label={t('taskdatabase.actions.cancel')} className="p-2 rounded text-slate-200 bg-slate-600 hover:bg-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"><CancelIcon /></button>
                                        </div>
                                    </td>}
                                </>
                            ) : (
                                <>
                                    {columnVisibility.program && <td className="py-2 px-3 font-medium text-cyan-300">{task.program}</td>}
                                    {columnVisibility.subProgram && <td className="py-2 px-3 text-slate-300">{task.subProgram}</td>}
                                    {columnVisibility.task && <td className="py-2 px-3 font-semibold text-white">{task.name}</td>}
                                    {columnVisibility.shortName && <td className="py-2 px-3 text-slate-300 font-mono text-xs">{task.shortName}</td>}
                                    {columnVisibility.defaultDuration && <td className="py-2 px-3 text-center">{t('taskdatabase.hours', task.defaultDuration)}</td>}
                                    {columnVisibility.actions && <td className="p-2">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(task)} title={t('taskdatabase.actions.edit')} aria-label={t('taskdatabase.actions.edit')} className="p-2 rounded text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"><EditIcon /></button>
                                            <button onClick={() => handleDelete(task.name)} title={t('taskdatabase.actions.delete')} aria-label={t('taskdatabase.actions.delete')} className="p-2 rounded text-slate-500 dark:text-slate-400 hover:bg-red-600/80 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800"><DeleteIcon /></button>
                                        </div>
                                    </td>}
                                </>
                            )}
                        </tr>
                    );
                })}
              </tbody>
            </table>
            {sortedAndFilteredTasks.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                    <p>{t('taskdatabase.noTasks')}</p>
                </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.xlsx,.xls" className="hidden" />

          {isAddTaskModalOpen && <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} onAddTask={handleAddTask} existingPrograms={uniquePrograms} masterTasks={masterTasks} />}

          {isUploadModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={closeUploadModal}>
                <div
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col w-full max-w-4xl max-h-[90vh] border border-slate-200 dark:border-slate-700 transition-colors duration-300"
                    onClick={e => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                >
                    <header className="flex-shrink-0 mb-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('taskdatabase.upload.title')}</h2>
                    </header>
                    {uploadError ? (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex-grow flex flex-col items-center justify-center">
                            <h3 className="text-lg font-semibold text-white mb-2">{t('taskdatabase.upload.failed')}</h3>
                            <div className="text-sm text-center">{uploadError.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-shrink-0 transition-colors duration-300">{t('taskdatabase.upload.summary', tasksToUpload.length)}</p>
                            <div className="flex-grow overflow-y-auto border border-slate-700 rounded-lg">
                                 <table className="w-full text-sm text-left text-slate-300">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow transition-colors duration-300"><tr>
                                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('taskdatabase.upload.table.program')}</th>
                                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('taskdatabase.upload.table.taskName')}</th>
                                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">{t('taskdatabase.upload.table.duration')}</th>
                                    </tr></thead>
                                    <tbody className="bg-white dark:bg-slate-900/50 transition-colors duration-300">
                                        {tasksToUpload.map(task => (
                                            <tr key={task.name} className="border-b border-slate-700/50">
                                                <td className="p-3 font-medium text-cyan-300">{task.program}</td>
                                                <td className="p-3 font-medium text-white">{task.name}</td>
                                                <td className="p-3 text-center">{t('taskdatabase.hours', task.defaultDuration)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    <footer className="flex justify-end items-center gap-4 mt-6 flex-shrink-0">
                        <button onClick={closeUploadModal} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800">
                            {uploadError ? t('actions.close') : t('actions.cancel')}
                        </button>
                        {!uploadError && ( <button onClick={handleConfirmUpload} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-cyan-500 hover:bg-cyan-600 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-800">{t('actions.confirm')}</button> )}
                    </footer>
                </div>
            </div>
          )}
        </div>
    );
};

export default TaskDatabasePage;
