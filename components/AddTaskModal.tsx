import React, { useState } from 'react';
import { MasterTask } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface AddTaskModalProps {
    onClose: () => void;
    onAddTask: (task: MasterTask) => void;
    existingPrograms: string[];
    masterTasks: MasterTask[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAddTask, existingPrograms, masterTasks }) => {
    const { t } = useLocalization();
    const [task, setTask] = useState<MasterTask>({ name: '', shortName: '', program: existingPrograms[0] || '', subProgram: '', defaultDuration: 1 });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTask(prev => ({ ...prev, [name]: name === 'defaultDuration' ? parseInt(value, 10) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!task.name || !task.shortName || !task.program || !task.subProgram || task.defaultDuration < 1) {
            setError(t('settingsModal.error.allFieldsRequired'));
            return;
        }
        if (masterTasks.some(mt => mt.name.toLowerCase() === task.name.toLowerCase())) {
            setError(t('taskdatabase.add.duplicateError', task.name));
            return;
        }
        onAddTask(task);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 transition-colors duration-300" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('addTaskModal.title')}</h2>
                    {error && <p className="text-red-400 text-sm bg-red-900/40 p-2 rounded-md">{error}</p>}
                    
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-slate-300 mb-1" htmlFor="name">{t('addTaskModal.name')}</label>
                        <input type="text" id="name" name="name" value={task.name} onChange={handleChange} required className="bg-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-slate-300 mb-1" htmlFor="shortName">{t('addTaskModal.shortName')}</label>
                        <input type="text" id="shortName" name="shortName" value={task.shortName} onChange={handleChange} required className="bg-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-slate-300 mb-1" htmlFor="program">{t('addTaskModal.program')}</label>
                        <input type="text" id="program" name="program" value={task.program} onChange={handleChange} required list="program-list" className="bg-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none" />
                        <datalist id="program-list">
                            {existingPrograms.map(p => <option key={p} value={p} />)}
                        </datalist>
                    </div>
                     <div className="flex flex-col">
                        <label className="text-sm font-semibold text-slate-300 mb-1" htmlFor="subProgram">{t('addTaskModal.subProgram')}</label>
                        <input type="text" id="subProgram" name="subProgram" value={task.subProgram} onChange={handleChange} required className="bg-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-slate-300 mb-1" htmlFor="defaultDuration">{t('addTaskModal.defaultDuration')}</label>
                        <input type="number" id="defaultDuration" name="defaultDuration" value={task.defaultDuration} onChange={handleChange} required min="1" className="bg-slate-700 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none" />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-600 hover:bg-slate-500 text-white">{t('actions.cancel')}</button>
                        <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-cyan-600 hover:bg-cyan-500 text-white">{t('addTaskModal.create')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};