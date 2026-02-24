import React, { useState } from 'react';
import { startOfToday } from 'date-fns';
import { AnimatePresence } from 'framer-motion';

import { useTrackerData } from './hooks/useTrackerData';
import Sidebar from './components/layout/Sidebar';
import CalendarView from './components/views/CalendarView';
import JournalView from './components/views/JournalView';
import DashboardView from './components/views/DashboardView';
import LibraryView from './components/views/LibraryView';
import ScholarshipsView from './components/views/ScholarshipsView';
import SettingsView from './components/views/SettingsView';
import DeepWorkView from './components/views/DeepWorkView';

const containerVars = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
};

const App = () => {
  const [activeTab, setActiveTab] = useState('journal');
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState(today);

  const trackerData = useTrackerData();
  const {
    appData,
    setAppData, importData,
    toggleHabit, saveNote, saveMood, addTodo, toggleTodo, deleteTodo, saveFinance, addCategorizedExpense, deleteCategorizedExpense, saveDeepWork,
    saveBook, deleteBook, updateBookProgress,
    saveScholarship, deleteScholarship,
    last7Days, chartData, neglectedHabits, financialStats
  } = trackerData;

  return (
    <div className="app-container">
      {/* --- SIDEBAR --- */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelectedDate={setSelectedDate}
        today={today}
        profile={appData.profile}
      />

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        <AnimatePresence mode="wait">

          {/* 1. FULL CALENDAR */}
          {activeTab === 'calendar' && (
            <CalendarView
              key="calendar"
              containerVars={containerVars}
              appData={appData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setActiveTab={setActiveTab}
              today={today}
            />
          )}

          {/* 2. JOURNAL (Day Specific) */}
          {activeTab === 'journal' && (
            <JournalView
              key="journal"
              containerVars={containerVars}
              appData={appData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              today={today}
              toggleHabit={toggleHabit}
              saveNote={saveNote}
              addTodo={addTodo}
              toggleTodo={toggleTodo}
              deleteTodo={deleteTodo}
              saveFinance={saveFinance}
              saveMood={saveMood}
              addCategorizedExpense={addCategorizedExpense}
              deleteCategorizedExpense={deleteCategorizedExpense}
            />
          )}

          {/* 3. DEEP WORK */}
          {activeTab === 'deepwork' && (
            <DeepWorkView
              key="deepwork"
              containerVars={containerVars}
              saveDeepWork={saveDeepWork}
              today={today}
            />
          )}

          {/* 4. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <DashboardView
              key="dashboard"
              containerVars={containerVars}
              appData={appData}
              today={today}
              neglectedHabits={neglectedHabits}
              financialStats={financialStats}
              chartData={chartData}
            />
          )}

          {/* 4. BOOKS / LIBRARY */}
          {activeTab === 'books' && (
            <LibraryView
              key="books"
              containerVars={containerVars}
              appData={appData}
              saveBook={saveBook}
              deleteBook={deleteBook}
              updateBookProgress={updateBookProgress}
            />
          )}

          {/* 5. SCHOLARSHIPS / PROJETS */}
          {activeTab === 'scholarships' && (
            <ScholarshipsView
              key="scholarships"
              containerVars={containerVars}
              appData={appData}
              saveScholarship={saveScholarship}
              deleteScholarship={deleteScholarship}
            />
          )}

          {/* 6. SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsView
              key="settings"
              containerVars={containerVars}
              appData={appData}
              setAppData={setAppData}
              importData={importData}
            />
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
