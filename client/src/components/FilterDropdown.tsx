
import React, { useState, useRef, useEffect, useId } from 'react';

interface FilterDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (option: string) => void;
    getLabel?: (option: string) => string;
    icon?: React.ReactNode;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selected, onToggle, getLabel, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownId = useId();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = selected.length > 0;
    return (
        <div className="relative group/filter" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={isOpen ? dropdownId : undefined}
                aria-label={`Filter by ${label}`}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isActive 
                        ? 'text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300' 
                        : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
            >
                {icon || (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                )}
                {isActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow-sm">
                        {selected.length}
                    </span>
                )}
            </button>
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover/filter:opacity-100 group-hover/filter:visible transition-all duration-150 pointer-events-none z-50 shadow-lg">
                {label}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45"></div>
            </div>
            {isOpen && (
                <div id={dropdownId} className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 z-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">{label}</p>
                    <div className="max-h-60 overflow-y-auto pr-1">
                        {options.map(option => (
                            <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" checked={selected.includes(option)} onChange={() => onToggle(option)} />
                                <span className="text-sm text-slate-700 dark:text-slate-200">{getLabel ? getLabel(option) : option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
