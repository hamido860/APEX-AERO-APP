
import React, { useState, useRef, useEffect, useId } from 'react';

interface FilterDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (option: string) => void;
    getLabel?: (option: string) => string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selected, onToggle, getLabel }) => {
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

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
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
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                aria-expanded={isOpen}
                aria-controls={isOpen ? dropdownId : undefined}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 ${
                    isActive 
                        ? 'bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 focus:ring-cyan-400' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-500'
                }`}
            >
                {label}
                {isActive && <span className="bg-cyan-700 text-white text-xs font-bold rounded-full px-2">{selected.length}</span>}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div id={dropdownId} className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl p-2 z-50">
                    <div className="max-h-60 overflow-y-auto pr-1">
                        {options.map(option => (
                            <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                <input type="checkbox" className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500" checked={selected.includes(option)} onChange={() => onToggle(option)} />
                                <span className="text-sm text-slate-700 dark:text-slate-200">{getLabel ? getLabel(option) : option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
