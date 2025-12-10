import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ConverterTab from './components/ConverterTab';
import HistoryTab from './components/HistoryTab';
import AboutTab from './components/AboutTab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'converter' | 'history' | 'about'>('converter');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
      <div className={`transition-all duration-500 ease-in-out ${activeTab === 'converter' ? 'opacity-100 translate-x-0' : 'opacity-0 hidden translate-x-10'}`}>
        <ConverterTab />
      </div>
      <div className={`transition-all duration-500 ease-in-out ${activeTab === 'history' ? 'opacity-100 translate-x-0' : 'opacity-0 hidden translate-x-10'}`}>
        <HistoryTab />
      </div>
      <div className={`transition-all duration-500 ease-in-out ${activeTab === 'about' ? 'opacity-100 translate-x-0' : 'opacity-0 hidden translate-x-10'}`}>
        <AboutTab />
      </div>
    </Layout>
  );
};

export default App;