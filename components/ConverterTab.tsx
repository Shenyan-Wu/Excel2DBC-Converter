import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Trash2, CheckCircle, AlertCircle, FileText, Settings2, Download, Layers, TableProperties, FileCode } from 'lucide-react';
import iconv from 'iconv-lite';
import { readExcelFile, getSheetNames } from '../services/excelService';
import { processWorkbook } from '../services/dbcBuilder';
import { LogEntry } from '../types';

const ConverterTab: React.FC = () => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [dbcPrefix, setDbcPrefix] = useState('CAN_Msg');
  const [generationOption, setGenerationOption] = useState<'separately' | 'combined'>('separately');
  const [generateValueTable, setGenerateValueTable] = useState(false);
  const [encoding, setEncoding] = useState('utf-8');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), message, type }]);
  };

  const handleFileChange = async (file: File) => {
    setIsProcessing(true);
    setLogs([]);
    setWorkbook(null);
    setAvailableSheets([]);
    setSelectedSheets([]);
    
    try {
      addLog(`Reading file: ${file.name}...`);
      const wb = await readExcelFile(file);
      const sheets = getSheetNames(wb);
      
      setWorkbook(wb);
      setFileName(file.name);
      setAvailableSheets(sheets);
      // Default to empty selection as requested
      setSelectedSheets([]);
      addLog(`File loaded successfully. Found ${sheets.length} sheets.`, 'success');
    } catch (error) {
      addLog(`Error reading file: ${error}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const toggleSheet = (sheet: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheet) ? prev.filter(s => s !== sheet) : [...prev, sheet]
    );
  };

  const convertToEncoding = (content: string, targetEncoding: string): Blob => {
    // If UTF-8 is selected, we can skip iconv-lite overhead or use it, 
    // but iconv-lite is reliable.
    try {
        let enc = targetEncoding;
        // Map UI values to iconv-lite supported names if necessary
        if (enc === 'windows-1252') enc = 'win1252';

        // iconv.encode returns a Buffer (Uint8Array)
        const buf = iconv.encode(content, enc);
        return new Blob([buf], { type: 'text/plain' });
    } catch (error) {
        console.error("Iconv encoding failed:", error);
        addLog(`Encoding to ${targetEncoding} failed, falling back to UTF-8.`, 'error');
        return new Blob([content], { type: 'text/plain;charset=utf-8' });
    }
  };

  const handleGenerate = () => {
    if (!workbook || selectedSheets.length === 0) {
      addLog('Please upload a file and select at least one worksheet.', 'error');
      return;
    }

    setIsProcessing(true);
    addLog('Starting generation...', 'info');

    setTimeout(() => {
        try {
            const result = processWorkbook(workbook, {
                dbcPrefix,
                selectedWorksheets: selectedSheets,
                generationOption,
                generateValueTable
            });

            result.logs.forEach(l => addLog(l, l.toLowerCase().includes('error') ? 'error' : 'info'));

            // Download Logic with Encoding
            result.files.forEach(f => {
                const blob = convertToEncoding(f.content, encoding);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = f.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addLog(`Downloaded ${f.filename} (${encoding})`, 'success');
            });

        } catch (error: any) {
            addLog(`Generation failed: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, 100); 
  };

  const clearInfo = () => {
      setWorkbook(null);
      setFileName('');
      setAvailableSheets([]);
      setSelectedSheets([]);
      setLogs([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* File Upload Section */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Excel Source File</label>
        <div 
          className="relative group border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-10 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 shadow-md rounded-full group-hover:scale-110 transition-transform duration-300 border border-slate-100 dark:border-slate-700">
                    <Upload className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-lg">
                    <span className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">.xlsx or .xls files supported</p>
                {fileName && (
                    <div className="mt-4 flex items-center space-x-2 text-sm text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full shadow-sm animate-pulse-soft">
                        <CheckCircle className="w-4 h-4" />
                        <span>{fileName}</span>
                    </div>
                )}
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls" 
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Configuration - Always Visible */}
        <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-fit">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                <Settings2 className="w-5 h-5 mr-2 text-blue-500" /> General Settings
            </h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">DBC Prefix</label>
                    <div className="relative group">
                        <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={dbcPrefix}
                            onChange={(e) => setDbcPrefix(e.target.value)}
                            className="pl-10 block w-full rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white border-2 focus:border-blue-500 focus:ring-0 sm:text-sm p-2.5 transition-all shadow-sm"
                            placeholder="e.g., CAN_Msg"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Generation Mode</label>
                    <div className="relative group">
                        <Layers className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <select 
                            value={generationOption}
                            onChange={(e) => setGenerationOption(e.target.value as any)}
                            className="pl-10 block w-full rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white border-2 focus:border-blue-500 focus:ring-0 sm:text-sm p-2.5 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="separately">Generate Separate DBCs per Sheet</option>
                            <option value="combined">Merge into Single DBC</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {/* Dynamic Section: Sheet Selection & Output Options - Hidden if no workbook */}
        {workbook ? (
            <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 animate-slide-in-up">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                    <TableProperties className="w-5 h-5 mr-2 text-purple-500" /> Data & Output
                </h3>
                
                {/* Sheet Selection */}
                <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex justify-between">
                        <span>Select Worksheets</span>
                        <span className="text-xs font-normal text-slate-400">{selectedSheets.length} selected</span>
                    </label>
                    <div className="border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                        <div className="space-y-2">
                            {availableSheets.map(sheet => (
                                <label key={sheet} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors group">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedSheets.includes(sheet) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-500'}`}>
                                        {selectedSheets.includes(sheet) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSheets.includes(sheet)}
                                        onChange={() => toggleSheet(sheet)}
                                        className="hidden"
                                    />
                                    <span className={`text-sm font-medium transition-colors ${selectedSheets.includes(sheet) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>{sheet}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Encoding and Value Table - Grouped with Symmetrical Sizing */}
                <div className="flex flex-col md:flex-row gap-4 pt-2">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">File Encoding</label>
                        <div className="relative group">
                            <FileCode className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                            <select 
                                value={encoding}
                                onChange={(e) => setEncoding(e.target.value)}
                                className="pl-10 block w-full rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white border-2 focus:border-purple-500 focus:ring-0 sm:text-sm p-2.5 transition-all shadow-sm appearance-none cursor-pointer"
                            >
                                <option value="utf-8">UTF-8</option>
                                <option value="gbk">GBK (Limited)</option>
                                <option value="gb2312">GB2312 (Limited)</option>
                                <option value="windows-1252">Windows-1252</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Value Tables</label>
                        <div 
                            className="relative group w-full rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800 border-2 focus-within:border-blue-500 transition-all shadow-sm flex items-center justify-between p-2.5 cursor-pointer hover:border-blue-400"
                            onClick={() => setGenerateValueTable(!generateValueTable)}
                        >
                            <div className="flex items-center">
                                <TableProperties className="ml-0.5 mr-2.5 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium select-none">Generate VAL_</span>
                            </div>
                            
                            <div className="relative mr-1">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={generateValueTable}
                                    readOnly
                                />
                                <div className={`block w-9 h-5 rounded-full transition-colors ${generateValueTable ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform transform ${generateValueTable ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            // Placeholder for when no file is selected to maintain grid layout balance (Optional)
            <div className="hidden lg:flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                <div className="text-center text-slate-400 p-8">
                    <TableProperties className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Upload a file to configure<br/>output settings</p>
                </div>
            </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
            onClick={handleGenerate}
            disabled={isProcessing || !workbook}
            className="flex-1 inline-flex justify-center items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
            {isProcessing ? (
                <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </span>
            ) : (
                <>
                    <Settings2 className="w-6 h-6 mr-2" />
                    Generate DBC
                </>
            )}
        </button>

        <button
            onClick={() => window.open('https://www.alipan.com/s/pw1Jiw5gYsb', '_blank')}
            className="flex-none inline-flex justify-center items-center px-6 py-4 border-2 border-slate-200 dark:border-slate-600 text-base font-bold rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-500/20 shadow-sm transition-all"
        >
            <Download className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
            Template
        </button>

        <button
            onClick={clearInfo}
            className="flex-none inline-flex justify-center items-center px-6 py-4 border-2 border-red-100 dark:border-red-900/30 text-base font-bold rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all"
        >
            <Trash2 className="w-5 h-5 mr-2" />
            Reset
        </button>
      </div>

      {/* Log Console */}
      <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm h-64 overflow-y-auto shadow-inner border border-slate-700 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3 sticky top-0 bg-slate-900">
            <div className="text-slate-400 text-xs uppercase tracking-widest font-bold">System Log</div>
            <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
        </div>
        {logs.length === 0 ? (
            <div className="text-slate-600 italic mt-20 text-center">
                <p>Ready to process...</p>
            </div>
        ) : (
            <div className="space-y-1.5">
                {logs.map((log, index) => (
                    <div key={index} className={`flex items-start ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        <span className="text-slate-600 mr-3 min-w-[80px] text-xs pt-0.5">[{log.timestamp}]</span>
                        <span className="break-all">
                            {log.type === 'error' && <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
};

export default ConverterTab;