import React from 'react';

const versions = [
    { version: "1.0", date: "Jan 14, 2025", desc: "Official Release: Improved UI/UX, Performance optimization." },
    { version: "0.6", date: "Jan 13, 2025", desc: "Added Value Table support and Combined generation mode." },
    { version: "0.5", date: "Jan 12, 2025", desc: "Critical bug fix for Hexadecimal parsing." },
    { version: "0.4", date: "Jan 10, 2025", desc: "Initial logic implementation for standard CAN Matrix." },
    { version: "0.3", date: "Jan 03, 2025", desc: "Added multi-sheet support." },
    { version: "0.2", date: "Jan 01, 2025", desc: "Added Drag & Drop file support." },
    { version: "0.1", date: "Dec 28, 2024", desc: "Proof of Concept." },
];

const HistoryTab: React.FC = () => {
  return (
    <div className="py-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">Version History</h2>
        <div className="relative border-l-4 border-slate-200 dark:border-slate-700 ml-4 space-y-12">
            {versions.map((ver, idx) => (
                <div key={idx} className="relative pl-10 group">
                    {/* Dot */}
                    <div className={`absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 border-white dark:border-slate-800 transition-all duration-300 group-hover:scale-125 ${idx === 0 ? 'bg-blue-500 shadow-blue-500/50 shadow-lg' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-900">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                            <h3 className={`text-xl font-bold ${idx === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                Version {ver.version}
                                {idx === 0 && <span className="ml-3 inline-block px-2 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full uppercase tracking-wide">Latest</span>}
                            </h3>
                            <time className="text-sm text-slate-400 font-medium font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">{ver.date}</time>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">{ver.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default HistoryTab;