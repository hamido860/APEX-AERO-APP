
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { TaskStatus, Rank } from '@/types';

type TranslationKeys = {
    [key: string]: any;
};

interface LocalizationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, ...args: any[]) => any;
  getDaysOfWeek: (format: 'long' | 'short') => string[];
  getTaskStatusName: (status: TaskStatus) => string;
  getRankName: (rank: Rank) => string;
  getRankNameWithCount: (rank: Rank) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string>(() => {
        return localStorage.getItem('app-language') || 'en';
    });
    const [translations, setTranslations] = useState<TranslationKeys | null>(null);

    useEffect(() => {
        const fetchTranslations = async () => {
            try {
                const response = await fetch(`/locales/${language}.json`);
                if (!response.ok) {
                    throw new Error(`Could not load ${language}.json`);
                }
                const data = await response.json();
                setTranslations(data);
            } catch (error) {
                console.error('Failed to fetch translations:', error);
                if (language !== 'en') {
                  setLanguage('en');
                } else if (!translations) {
                   // If English fails on first load, set an empty object to avoid a blank screen.
                   setTranslations({});
                }
            }
        };
        fetchTranslations();
    }, [language]);

    const handleSetLanguage = (lang: string) => {
        localStorage.setItem('app-language', lang);
        setLanguage(lang);
    };

    const t = useCallback((key: string, ...args: any[]): any => {
        if (!translations) return key;

        const keys = key.split('.');
        let result: any = translations;
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                return key;
            }
        }
        
        if (typeof result === 'string') {
            return result.replace(/{(\d+)}/g, (match, number) => {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        }
        
        return result;
    }, [translations]);

    const getDaysOfWeek = useCallback((format: 'long' | 'short' = 'long'): string[] => {
        const days = t(`days.${format}`);
        return Array.isArray(days) ? days : [];
    }, [t]);

    const getTaskStatusName = useCallback((status: TaskStatus) => {
        const key = status.replace(/\s/g, ''); // "To Do" -> "ToDo"
        return t(`taskStatus.${key}`);
    }, [t]);

    const getRankName = useCallback((rank: Rank) => {
        return t(`rank.${rank}`);
    }, [t]);

    const getRankNameWithCount = useCallback((rank: Rank) => {
        return t(`rankWithCount.${rank}`);
    }, [t]);

    const value = {
        language,
        setLanguage: handleSetLanguage,
        t,
        getDaysOfWeek,
        getTaskStatusName,
        getRankName,
        getRankNameWithCount,
    };

    return (
        <LocalizationContext.Provider value={value}>
            {translations ? children : null}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = (): LocalizationContextType => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error('useLocalization must be used within a LocalizationProvider');
    }
    return context;
};
