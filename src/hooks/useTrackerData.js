import { useState, useCallback, useMemo } from 'react';
import { format, subDays, eachDayOfInterval, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DEFAULT_HABITS, DEFAULT_PROFILE } from '../utils/constants';

export function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (e) {
            return initialValue;
        }
    });

    const setValue = value => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (e) {
            console.error(e);
        }
    };
    return [storedValue, setValue];
}

export function useTrackerData() {
    const [appData, setAppData] = useLocalStorage('tracker_data_v2', {
        profile: DEFAULT_PROFILE,
        habits: DEFAULT_HABITS,
        scholarships: [],
        books: [],
        records: {} // { 'YYYY-MM-DD': { habits: ['h1'], todos: [], notes: '', finance: { income: '', expense: '' } } }
    });

    const updateRecord = useCallback((dateStr, updates) => {
        setAppData(prev => {
            const rec = prev.records[dateStr] || { habits: [], todos: [], notes: '', mood: null, deepWorkMinutes: 0, finance: { income: '', expense: '', expensesList: [] } };
            return {
                ...prev,
                records: {
                    ...prev.records,
                    [dateStr]: { ...rec, ...updates }
                }
            };
        });
    }, [setAppData]);

    const importData = useCallback((jsonData) => {
        try {
            const parsed = JSON.parse(jsonData);
            if (parsed.profile && parsed.habits) {
                setAppData(parsed);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }, [setAppData]);

    const toggleHabit = useCallback((dateStr, habitId) => {
        const currentRecord = appData.records[dateStr] || { habits: [], todos: [], notes: '', finance: { income: '', expense: '' } };
        const newHabits = currentRecord.habits.includes(habitId)
            ? currentRecord.habits.filter(h => h !== habitId)
            : [...currentRecord.habits, habitId];
        updateRecord(dateStr, { habits: newHabits });
    }, [appData, updateRecord]);

    const addTodo = useCallback((dateStr, text) => {
        if (!text) return;
        const currentRecord = appData.records[dateStr] || { habits: [], todos: [], notes: '', finance: { income: '', expense: '' } };
        updateRecord(dateStr, { todos: [...currentRecord.todos, { id: Date.now(), text, done: false }] });
    }, [appData, updateRecord]);

    const toggleTodo = useCallback((dateStr, todoId) => {
        const currentRecord = appData.records[dateStr] || { habits: [], todos: [], notes: '', finance: { income: '', expense: '' } };
        updateRecord(dateStr, { todos: currentRecord.todos.map(t => t.id === todoId ? { ...t, done: !t.done } : t) });
    }, [appData, updateRecord]);

    const deleteTodo = useCallback((dateStr, todoId) => {
        const currentRecord = appData.records[dateStr] || { habits: [], todos: [], notes: '', finance: { income: '', expense: '' } };
        updateRecord(dateStr, { todos: currentRecord.todos.filter(t => t.id !== todoId) });
    }, [appData, updateRecord]);

    const saveNote = useCallback((dateStr, notes) => {
        updateRecord(dateStr, { notes });
    }, [updateRecord]);

    const saveMood = useCallback((dateStr, mood) => {
        updateRecord(dateStr, { mood });
    }, [updateRecord]);

    const saveDeepWork = useCallback((dateStr, minutes) => {
        setAppData(prev => {
            const rec = prev.records[dateStr] || { habits: [], todos: [], notes: '', mood: null, deepWorkMinutes: 0, finance: { income: '', expense: '', expensesList: [] } };
            const currentTotal = rec.deepWorkMinutes || 0;
            return {
                ...prev,
                records: {
                    ...prev.records,
                    [dateStr]: { ...rec, deepWorkMinutes: currentTotal + minutes }
                }
            };
        });
    }, [setAppData]);

    const saveFinance = useCallback((dateStr, type, value) => {
        const currentRecord = appData.records[dateStr] || { habits: [], todos: [], notes: '', mood: null, deepWorkMinutes: 0, finance: { income: '', expense: '', expensesList: [] } };
        const numValue = value === '' ? '' : Number(value);
        updateRecord(dateStr, { finance: { ...(currentRecord.finance || { income: '', expense: '', expensesList: [] }), [type]: numValue } });
    }, [appData, updateRecord]);

    const addCategorizedExpense = useCallback((dateStr, amount, category) => {
        const currentRecord = appData.records[dateStr] || { habits: [], todos: [], notes: '', mood: null, deepWorkMinutes: 0, finance: { income: '', expense: '', expensesList: [] } };
        const fin = currentRecord.finance || { income: '', expense: '', expensesList: [] };
        const list = fin.expensesList || [];
        updateRecord(dateStr, { finance: { ...fin, expensesList: [...list, { id: Date.now(), amount: Number(amount), category }] } });
    }, [appData, updateRecord]);

    const deleteCategorizedExpense = useCallback((dateStr, id) => {
        const currentRecord = appData.records[dateStr] || { habits: [], todos: [], notes: '', mood: null, deepWorkMinutes: 0, finance: { income: '', expense: '', expensesList: [] } };
        const fin = currentRecord.finance || { income: '', expense: '', expensesList: [] };
        const list = fin.expensesList || [];
        updateRecord(dateStr, { finance: { ...fin, expensesList: list.filter(e => e.id !== id) } });
    }, [appData, updateRecord]);

    const saveBook = useCallback((bookData, isEdit) => {
        setAppData(prev => {
            const newBooks = isEdit
                ? prev.books.map(book => book.id === bookData.id ? { ...book, ...bookData } : book)
                : [...prev.books, { id: Date.now(), ...bookData }];
            return { ...prev, books: newBooks };
        });
    }, [setAppData]);

    const deleteBook = useCallback((id) => setAppData(p => ({ ...p, books: p.books.filter(b => b.id !== id) })), [setAppData]);

    const updateBookProgress = useCallback((id, newPages) => {
        setAppData(p => ({
            ...p, books: p.books.map(b => b.id === id ? { ...b, readPages: Math.min(b.totalPages, Math.max(0, newPages)) } : b)
        }));
    }, [setAppData]);

    const saveScholarship = useCallback((scholarshipData, isEdit) => {
        setAppData(prev => {
            const newScho = isEdit
                ? prev.scholarships.map(x => x.id === scholarshipData.id ? { ...x, ...scholarshipData } : x)
                : [...prev.scholarships, { id: Date.now(), ...scholarshipData }];
            return { ...prev, scholarships: newScho };
        });
    }, [setAppData]);

    const deleteScholarship = useCallback((id) => setAppData(p => ({ ...p, scholarships: p.scholarships.filter(s => s.id !== id) })), [setAppData]);

    // Derived stats
    const today = startOfToday();
    const last7Days = useMemo(() => eachDayOfInterval({ start: subDays(today, 6), end: today }), [today]);

    const chartData = useMemo(() => {
        return last7Days.map(d => {
            const rec = appData.records[format(d, 'yyyy-MM-dd')];
            const nbH = rec ? Math.min(rec.habits.length, appData.habits.length) : 0;
            return {
                name: format(d, 'EEE', { locale: fr }),
                score: appData.habits.length > 0 ? Math.round((nbH / appData.habits.length) * 100) : 0,
                deepWork: rec?.deepWorkMinutes || 0
            };
        });
    }, [appData.records, appData.habits, last7Days]);

    const neglectedHabits = useMemo(() => {
        const counts = {};
        appData.habits.forEach(h => counts[h.id] = 0);
        last7Days.forEach(d => {
            const rec = appData.records[format(d, 'yyyy-MM-dd')];
            if (rec) rec.habits.forEach(hId => { counts[hId] = counts[hId] ? counts[hId] + 1 : 1 });
        });
        return appData.habits.filter(h => counts[h.id] <= 1);
    }, [appData.records, appData.habits, last7Days]);

    const financialStats = useMemo(() => {
        let income = 0; let expense = 0;
        let totalDeepWork = 0;
        const expensesByCategory = {};

        Object.values(appData.records).forEach(rec => {
            totalDeepWork += (rec.deepWorkMinutes || 0);
            if (rec.finance) {
                if (rec.finance.income) income += Number(rec.finance.income);

                // If legacy flat expense field
                if (rec.finance.expense) {
                    expense += Number(rec.finance.expense);
                }

                // Add up categorized expenses
                if (rec.finance.expensesList) {
                    rec.finance.expensesList.forEach(ex => {
                        expense += Number(ex.amount);
                        expensesByCategory[ex.category] = (expensesByCategory[ex.category] || 0) + Number(ex.amount);
                    });
                }
            }
        });

        // Prepare pie chart data
        const pieData = Object.keys(expensesByCategory).map(key => ({
            name: key,
            value: expensesByCategory[key]
        })).filter(item => item.value > 0);

        return { income, expense, net: income - expense, totalDeepWork, expensesByCategory: pieData };
    }, [appData.records]);

    return {
        appData, setAppData, importData,
        toggleHabit, addTodo, toggleTodo, deleteTodo, saveNote, saveMood, saveFinance, addCategorizedExpense, deleteCategorizedExpense, saveDeepWork,
        saveBook, deleteBook, updateBookProgress,
        saveScholarship, deleteScholarship,
        last7Days, chartData, neglectedHabits, financialStats
    };
}
