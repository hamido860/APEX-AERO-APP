
import React, { useState, useEffect } from 'react';
import { useLocalization } from '@/contexts/LocalizationContext';
import { Clock, Calendar, Coffee, Moon, Sun } from 'lucide-react';

interface ScheduleInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ScheduleInfoModal: React.FC<ScheduleInfoModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!isOpen) return null;

    const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-950 px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight uppercase transition-colors duration-300">{t('scheduleInfo.title') || 'Schedule Info'}</h2>
                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest transition-colors duration-300">{t('scheduleInfo.subtitle') || 'Operational Status'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-300"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Current Time Display */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center relative overflow-hidden group transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock className="w-24 h-24" />
                        </div>
                        <p className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 tabular-nums transition-colors duration-300">{formattedTime}</p>
                        <p className="text-xs font-bold text-cyan-500 uppercase tracking-[0.2em]">{formattedDate}</p>
                    </div>

                    {/* Schedule Details */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                                <Sun className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-300">{t('scheduleInfo.workingHours') || 'Standard Working Hours'}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-300">08:00 - 17:00 (9h Shift)</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                                <Coffee className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-300">{t('scheduleInfo.breaks') || 'Scheduled Breaks'}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-300">12:00 - 13:00 (Lunch Break)</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-300">10:15 - 10:30, 15:15 - 15:30 (Short Breaks)</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50">
                            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500 flex-shrink-0">
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 transition-colors duration-300">{t('scheduleInfo.nonWorking') || 'Non-Working Days'}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-300">Saturday & Sunday (Weekend)</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors duration-300">Public Holidays as per Regional Calendar</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-950 px-8 py-6 border-t border-slate-200 dark:border-slate-800 flex justify-end transition-colors">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                        {t('actions.close') || 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleInfoModal;
