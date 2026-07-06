
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Task, Rank, MasterTask, getRank, ProficiencyOverrides, TaskStatus, RankSettings } from '@/types';
import { RANK_THEME } from '@/constants';
import { useLocalization } from '@/contexts/LocalizationContext';

const RankLegend: React.FC<{ hoveredRank: Rank | null; setHoveredRank: (rank: Rank | null) => void }> = ({ hoveredRank, setHoveredRank }) => {
    const { getRankNameWithCount } = useLocalization();
    return (
        <div className="flex items-center gap-x-6 gap-y-3 flex-wrap bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300" role="region" aria-label="Proficiency Rank Legend">
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">Legend:</h3>
            {Object.values(Rank).map(rank => {
                const theme = RANK_THEME[rank];
                const isDimmed = hoveredRank && hoveredRank !== rank;
                return (
                    <div 
                        key={rank} 
                        className={`flex items-center gap-2 cursor-pointer transition-opacity duration-200 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                        onMouseEnter={() => setHoveredRank(rank)}
                        onMouseLeave={() => setHoveredRank(null)}
                    >
                        <div className={`w-3 h-3 rounded-full shadow-sm ${theme.bg}`}></div>
                        <span className="text-xs font-medium text-slate-200">{getRankNameWithCount(rank)}</span>
                    </div>
                );
            })}
        </div>
    );
};

interface VersatilityGridProps {
    allOperators: string[];
    allTasks: Task[];
    masterTasks: MasterTask[];
    proficiencyOverrides: ProficiencyOverrides;
    onUpdateOverrides: (overrides: ProficiencyOverrides) => void;
    rankSettings: RankSettings;
}

export const VersatilityGrid: React.FC<VersatilityGridProps> = ({ allOperators, allTasks, masterTasks, proficiencyOverrides, onUpdateOverrides, rankSettings }) => {
    const { t, getRankName } = useLocalization();
    const [editingCell, setEditingCell] = useState<{ operator: string; taskName: string } | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [hoveredRank, setHoveredRank] = useState<Rank | null>(null);
    const [hoveredRow, setHoveredRow] = useState<string | null>(null);
    const [hoveredCol, setHoveredCol] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Optimized column widths for better readability
    const stickyColumnConfig = useMemo(() => [
        { id: 'program', width: 112, label: 'columns.program' },
        { id: 'subProgram', width: 112, label: 'columns.subProgram' },
        { id: 'taskName', width: 192, label: 'columns.task' },
    ], []);

    const stickyColumnOffsets = useMemo(() => {
        const offsets: { [key: string]: number } = {};
        let runningWidth = 0;
        for (const col of stickyColumnConfig) {
            offsets[col.id] = runningWidth;
            runningWidth += col.width;
        }
        return offsets;
    }, [stickyColumnConfig]);
    
    const { sortedMasterTasks, operatorRanks, programIsOddRow, groupStarts } = useMemo(() => {
        const sorted = [...masterTasks].sort((a, b) => {
            if (a.program < b.program) return -1;
            if (a.program > b.program) return 1;
            if (a.subProgram < b.subProgram) return -1;
            if (a.subProgram > b.subProgram) return 1;
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

        const ranks = new Map<string, Map<string, { count: number; rank: Rank }>>();
        allOperators.forEach(op => ranks.set(op, new Map()));

        // 1. Calculate from completed tasks
        const calculatedCounts: {[key: string]: number} = {};
        allTasks.forEach(task => {
            if (task.assignedTo && ranks.has(task.assignedTo) && (task.status === TaskStatus.Completed || task.status === TaskStatus.QualityOK)) {
                const key = `${task.assignedTo}::${task.name}`;
                calculatedCounts[key] = (calculatedCounts[key] || 0) + 1;
            }
        });

        allOperators.forEach(op => {
            const opRanks = ranks.get(op)!;
            sorted.forEach(mTask => {
                const key = `${op}::${mTask.name}`;
                const overrideCount = proficiencyOverrides[op]?.[mTask.name];
                const count = overrideCount !== undefined ? overrideCount : (calculatedCounts[key] || 0);

                opRanks.set(mTask.name, {
                    count: count,
                    rank: getRank(count, rankSettings)
                });
            });
        });

        const programGroups = Array.from(new Set(sorted.map(t => t.program)));
        const isOddMap = new Map<string, boolean>();
        programGroups.forEach((prog, index) => {
            isOddMap.set(prog, index % 2 !== 0);
        });

        const starts = {
            program: new Set<string>(),
            subProgram: new Set<string>()
        };
        let lastProg = '';
        let lastSub = '';
        sorted.forEach((t, i) => {
            const progKey = `${t.program}`;
            const subKey = `${t.program}::${t.subProgram}`;
            if (progKey !== lastProg) {
                starts.program.add(progKey + '::' + i);
                lastProg = progKey;
            }
            if (subKey !== lastSub) {
                starts.subProgram.add(subKey + '::' + i);
                lastSub = subKey;
            }
        });

        return { sortedMasterTasks: sorted, operatorRanks: ranks, programIsOddRow: isOddMap, groupStarts: starts };
    }, [allTasks, allOperators, masterTasks, proficiencyOverrides, rankSettings]);
    
    const handleEditSave = useCallback(() => {
        if (!editingCell) return;

        const { operator, taskName } = editingCell;
        const newCount = parseInt(editValue, 10);
        
        const newOverrides = JSON.parse(JSON.stringify(proficiencyOverrides || {}));

        if (!newOverrides[operator]) {
            newOverrides[operator] = {};
        }

        if (!isNaN(newCount) && newCount >= 0) {
            newOverrides[operator][taskName] = newCount;
        } else {
             // If the new count is invalid or empty, remove the override
            if (newOverrides[operator]?.[taskName] !== undefined) {
                delete newOverrides[operator][taskName];
                if (Object.keys(newOverrides[operator]).length === 0) {
                    delete newOverrides[operator];
                }
            }
        }

        onUpdateOverrides(newOverrides);
        setEditingCell(null);
    }, [editingCell, editValue, proficiencyOverrides, onUpdateOverrides]);

    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);
    
    const handleCellClick = useCallback((operator: string, taskName: string, currentCount: number) => {
        // If clicking a different cell while editing, save the previous one
        if (editingCell && (editingCell.operator !== operator || editingCell.taskName !== taskName)) {
            handleEditSave();
        }
        setEditingCell({ operator, taskName });
        setEditValue(String(currentCount));
    }, [editingCell, handleEditSave]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleEditSave();
        } else if (event.key === 'Escape') {
            setEditingCell(null);
        }
    }, [handleEditSave]);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
            <div className='p-4 border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-950/50 flex-shrink-0 transition-colors duration-300'>
                <RankLegend hoveredRank={hoveredRank} setHoveredRank={setHoveredRank} />
            </div>
            
            <div className="flex-grow overflow-auto custom-scrollbar relative" role="grid" aria-label="Versatility Matrix">
                <table className="min-w-full text-sm text-left text-slate-300 border-separate border-spacing-0">
                    <thead className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md transition-colors duration-300">
                        <tr>
                            {stickyColumnConfig.map((col) => (
                                <th 
                                    key={col.id}
                                    scope="col"
                                    style={{ left: `${stickyColumnOffsets[col.id]}px`, width: `${col.width}px`, minWidth: `${col.width}px`, maxWidth: `${col.width}px` }} 
                                    className="px-3 py-4 text-left text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest sticky top-0 z-50 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800/50 truncate transition-colors duration-300"
                                >
                                    {t(col.label)}
                                </th>
                            ))}
                            {allOperators.map(op => (
                                <th 
                                    key={op} 
                                    scope="col"
                                    onMouseEnter={() => setHoveredCol(op)}
                                    onMouseLeave={() => setHoveredCol(null)}
                                    className={`p-0 align-bottom text-center border-r border-b border-slate-200 dark:border-slate-800/50 transition-colors w-8 min-w-[2rem] ${hoveredCol === op ? 'bg-slate-100 dark:bg-slate-800' : ''}`} 
                                    title={op}
                                >
                                    <div className="h-40 flex items-center justify-center">
                                        <span className={`whitespace-nowrap font-bold text-[9px] uppercase tracking-widest transition-colors duration-300 ${hoveredCol === op ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                            {op}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 transition-colors duration-300">
                       {sortedMasterTasks.map((task, rowIndex) => {
                           const isOdd = programIsOddRow.get(task.program);
                           const groupBg = isOdd ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-950/50';
                           const isRowHovered = hoveredRow === task.name;

                           const showProgram = groupStarts.program.has(`${task.program}::${rowIndex}`);
                           const showSubProgram = groupStarts.subProgram.has(`${task.program}::${task.subProgram}::${rowIndex}`);

                           return (
                               <tr 
                                    key={task.name} 
                                    className={`group transition-colors ${isRowHovered ? 'bg-slate-100/40 dark:bg-slate-800/40' : ''}`}
                                    onMouseEnter={() => setHoveredRow(task.name)}
                                    onMouseLeave={() => setHoveredRow(null)}
                               >
                                   <td 
                                        style={{ left: `${stickyColumnOffsets.program}px`, width: `${stickyColumnConfig[0].width}px`, minWidth: `${stickyColumnConfig[0].width}px`, maxWidth: `${stickyColumnConfig[0].width}px` }} 
                                        className={`px-3 py-2 text-[10px] font-bold align-middle sticky z-30 border-r border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 truncate transition-colors ${showProgram ? 'text-slate-600 dark:text-slate-400' : 'text-transparent'}`}
                                   >
                                       {task.program}
                                   </td>
                                   <td 
                                        style={{ left: `${stickyColumnOffsets.subProgram}px`, width: `${stickyColumnConfig[1].width}px`, minWidth: `${stickyColumnConfig[1].width}px`, maxWidth: `${stickyColumnConfig[1].width}px` }} 
                                        className={`px-3 py-2 text-[10px] align-middle sticky z-30 border-r border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 truncate transition-colors ${showSubProgram ? 'text-slate-500 dark:text-slate-500' : 'text-transparent'}`}
                                   >
                                       {task.subProgram}
                                   </td>
                                   <td 
                                        style={{ left: `${stickyColumnOffsets.taskName}px`, width: `${stickyColumnConfig[2].width}px`, minWidth: `${stickyColumnConfig[2].width}px`, maxWidth: `${stickyColumnConfig[2].width}px` }} 
                                        className={`px-3 py-2 text-[11px] font-medium align-middle sticky z-30 border-r border-b border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900 truncate transition-colors ${isRowHovered ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}
                                        title={task.name}
                                   >
                                       {task.name}
                                   </td>
                                   
                                   {allOperators.map(op => {
                                       const rankData = operatorRanks.get(op)?.get(task.name) || { count: 0, rank: Rank.Unranked };
                                       const theme = RANK_THEME[rankData.rank];
                                       const isEditing = editingCell?.operator === op && editingCell?.taskName === task.name;
                                       const hasOverride = proficiencyOverrides[op]?.[task.name] !== undefined;
                                       const isDimmed = hoveredRank && hoveredRank !== rankData.rank;
                                       const isColHovered = hoveredCol === op;
                                       const isCellHighlighted = isRowHovered || isColHovered;

                                       return (
                                           <td 
                                                key={`${task.name}-${op}`} 
                                                className={`p-0 border-r border-b border-slate-200 dark:border-slate-800/30 text-center transition-colors ${groupBg} ${isColHovered ? 'bg-slate-200/50 dark:bg-slate-800/30' : ''}`}
                                                onMouseEnter={() => setHoveredCol(op)}
                                                onMouseLeave={() => setHoveredCol(null)}
                                            >
                                                {isEditing ? (
                                                    <input
                                                        ref={isEditing ? inputRef : null}
                                                        type="number"
                                                        min="0"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={handleEditSave}
                                                        onKeyDown={handleKeyDown}
                                                        aria-label={`Edit ${op} proficiency for ${task.name}`}
                                                        className={`w-full h-8 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-center text-sm font-bold border-2 rounded outline-none shadow-lg focus:ring-2 focus:ring-cyan-500/50 ${isNaN(parseInt(editValue)) ? 'border-red-500' : 'border-cyan-500 dark:border-cyan-400'}`}
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => handleCellClick(op, task.name, rankData.count)}
                                                        aria-label={`${op} - ${task.name}: ${rankData.count} completions, Rank: ${getRankName(rankData.rank)}`}
                                                        title={`${t('versatility.tooltip.operator')}: ${op}\n${t('versatility.tooltip.task')}: ${task.name}\n${t('versatility.tooltip.performed')}: ${rankData.count} ${t('versatility.tooltip.times')}\n${t('versatility.tooltip.rank')}: ${getRankName(rankData.rank)}`}
                                                        className={`
                                                            w-full h-8 flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 relative group/cell
                                                            ${rankData.count === 0 ? 'text-slate-800 hover:text-slate-600' : theme.text + ' hover:scale-110'}
                                                            ${isDimmed ? 'opacity-10 grayscale brightness-50' : 'opacity-100'}
                                                            ${isCellHighlighted && rankData.count > 0 ? 'brightness-125' : ''}
                                                        `}
                                                    >
                                                        {rankData.count > 0 ? (
                                                            <span>{rankData.count}</span>
                                                        ) : (
                                                            <span className="opacity-0 group-hover/cell:opacity-50">-</span>
                                                        )}
                                                        
                                                        {hasOverride && (
                                                            <div className="absolute top-1 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                                                        )}
                                                    </button>
                                                )}
                                           </td>
                                       );
                                   })}
                               </tr>
                           );
                       })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
