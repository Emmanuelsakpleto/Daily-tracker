import { useState, useCallback, useMemo, useEffect } from 'react';
import { format, subDays, eachDayOfInterval, startOfToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DEFAULT_HABITS, DEFAULT_PROFILE } from '../utils/constants';
import { supabase } from '../utils/supabase';

// Générateur d'ID compatible avec Supabase UUID
const generateId = () => crypto.randomUUID();

export function useTrackerData(session) {
    const [appData, setAppData] = useState({
        profile: DEFAULT_PROFILE,
        habits: DEFAULT_HABITS,
        scholarships: [],
        books: [],
        braindump: [],
        records: {}
    });
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialisation : Fetch 100% des données cloud
    useEffect(() => {
        const loadData = async () => {
            if (!session) return;
            setIsLoaded(false);

            try {
                const [
                    { data: habitsRes }, { data: booksRes },
                    { data: schoRes }, { data: brainRes }, { data: recsRes }
                ] = await Promise.all([
                    supabase.from('habits').select('*'),
                    supabase.from('books').select('*'),
                    supabase.from('scholarships').select('*'),
                    supabase.from('braindumps').select('*').order('created_at', { ascending: false }),
                    supabase.from('daily_records').select(`
                        *, todos(*), expenses(*), habit_completions(habit_id)
                    `)
                ]);

                // Structuration des données journalières relationnelles en un joli Json pour le Frontend
                const builtRecords = {};
                recsRes?.forEach(r => {
                    builtRecords[r.date] = {
                        id: r.id,
                        notes: r.notes || '',
                        mood: r.mood,
                        deepWorkMinutes: r.deep_work_minutes || 0,
                        finance: {
                            income: r.finance_income || '',
                            expense: r.finance_expense || '',
                            expensesList: r.expenses || []
                        },
                        todos: r.todos || [],
                        habits: r.habit_completions?.map(hc => hc.habit_id) || []
                    };
                });

                // Remplissage si vide
                if (!habitsRes || habitsRes.length === 0) {
                    // Injecting defaults to Supabase if fresh account
                    for (const h of DEFAULT_HABITS) {
                        await supabase.from('habits').insert({ id: h.id, title: h.title, category: h.category });
                    }
                }

                setAppData({
                    profile: DEFAULT_PROFILE, // À lier à la table profiles plus tard si modifié
                    habits: habitsRes?.length > 0 ? habitsRes : DEFAULT_HABITS,
                    books: booksRes?.map(b => ({ ...b, readPages: b.read_pages, totalPages: b.total_pages })) || [],
                    scholarships: schoRes || [],
                    braindump: brainRes?.map(b => ({ id: b.id, text: b.text, createdAt: b.created_at })) || [],
                    records: builtRecords
                });
            } catch (err) {
                console.error("Erreur de synchro Cloud :", err);
            }
            setIsLoaded(true);
        };
        loadData();
    }, [session]);

    // Outil interne : Mise à jour Frontend instantanée (Optimistic Save)
    const updateRecordLocal = useCallback((dateStr, updates) => {
        setAppData(prev => {
            const rec = prev.records[dateStr] || { habits: [], todos: [], notes: '', mood: null, deepWorkMinutes: 0, finance: { income: '', expense: '', expensesList: [] } };
            return { ...prev, records: { ...prev.records, [dateStr]: { ...rec, ...updates } } };
        });
    }, []);

    // Outil interne : Garantit l'existence du jour sur Supabase avant d'insérer des relations (todos, achats, etc)
    const _ensureRecordId = async (dateStr) => {
        if (appData.records[dateStr]?.id) return appData.records[dateStr].id;
        const { data } = await supabase
            .from('daily_records')
            .upsert({ user_id: session?.user?.id, date: dateStr }, { onConflict: 'user_id, date' })
            .select('id').single();

        if (data) {
            updateRecordLocal(dateStr, { id: data.id });
            return data.id;
        }
        return null;
    };

    const toggleHabit = useCallback(async (dateStr, habitId) => {
        const currentRecord = appData.records[dateStr] || { habits: [] };
        const hasHabit = currentRecord.habits.includes(habitId);
        const newHabits = hasHabit ? currentRecord.habits.filter(h => h !== habitId) : [...currentRecord.habits, habitId];

        // 1. Frontend Save Instantané
        updateRecordLocal(dateStr, { habits: newHabits });

        // 2. Cloud Sync Invisible
        const recId = await _ensureRecordId(dateStr);
        if (!recId) return;

        if (hasHabit) await supabase.from('habit_completions').delete().match({ record_id: recId, habit_id: habitId });
        else await supabase.from('habit_completions').insert({ record_id: recId, habit_id: habitId });
    }, [appData, updateRecordLocal, session]);

    const addTodo = useCallback(async (dateStr, text) => {
        if (!text) return;
        const currentRecord = appData.records[dateStr] || { todos: [] };
        const newTodo = { id: generateId(), text, done: false };
        updateRecordLocal(dateStr, { todos: [...currentRecord.todos, newTodo] });

        const recId = await _ensureRecordId(dateStr);
        if (recId) await supabase.from('todos').insert({ id: newTodo.id, record_id: recId, text, done: false });
    }, [appData, updateRecordLocal, session]);

    const toggleTodo = useCallback(async (dateStr, todoId) => {
        const currentRecord = appData.records[dateStr] || { todos: [] };
        const todo = currentRecord.todos.find(t => t.id === todoId);
        if (!todo) return;
        updateRecordLocal(dateStr, { todos: currentRecord.todos.map(t => t.id === todoId ? { ...t, done: !t.done } : t) });
        await supabase.from('todos').update({ done: !todo.done }).eq('id', todoId);
    }, [appData, updateRecordLocal]);

    const deleteTodo = useCallback(async (dateStr, todoId) => {
        const currentRecord = appData.records[dateStr] || { todos: [] };
        updateRecordLocal(dateStr, { todos: currentRecord.todos.filter(t => t.id !== todoId) });
        await supabase.from('todos').delete().eq('id', todoId);
    }, [appData, updateRecordLocal]);

    const saveNote = useCallback(async (dateStr, notes) => {
        updateRecordLocal(dateStr, { notes });
        const recId = await _ensureRecordId(dateStr);
        if (recId) await supabase.from('daily_records').update({ notes }).eq('id', recId);
    }, [updateRecordLocal, session]);

    const saveMood = useCallback(async (dateStr, mood) => {
        updateRecordLocal(dateStr, { mood });
        const recId = await _ensureRecordId(dateStr);
        if (recId) await supabase.from('daily_records').update({ mood }).eq('id', recId);
    }, [updateRecordLocal, session]);

    const saveDeepWork = useCallback(async (dateStr, minutes) => {
        const rec = appData.records[dateStr] || { deepWorkMinutes: 0 };
        const newVal = (rec.deepWorkMinutes || 0) + minutes;
        updateRecordLocal(dateStr, { deepWorkMinutes: newVal });
        const recId = await _ensureRecordId(dateStr);
        if (recId) await supabase.from('daily_records').update({ deep_work_minutes: newVal }).eq('id', recId);
    }, [appData, updateRecordLocal, session]);

    const saveFinance = useCallback(async (dateStr, type, value) => {
        const currentRecord = appData.records[dateStr] || { finance: { income: '', expense: '', expensesList: [] } };
        const numValue = value === '' ? null : Number(value);
        updateRecordLocal(dateStr, { finance: { ...(currentRecord.finance || { income: '', expense: '', expensesList: [] }), [type]: numValue || '' } });

        const recId = await _ensureRecordId(dateStr);
        if (recId) {
            const field = type === 'income' ? 'finance_income' : 'finance_expense';
            await supabase.from('daily_records').update({ [field]: numValue }).eq('id', recId);
        }
    }, [appData, updateRecordLocal, session]);

    const addCategorizedExpense = useCallback(async (dateStr, amount, category) => {
        const currentRecord = appData.records[dateStr] || { finance: { income: '', expense: '', expensesList: [] } };
        const fin = currentRecord.finance || { income: '', expense: '', expensesList: [] };
        const newExpense = { id: generateId(), amount: Number(amount), category };

        updateRecordLocal(dateStr, { finance: { ...fin, expensesList: [...(fin.expensesList || []), newExpense] } });

        const recId = await _ensureRecordId(dateStr);
        if (recId) await supabase.from('expenses').insert({ id: newExpense.id, record_id: recId, amount: newExpense.amount, category });
    }, [appData, updateRecordLocal, session]);

    const deleteCategorizedExpense = useCallback(async (dateStr, id) => {
        const currentRecord = appData.records[dateStr] || { finance: { income: '', expense: '', expensesList: [] } };
        const fin = currentRecord.finance || { income: '', expense: '', expensesList: [] };
        updateRecordLocal(dateStr, { finance: { ...fin, expensesList: (fin.expensesList || []).filter(e => e.id !== id) } });
        await supabase.from('expenses').delete().eq('id', id);
    }, [appData, updateRecordLocal]);

    const saveBook = useCallback(async (bookData, isEdit) => {
        const newId = isEdit ? bookData.id : generateId();
        const payload = { id: newId, title: bookData.title, author: bookData.author, read_pages: bookData.readPages || 0, total_pages: bookData.totalPages || 1 };

        setAppData(prev => {
            const newBooks = isEdit
                ? prev.books.map(book => book.id === newId ? { ...book, ...bookData } : book)
                : [...prev.books, { ...bookData, id: newId }];
            return { ...prev, books: newBooks };
        });

        if (isEdit) await supabase.from('books').update(payload).eq('id', newId);
        else await supabase.from('books').insert(payload);
    }, []);

    const deleteBook = useCallback(async (id) => {
        setAppData(p => ({ ...p, books: p.books.filter(b => b.id !== id) }));
        await supabase.from('books').delete().eq('id', id);
    }, []);

    const updateBookProgress = useCallback(async (id, newPages) => {
        let maxPages = 1;
        setAppData(p => ({
            ...p, books: p.books.map(b => {
                if (b.id === id) { maxPages = b.totalPages; return { ...b, readPages: Math.min(b.totalPages, Math.max(0, newPages)) }; }
                return b;
            })
        }));
        await supabase.from('books').update({ read_pages: Math.min(maxPages, Math.max(0, newPages)) }).eq('id', id);
    }, []);

    const saveBraindumpNote = useCallback(async (text) => {
        const newNote = { id: generateId(), text, createdAt: new Date().toISOString() };
        setAppData(p => ({ ...p, braindump: [newNote, ...(p.braindump || [])] }));
        await supabase.from('braindumps').insert({ id: newNote.id, text: newNote.text });
    }, []);

    const deleteBraindumpNote = useCallback(async (id) => {
        setAppData(p => ({ ...p, braindump: (p.braindump || []).filter(item => item.id !== id) }));
        await supabase.from('braindumps').delete().eq('id', id);
    }, []);

    const saveScholarship = useCallback(async (scholarshipData, isEdit) => {
        const newId = isEdit ? scholarshipData.id : generateId();
        const payload = { id: newId, name: scholarshipData.name, status: scholarshipData.status };
        setAppData(prev => {
            const newScho = isEdit
                ? prev.scholarships.map(x => x.id === newId ? { ...x, ...scholarshipData } : x)
                : [...prev.scholarships, { ...scholarshipData, id: newId }];
            return { ...prev, scholarships: newScho };
        });
        if (isEdit) await supabase.from('scholarships').update(payload).eq('id', newId);
        else await supabase.from('scholarships').insert(payload);
    }, []);

    const deleteScholarship = useCallback(async (id) => {
        setAppData(p => ({ ...p, scholarships: p.scholarships.filter(s => s.id !== id) }));
        await supabase.from('scholarships').delete().eq('id', id);
    }, []);

    const importData = () => false; // Désactivé vu que l'on est dans le cloud

    // Analyses et Statistiques dérivées (identiques à l'original)
    const today = startOfToday();
    const last7Days = useMemo(() => eachDayOfInterval({ start: subDays(today, 6), end: today }), [today]);

    const chartData = useMemo(() => {
        return last7Days.map(d => {
            const rec = appData.records[format(d, 'yyyy-MM-dd')];
            const nbH = rec ? Math.min(rec.habits?.length || 0, appData.habits.length) : 0;
            return {
                name: format(d, 'EEE', { locale: fr }),
                score: appData.habits.length > 0 ? Math.round((nbH / appData.habits.length) * 100) : 0,
                deepWork: rec?.deepWorkMinutes || 0
            };
        });
    }, [appData.records, appData.habits, last7Days]);

    const neglectedHabits = useMemo(() => {
        const todayStr = format(today, 'yyyy-MM-dd');
        const todayRecord = appData.records[todayStr];
        const doneHabits = todayRecord?.habits || [];
        return appData.habits.filter(h => !doneHabits.includes(h.id));
    }, [appData.records, appData.habits, today]);

    const financialStats = useMemo(() => {
        let income = 0; let expense = 0; let totalDeepWork = 0;
        const expensesByCategory = {};

        Object.values(appData.records).forEach(rec => {
            totalDeepWork += (rec.deepWorkMinutes || 0);
            if (rec.finance) {
                if (rec.finance.income) income += Number(rec.finance.income);
                if (rec.finance.expense) expense += Number(rec.finance.expense);
                if (rec.finance.expensesList) {
                    rec.finance.expensesList.forEach(ex => {
                        expense += Number(ex.amount);
                        expensesByCategory[ex.category] = (expensesByCategory[ex.category] || 0) + Number(ex.amount);
                    });
                }
            }
        });

        const pieData = Object.keys(expensesByCategory).map(key => ({
            name: key, value: expensesByCategory[key]
        })).filter(item => item.value > 0);

        return { income, expense, net: income - expense, totalDeepWork, expensesByCategory: pieData };
    }, [appData.records]);

    return {
        appData, isLoaded, setAppData, importData,
        toggleHabit, addTodo, toggleTodo, deleteTodo, saveNote, saveMood, saveFinance, addCategorizedExpense, deleteCategorizedExpense, saveDeepWork,
        saveBook, deleteBook, updateBookProgress,
        saveBraindumpNote, deleteBraindumpNote,
        saveScholarship, deleteScholarship,
        last7Days, chartData, neglectedHabits, financialStats
    };
}
