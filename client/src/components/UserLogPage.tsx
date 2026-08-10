
import React, { useState, useMemo, useEffect } from 'react';
import { Task, MasterTask, ProficiencyOverrides, RankSettings, Rank } from '@/types';
import { VersatilityGrid } from './VersatilityGrid';
import { useLocalization } from '@/contexts/LocalizationContext';
import { AddTaskModal } from './AddTaskModal';

interface SettingsModalProps {
    onClose: () => void;
    onSave: (settings: RankSettings) => void;
    currentSettings: RankSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSave, currentSettings }) => {
    const { t, getRankName } = useLocalization();
    const [settings, setSettings] = useState<RankSettings>(currentSettings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    };

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 transform transition-all scale-100 transition-colors duration-300"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 transition-colors duration-300">{t('settingsModal.title')}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">{t('settingsModal.description')}</p>
                    
                    <div className="space-y-4">
                        {(Object.keys(currentSettings) as Array<keyof RankSettings>).map(rankKey => (
                             <div key={rankKey} className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-slate-300 capitalize" htmlFor={rankKey}>{getRankName(rankKey.charAt(0).toUpperCase() + rankKey.slice(1) as Rank)}</label>
                                <input type="number" id={rankKey} name={rankKey} value={settings[rankKey]} onChange={handleChange} min="1" className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all" />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-slate-700 hover:bg-slate-600 text-white">{t('actions.cancel')}</button>
                        <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-bold rounded-lg transition-colors bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30">{t('settingsModal.save')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface UserLogPageProps {
  allOperators: string[];
  allTasks: Task[];
  masterTasks: MasterTask[];
  onUpdateMasterTasks: (tasks: MasterTask[]) => void;
  proficiencyOverrides: ProficiencyOverrides;
  onUpdateOverrides: (overrides: ProficiencyOverrides) => void;
  rankSettings: RankSettings;
  onUpdateRankSettings: (settings: RankSettings) => void;
  pendingOverrides: ProficiencyOverrides;
  onUpdatePendingOverrides: (overrides: ProficiencyOverrides) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  isAddTaskModalOpen: boolean;
  setIsAddTaskModalOpen: (isOpen: boolean) => void;
}

const FilterCheckbox: React.FC<{ label: string, isChecked: boolean, onChange: () => void }> = ({ label, isChecked, onChange }) => (
    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors group">
        <input
            type="checkbox"
            className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 transition group-hover:border-cyan-500"
            checked={isChecked}
            onChange={onChange}
        />
        <span className="text-sm text-slate-300 group-hover:text-white truncate" title={label}>{label}</span>
    </label>
);


const UserLogPage: React.FC<UserLogPageProps> = ({ 
    allOperators, allTasks, masterTasks, onUpdateMasterTasks, 
    proficiencyOverrides, onUpdateOverrides, rankSettings, onUpdateRankSettings,
    pendingOverrides, onUpdatePendingOverrides,
    isSettingsModalOpen, setIsSettingsModalOpen,
    isAddTaskModalOpen, setIsAddTaskModalOpen
}) => {
  const { t } = useLocalization();
  
  const [programSearch, setProgramSearch] = useState('');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  
  const handleAddTask = (newTask: MasterTask) => {
      onUpdateMasterTasks([...masterTasks, newTask]);
  };

  const uniquePrograms = useMemo(() => Array.from(new Set(masterTasks.map(mt => mt.program))), [masterTasks]);
  
  const handleProgramFilterChange = (program: string) => {
    setSelectedPrograms(prev => 
        prev.includes(program) ? prev.filter(p => p !== program) : [...prev, program]
    );
  };

  const handleOperatorFilterChange = (operator: string) => {
      setSelectedOperators(prev => 
          prev.includes(operator) ? prev.filter(o => o !== operator) : [...prev, operator]
      );
  };

  const clearFilters = () => {
      setProgramSearch('');
      setOperatorSearch('');
      setSelectedPrograms([]);
      setSelectedOperators([]);
  };

  const hasActiveFilters = selectedPrograms.length > 0 || selectedOperators.length > 0;

  const filteredMasterTasks = useMemo(() => {
      if (selectedPrograms.length === 0) return masterTasks;
      return masterTasks.filter(task => selectedPrograms.includes(task.program));
  }, [masterTasks, selectedPrograms]);

  const filteredOperators = useMemo(() => {
      if (selectedOperators.length === 0) return allOperators;
      return allOperators.filter(op => selectedOperators.includes(op));
  }, [allOperators, selectedOperators]);

  const searchedPrograms = useMemo(() =>
      uniquePrograms.filter(p => p.toLowerCase().includes(programSearch.toLowerCase()))
  , [uniquePrograms, programSearch]);

  const searchedOperators = useMemo(() =>
      allOperators.filter(op => op.toLowerCase().includes(operatorSearch.toLowerCase()))
  , [allOperators, operatorSearch]);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col p-6 overflow-hidden transition-colors duration-300">
      <div className="flex-grow flex gap-6 overflow-hidden">
        {/* Filter Panel */}
        <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col gap-6 border border-slate-200 dark:border-slate-700 shadow-md transition-colors duration-300">
          <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t('userlog.filters.title')}</h3>
              { hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">
                      {t('actions.clearAll')}
                  </button>
              )}
          </div>

          {/* Program Filter */}
          <div className="flex-1 flex flex-col min-h-0">
              <h4 className="font-semibold text-slate-600 dark:text-slate-400 text-xs mb-2 px-1 uppercase transition-colors duration-300">{t('userlog.filters.byProgram')}</h4>
              <div className="relative mb-2">
                  <input
                      type="search"
                      placeholder={t('userlog.filters.searchPrograms')}
                      value={programSearch}
                      onChange={(e) => setProgramSearch(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
              </div>
              <div className="space-y-0.5 overflow-y-auto pr-1 custom-scrollbar">
                  {searchedPrograms.map(prog => (
                      <FilterCheckbox
                          key={prog}
                          label={prog}
                          isChecked={selectedPrograms.includes(prog)}
                          onChange={() => handleProgramFilterChange(prog)}
                      />
                  ))}
              </div>
          </div>

          {/* Operator Filter */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-slate-700 pt-4">
              <h4 className="font-semibold text-slate-600 dark:text-slate-400 text-xs mb-2 px-1 uppercase transition-colors duration-300">{t('userlog.filters.byOperator')}</h4>
              <div className="relative mb-2">
                  <input
                      type="search"
                      placeholder={t('userlog.filters.searchOperators')}
                      value={operatorSearch}
                      onChange={(e) => setOperatorSearch(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
              </div>
              <div className="space-y-0.5 overflow-y-auto pr-1 custom-scrollbar">
                  {searchedOperators.map(op => (
                      <FilterCheckbox
                          key={op}
                          label={op}
                          isChecked={selectedOperators.includes(op)}
                          onChange={() => handleOperatorFilterChange(op)}
                      />
                  ))}
              </div>
          </div>
        </aside>

        <main className="flex-grow flex flex-col overflow-hidden min-w-0">
          <VersatilityGrid 
              allOperators={filteredOperators} 
              allTasks={allTasks} 
              masterTasks={filteredMasterTasks}
              proficiencyOverrides={pendingOverrides}
              onUpdateOverrides={onUpdatePendingOverrides}
              rankSettings={rankSettings}
          />
        </main>
      </div>
      {isAddTaskModalOpen && <AddTaskModal onClose={() => setIsAddTaskModalOpen(false)} onAddTask={handleAddTask} existingPrograms={uniquePrograms} masterTasks={masterTasks} />}
      {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} onSave={onUpdateRankSettings} currentSettings={rankSettings} />}
    </div>
  );
};

export default UserLogPage;
