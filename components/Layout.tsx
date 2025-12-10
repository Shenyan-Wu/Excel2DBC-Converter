import React from 'react';
import { FileSpreadsheet, History, Info, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  activeTab: 'converter' | 'history' | 'about';
  onTabChange: (tab: 'converter' | 'history' | 'about') => void;
  children: React.ReactNode;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-dark-950 dark:via-slate-900 dark:to-dark-900 transition-colors duration-500">
      <div className="w-full max-w-5xl">
        {/* Header with Glassmorphism */}
        <div className="flex justify-between items-center mb-10 px-4">
            <div className="text-left">
                <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight drop-shadow-sm">
                    Excel to DBC <span className="text-slate-800 dark:text-slate-200">Pro</span>
                </h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium text-lg">
                    Professional CAN Matrix Conversion Suite
                </p>
            </div>
            
            <button 
                onClick={toggleTheme}
                className="p-3 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform duration-300 text-slate-600 dark:text-slate-300"
            >
                {isDarkMode ? <Sun className="w-6 h-6 text-amber-400" /> : <Moon className="w-6 h-6 text-indigo-600" />}
            </button>
        </div>

        {/* Main Card with Glassmorphism */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden transition-all duration-300">
          
          {/* Navigation */}
          <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-8">
            <nav className="-mb-px flex space-x-12" aria-label="Tabs">
              <button
                onClick={() => onTabChange('converter')}
                className={`${
                  activeTab === 'converter'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                } group inline-flex items-center py-6 px-2 border-b-4 font-bold text-base transition-all duration-200`}
              >
                <FileSpreadsheet className={`-ml-0.5 mr-3 h-6 w-6 transition-transform group-hover:scale-110 ${activeTab === 'converter' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500'}`} />
                Converter
              </button>
              <button
                onClick={() => onTabChange('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                } group inline-flex items-center py-6 px-2 border-b-4 font-bold text-base transition-all duration-200`}
              >
                <History className={`-ml-0.5 mr-3 h-6 w-6 transition-transform group-hover:scale-110 ${activeTab === 'history' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500'}`} />
                History
              </button>
              <button
                onClick={() => onTabChange('about')}
                className={`${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                } group inline-flex items-center py-6 px-2 border-b-4 font-bold text-base transition-all duration-200`}
              >
                <Info className={`-ml-0.5 mr-3 h-6 w-6 transition-transform group-hover:scale-110 ${activeTab === 'about' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-500'}`} />
                About
              </button>
            </nav>
          </div>

          <div className="p-6 sm:p-10 min-h-[500px]">
            {children}
          </div>
        </div>
        
        <footer className="mt-8 text-center text-sm text-slate-400 dark:text-slate-600 font-medium">
          <p>&copy; {new Date().getFullYear()} CAN Tool Suite. High Performance Web Tools.</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;