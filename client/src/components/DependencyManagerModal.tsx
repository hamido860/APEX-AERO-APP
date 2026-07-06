
import React, { useState, useMemo, useEffect } from 'react';
import { Task } from '@/types';
import { useLocalization } from '@/contexts/LocalizationContext';

interface DependencyManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    allTasks: Task[];
    onSave: (updatedTask: Task) => void;
}

const DependencyManagerModal: React.FC<DependencyManagerModalProps> = ({
    isOpen,
    onClose,
    task,
    allTasks,
    onSave,
}) => {
    const { t } = useLocalization();
    const [selectedDependencies, setSelectedDependencies] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedDependencies(task.dependencies || []);
            setSearchTerm('');
            setError(null);
        }
    }, [isOpen, task.dependencies]);

    const isCircular = (newDependencyId: number): boolean => {
        const queue: number[] = [task.id];
        const visited = new Set<number>([task.id]);

        while(queue.length > 0) {
            const currentId = queue.shift()!;
            if (currentId === newDependencyId) return true;

            const dependents = allTasks.filter(t => t.dependencies?.includes(currentId));
            for (const dependent of dependents) {
                if (!visited.has(dependent.id)) {
                    visited.add(dependent.id);
                    queue.push(dependent.id);
                }
            }
        }
        return false;
    };

    const handleToggleDependency = (depId: number) => {
        setError(null);
        if (selectedDependencies.includes(depId)) {
            setSelectedDependencies(prev => prev.filter(id => id !== depId));
        } else {
            if (isCircular(depId)) {
                setError(t('dependencyModal.errorCircular'));
                return;
            }
            setSelectedDependencies(prev => [...prev, depId]);
        }
    };

    const handleSave = () => {
        onSave({ ...task, dependencies: selectedDependencies });
        onClose();
    };

    const availableTasks = useMemo(() => {
        const dependentIds = new Set(allTasks.filter(t => t.dependencies?.includes(task.id)).map(t => t.id));
        return allTasks
            .filter(t => t.id !== task.id && !dependentIds.has(t.id))
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.orderId.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allTasks, task.id, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col w-full max-w-2xl max-h-[90vh] border border-slate-200 dark:border-slate-700 transition-colors duration-300" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('dependencyModal.title')}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors duration-300">{t('dependencyModal.description', task.name)}</p>
                </header>
                
                <div className="relative mb-4 flex-shrink-0">
                    <input
                        type="search"
                        placeholder={t('dependencyModal.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 transition-colors duration-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>

                {error && <p className="text-red-400 text-sm bg-red-900/40 p-3 rounded-md mb-4">{error}</p>}
                
                <div className="flex-grow overflow-y-auto border border-slate-700 rounded-lg pr-2 -mr-2">
                    <ul className="divide-y divide-slate-700/50">
                        {availableTasks.map(depTask => (
                            <li key={depTask.id}>
                                <label className="flex items-center gap-4 p-3 hover:bg-slate-700/50 cursor-pointer rounded-md">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded bg-slate-600 border-slate-500 text-cyan-500 focus:ring-cyan-500 transition flex-shrink-0"
                                        checked={selectedDependencies.includes(depTask.id)}
                                        onChange={() => handleToggleDependency(depTask.id)}
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 transition-colors duration-300">{depTask.name}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono transition-colors duration-300">{depTask.orderId}</p>
                                    </div>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <footer className="flex justify-end items-center gap-4 mt-6 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-600 hover:bg-slate-500 text-white">{t('actions.cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-cyan-600 hover:bg-cyan-500 text-white">{t('actions.saveChanges')}</button>
                </footer>
            </div>
        </div>
    );
};

export default DependencyManagerModal;