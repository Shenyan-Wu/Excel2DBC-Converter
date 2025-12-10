import React from 'react';
import { ShieldCheck, Zap, Database, Cpu } from 'lucide-react';

const AboutTab: React.FC = () => {
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Excel to DBC <span className="text-blue-600 dark:text-blue-400">Pro</span></h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          The ultimate bridge between Excel-based CAN communication matrices and the Vector DBC format. Engineered for automotive professionals.
        </p>
      </div>

      {/* Security Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 flex items-start space-x-4">
        <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
        <div>
            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100">100% Client-Side Processing</h4>
            <p className="text-blue-800 dark:text-blue-200 mt-1">
                Your proprietary CAN matrix data never leaves your browser. All calculations and file generation happen locally on your machine, ensuring maximum security and confidentiality.
            </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Standard Support</h3>
              <p className="text-slate-600 dark:text-slate-400">
                  Full support for standard Excel CAN Matrix templates (Columns A-V) and Vector DBC specifications.
              </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Advanced Calculation</h3>
              <p className="text-slate-600 dark:text-slate-400">
                  Automatic handling of Intel/Motorola byte ordering, 29-bit Extended CAN IDs, and initial value calculations using factors/offsets.
              </p>
          </div>
      </div>

      {/* Specs */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-amber-500" /> Technical Capabilities
          </h3>
          <ul className="space-y-4">
              {[
                  "Generates standard Vector DBC files compatible with CANoe/CANalyzer",
                  "Support for both Standard (11-bit) and Extended (29-bit) Identifiers",
                  "Complex Value Table (VAL_) generation from text descriptions",
                  "Multi-sheet batch processing and merging capabilities"
              ].map((item, i) => (
                  <li key={i} className="flex items-start">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3"></span>
                      <span className="text-slate-700 dark:text-slate-300">{item}</span>
                  </li>
              ))}
          </ul>
      </div>

    </div>
  );
};

export default AboutTab;