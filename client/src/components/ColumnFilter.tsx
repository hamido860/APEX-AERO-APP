import React from 'react';

interface ColumnFilterProps {
  columnId: string;
  filters: any;
  onFilterChange: (filterType: string, value: any) => void;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({ columnId, filters, onFilterChange }) => {
  const handleClick = (e: React.MouseEvent) => e.stopPropagation();

  switch (columnId) {
    case 'task':
    case 'orderId':
    case 'assignedTo':
      return (
        <input
          type="text"
          placeholder=""
          value={filters[columnId] || ''}
          onChange={(e) => onFilterChange(columnId, e.target.value)}
          onClick={handleClick}
          className="mt-1 px-1 py-0.5 text-[8px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
          title={`Filter by ${columnId}`}
        />
      );

    case 'status':
      return (
        <select
          value={filters.status?.[0] || ''}
          onChange={(e) => onFilterChange('status', e.target.value ? [e.target.value] : [])}
          onClick={handleClick}
          className="mt-1 px-1 py-0.5 text-[8px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
          title="Filter by status"
        >
          <option value="">●</option>
          <option value="To Do">⊙</option>
          <option value="In Progress">◐</option>
          <option value="Completed">✓</option>
          <option value="On Hold">⏸</option>
          <option value="Quality OK">◆</option>
        </select>
      );

    case 'quality':
      return (
        <select
          value={filters.quality?.[0] || ''}
          onChange={(e) => onFilterChange('quality', e.target.value ? [e.target.value] : [])}
          onClick={handleClick}
          className="mt-1 px-1 py-0.5 text-[8px] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
          title="Filter by quality"
        >
          <option value="">◯</option>
          <option value="checked">✓</option>
          <option value="unchecked">✗</option>
        </select>
      );

    case 'progress':
      return (
        <div className="mt-1 flex flex-col gap-0.5 w-full">
          <input
            type="range"
            min="0"
            max="100"
            value={filters.progressMin || 0}
            onChange={(e) => onFilterChange('progressMin', parseInt(e.target.value))}
            onClick={handleClick}
            className="w-full h-1 bg-slate-300 dark:bg-slate-600 rounded appearance-none cursor-pointer"
            title="Min Progress"
          />
          <span className="text-[7px] text-slate-600 dark:text-slate-400 text-center" title={`Min: ${filters.progressMin || 0}%`}>⬤</span>
        </div>
      );

    case 'duration':
      return (
        <div className="mt-1 flex flex-col gap-0.5 w-full">
          <input
            type="range"
            min="0"
            max="24"
            value={filters.durationMin || 0}
            onChange={(e) => onFilterChange('durationMin', parseInt(e.target.value))}
            onClick={handleClick}
            className="w-full h-1 bg-slate-300 dark:bg-slate-600 rounded appearance-none cursor-pointer"
            title="Min Duration"
          />
          <span className="text-[7px] text-slate-600 dark:text-slate-400 text-center" title={`Min: ${filters.durationMin || 0}h`}>⏱</span>
        </div>
      );

    case 'realisation':
      return (
        <div className="mt-1 flex flex-col gap-0.5 w-full">
          <input
            type="range"
            min="0"
            max="24"
            value={filters.realisationMin || 0}
            onChange={(e) => onFilterChange('realisationMin', parseInt(e.target.value))}
            onClick={handleClick}
            className="w-full h-1 bg-slate-300 dark:bg-slate-600 rounded appearance-none cursor-pointer"
            title="Min Realisation"
          />
          <span className="text-[7px] text-slate-600 dark:text-slate-400 text-center" title={`Min: ${filters.realisationMin || 0}h`}>⏲</span>
        </div>
      );

    case 'dueBy':
      return (
        <div className="mt-1 flex flex-col gap-0.5 w-full">
          <input
            type="range"
            min="0"
            max="6"
            value={filters.dueByMin || 0}
            onChange={(e) => onFilterChange('dueByMin', parseInt(e.target.value))}
            onClick={handleClick}
            className="w-full h-1 bg-slate-300 dark:bg-slate-600 rounded appearance-none cursor-pointer"
            title="Min Due Day"
          />
          <span className="text-[7px] text-slate-600 dark:text-slate-400 text-center" title={`Min: ${filters.dueByMin || 0}d`}>📅</span>
        </div>
      );

    default:
      return null;
  }
};
