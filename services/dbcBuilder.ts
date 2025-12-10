import * as XLSX from 'xlsx';
import { MsgInfo, Message, Signal } from '../types';

// Constants for Excel Columns matching the original requirement
const COL_COUNT_THRESHOLD = 22;

const parseSheet = (workbook: XLSX.WorkBook, sheetName: string): { result: number; data: MsgInfo; error?: string } => {
  const MsgInfo: MsgInfo = {
    Node: [],
    MsgList: []
  };

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return { result: 0, data: MsgInfo, error: `Sheet ${sheetName} not found` };
  }

  // Use raw: true to get values as they are
  const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: true, defval: '' });

  if (rawData.length < 4) {
    return { result: 0, data: MsgInfo, error: `Sheet ${sheetName} has too few rows.` };
  }

  // Check columns length
  const headerRow = rawData[0];
  if (!headerRow || headerRow.length < COL_COUNT_THRESHOLD) {
    return { result: 0, data: MsgInfo, error: `Sheet ${sheetName} has too few columns.` };
  }

  // Extract Node Names (Starting from Column 22 / Index 22)
  const nodeRowIndex = 1; 
  if (rawData[nodeRowIndex]) {
    for (let i = 22; i < rawData[nodeRowIndex].length; i++) {
        const val = rawData[nodeRowIndex][i];
        if (val !== null && val !== undefined && val !== '') {
            MsgInfo.Node.push(String(val));
        }
    }
  }

  let currentMsg: Message | null = null;

  // Start processing from row index 2 (3rd row)
  for (let rowIndex = 2; rowIndex < rawData.length; rowIndex++) {
    const row = rawData[rowIndex];
    if (!row || row.every((cell: any) => !cell)) continue;

    const [
      MsgName, MsgType, MsgID, MsgSendType, MsgCycleTime, MsgLength,
      SignalName, Comment, ValueDesc, ByteOrder, StartByte, StartBit,
      SendType, Length, DataType, Factor, Offset, Min, Max,
      InitValue, InvalidValue, Unit
    ] = row;

    // --- Message Processing ---
    if (MsgID !== undefined && MsgID !== '') {
      let idValue: number;
      const msgIdStr = String(MsgID).trim();
      
      if (msgIdStr.toLowerCase().startsWith('0x')) {
        idValue = parseInt(msgIdStr.slice(2), 16);
      } else {
        idValue = parseInt(msgIdStr, 10);
        if (isNaN(idValue) && /^[0-9A-Fa-f]+$/.test(msgIdStr)) {
             idValue = parseInt(msgIdStr, 16);
        }
      }

      if (!isNaN(idValue) && idValue <= 0x1FFFFFFF) {
        const finalIDStr = idValue > 0x7FF ? String(idValue + 0x80000000) : String(idValue);

        currentMsg = {
          ID: finalIDStr,
          Name: MsgName,
          Type: MsgType,
          SendType: MsgSendType ?? "Cycle",
          CycleTime: MsgCycleTime,
          Length: parseInt(MsgLength) || 0,
          Desc: Comment ?? "",
          Receiver: '',
          Sender: '',
          SigList: []
        };

        // Find Sender
        for (let i = 0; i < MsgInfo.Node.length; i++) {
           const colIdx = 22 + i;
           const nodeMark = row[colIdx];
           if (nodeMark && String(nodeMark).trim().toUpperCase() === 'S') {
             currentMsg.Sender = MsgInfo.Node[i];
             break;
           }
        }

        MsgInfo.MsgList.push(currentMsg);
      }
    }

    // --- Signal Processing ---
    if (SignalName && currentMsg) {
      const signal: Signal = {
        Name: SignalName,
        Desc: Comment ?? "",
        ValDesc: ValueDesc ?? "",
        ByteOrder: ByteOrder ?? "Intel",
        StartByte: parseInt(StartByte) || 0,
        StartBit: parseInt(StartBit) || 0,
        SendType: SendType ?? "Cycle",
        Length: parseInt(Length) || 0,
        DataType: DataType,
        Factor: parseFloat(Factor) || 1,
        Offset: parseFloat(Offset) || 0,
        PhyMin: parseFloat(Min) || 0,
        PhyMax: parseFloat(Max) || 0,
        InitValue: String(InitValue ?? "0"),
        InvalidValue: String(InvalidValue ?? ""),
        Unit: Unit ?? "",
        Receiver: ''
      };

      // Find Receivers
      const receivers: string[] = [];
      for (let i = 0; i < MsgInfo.Node.length; i++) {
        const colIdx = 22 + i;
        const nodeMark = row[colIdx];
        if (nodeMark && String(nodeMark).trim().toUpperCase() === 'R') {
             const potentialReceiver = MsgInfo.Node[i];
             if (potentialReceiver !== currentMsg.Sender) {
                 receivers.push(potentialReceiver);
             }
        }
      }
      signal.Receiver = receivers.join(',') || 'Vector__XXX';
      currentMsg.SigList.push(signal);
    }
  }

  return { result: 1, data: MsgInfo };
};

// Replicating original 'getCommonInfo' exactly
const getCommonInfo = (DBCFileName: string, nodes: string[]) => {
    const eol = '\n';
    let Header_content = `VERSION ""${eol}${eol}${eol}NS_ :${eol}`;
    
    const headerSections = [
        'NS_DESC_', 'CM_', 'BA_DEF_', 'BA_', 'VAL_', 'CAT_DEF_', 'CAT_', 'FILTER',
        'BA_DEF_DEF_', 'EV_DATA_', 'ENVVAR_DATA_', 'SGTYPE_', 'SGTYPE_VAL_',
        'BA_DEF_SGTYPE_', 'BA_SGTYPE_', 'SIG_TYPE_REF_', 'VAL_TABLE_', 'SIG_GROUP_',
        'SIG_VALTYPE_', 'SIGTYPE_VALTYPE_', 'BO_TX_BU_', 'BA_DEF_REL_', 'BA_REL_',
        'BA_DEF_DEF_REL_', 'BU_SG_REL_', 'BU_EV_REL_', 'BU_BO_REL_', 'SG_MUL_VAL_'
    ];
    headerSections.forEach(s => Header_content += `\t${s}${eol}`);
    Header_content += `${eol}BS_:${eol}${eol}`;

    const BU_Content = `BU_:${nodes.map(n => ' ' + n).join('')}${eol}`;

    let BA_DEF_Content = '';
    
    // Network Attributes
    const networkAttrs = [
      ['BusType', 'STRING'],
      ['ProtocolType', 'STRING'],
      ['DBName', 'STRING'],
      ['Manufacturer', 'STRING']
    ];
    networkAttrs.forEach(([name, type]) => {
      BA_DEF_Content += `BA_DEF_ "${name}" ${type};${eol}`;
    });

    // Node Attributes
    const nodeAttrs = [
      ['ECU', 'STRING'],
      ['NmStationAddress', 'INT', '0', '254'],
      ['NmJ1939AAC', 'INT', '0', '1'],
      ['NmJ1939IndustryGroup', 'INT', '0', '7'],
      ['NmJ1939System', 'INT', '0', '127'],
      ['NmJ1939SystemInstance', 'INT', '0', '15'],
      ['NmJ1939Function', 'INT', '0', '255'],
      ['NmJ1939FunctionInstance', 'INT', '0', '7'],
      ['NmJ1939ECUInstance', 'INT', '0', '3'],
      ['NmJ1939ManufacturerCode', 'INT', '0', '2047'],
      ['NmJ1939IdentityNumber', 'INT', '0', '2097151']
    ];
    nodeAttrs.forEach(attr => {
        const [name, type, ...range] = attr;
        BA_DEF_Content += `BA_DEF_ BU_ "${name}" ${type}${range.length ? ' ' + range.join(' ') : ''};${eol}`;
    });

    // Signal Attributes
    const sigTypeEnum = '"Default","Range","RangeSigned","ASCII","Discrete","Control","ReferencePGN","DTC","StringDelimiter","StringLength","StringLengthControl","MessageCounter","MessageChecksum"';
    BA_DEF_Content += `BA_DEF_ SG_ "SigType" ENUM ${sigTypeEnum};${eol}`;
    BA_DEF_Content += `BA_DEF_ SG_ "SPN" INT 0 524287;${eol}`;
    BA_DEF_Content += `BA_DEF_ SG_ "GenSigILSupport" ENUM "No","Yes";${eol}`;

    const sendTypeEnum = '"Cyclic","OnWrite","OnWriteWithRepetition","OnChange","OnChangeWithRepetition","IfActive","IfActiveWithRepetition","NoSigSendType"';
    BA_DEF_Content += `BA_DEF_ SG_ "GenSigSendType" ENUM ${sendTypeEnum};${eol}`;
    BA_DEF_Content += `BA_DEF_ SG_ "GenSigInactiveValue" INT 0 1000000;${eol}`;
    BA_DEF_Content += `BA_DEF_ SG_ "GenSigStartValue" INT 0 65535;${eol}`; // Note: Original used INT 0 65535, though float is common in some tools
    BA_DEF_Content += `BA_DEF_ SG_ "GenSigEVName" STRING;${eol}`;

    // Message Attributes
    const msgAttrs = [
        ['GenMsgILSupport', 'ENUM', '"No","Yes"'],
        ['GenMsgSendType', 'ENUM', '"Cyclic","NotUsed","NotUsed","NotUsed","NotUsed","NotUsed","NotUsed","IfActive","noMsgSendType"'],
        ['GenMsgDelayTime', 'INT', '0', '1000'],
        ['GenMsgStartDelayTime', 'INT', '0', '100000'],
        ['GenMsgFastOnStart', 'INT', '0', '1000000'],
        ['GenMsgNrOfRepetition', 'INT', '0', '1000000'],
        ['GenMsgCycleTime', 'INT', '0', '60000'],
        ['GenMsgCycleTimeFast', 'INT', '0', '1000000'],
        ['GenMsgRequestable', 'INT', '0', '1'],
        ['VFrameFormat', 'ENUM', '"StandardCAN","ExtendedCAN","reserved","J1939PG"'],
    ];

    msgAttrs.forEach(attr => {
        const [name, type, ...params] = attr;
        BA_DEF_Content += `BA_DEF_ BO_ "${name}" ${type} ${params.join(' ')};${eol}`;
    });

    // Default Values
    const defaults = [
        ['BusType', '""'],
        ['ProtocolType', '""'],
        ['DBName', '""'],
        ['Manufacturer', '"Vector"'],
        ['ECU', '""'],
        ['NmStationAddress', '254'],
        ['NmJ1939AAC', '0'],
        ['NmJ1939IndustryGroup', '0'],
        ['NmJ1939System', '0'],
        ['NmJ1939SystemInstance', '0'],
        ['NmJ1939Function', '0'],
        ['NmJ1939FunctionInstance', '0'],
        ['NmJ1939ECUInstance', '0'],
        ['NmJ1939ManufacturerCode', '0'],
        ['NmJ1939IdentityNumber', '0'],
        ['SigType', '"Default"'],
        ['SPN', '0'],
        ['GenSigILSupport', '"Yes"'],
        ['GenSigSendType', '"NoSigSendType"'],
        ['GenSigInactiveValue', '0'],
        ['GenSigStartValue', '0'],
        ['GenSigEVName', '"Env@Nodename_@Signame"'],
        ['GenMsgILSupport', '"Yes"'],
        ['GenMsgSendType', '"noMsgSendType"'],
        ['GenMsgDelayTime', '0'],
        ['GenMsgStartDelayTime', '0'],
        ['GenMsgFastOnStart', '0'],
        ['GenMsgNrOfRepetition', '0'],
        ['GenMsgCycleTime', '0'],
        ['GenMsgCycleTimeFast', '0'],
        ['GenMsgRequestable', '1'],
        ['VFrameFormat', '"ExtendedCAN"'],
    ];

    defaults.forEach(([name, value]) => {
        BA_DEF_Content += `BA_DEF_DEF_ "${name}" ${value};${eol}`;
    });

    // Global Attributes
    let BA_Content = `BA_ "ProtocolType" "";${eol}`;
    BA_Content += `BA_ "Manufacturer" "ShenyanWu";${eol}`;
    BA_Content += `BA_ "BusType" "CAN";${eol}`;
    BA_Content += `BA_ "DBName" "${DBCFileName}";${eol}`;

    return { Header_content, BU_Content, BA_DEF_Content, BA_Content };
};

const generateBody = (MsgInfo: MsgInfo, generateValueTable: boolean) => {
    const eol = '\n';
    let BO_SG_Content = '';
    let CM_BO_SG_Content = '';
    let BA_BO_Content = '';
    let BA_SG_Content = '';
    let VAL_Content = '';

    // Sort Messages by ID (Numeric)
    MsgInfo.MsgList.sort((a, b) => parseInt(a.ID) - parseInt(b.ID));

    // 1. BO_SG section
    MsgInfo.MsgList.forEach(msg => {
        const Sender = msg.Sender || 'Vector__XXX';
        BO_SG_Content += `BO_ ${msg.ID} ${msg.Name}: ${msg.Length} ${Sender}${eol}`;

        // Sort Signals by StartBit
        msg.SigList.sort((a, b) => a.StartBit - b.StartBit);

        msg.SigList.forEach(sig => {
            let startBit = sig.StartBit;
            let byteOrderFlag = '1'; // Default Intel

            // Check ByteOrder
            if (sig.ByteOrder.toLowerCase().includes('motorola')) {
                 if (sig.ByteOrder.toLowerCase().includes('lsb')) {
                     // Replicating original logic for LSB calc in Motorola
                     const LSB = Array(8).fill(0).map((_, i) => Array(8).fill(0).map((_, j) => 8 * (i + 1) - (j + 1)));
                     const flatLSB = LSB.flat();
                     const LSBIdx = flatLSB.indexOf(startBit) + 1 - sig.Length;
                     if (LSBIdx >= 0 && LSBIdx < 64) {
                         startBit = flatLSB[LSBIdx];
                         byteOrderFlag = '0';
                     }
                 } else {
                     // Standard Motorola or MSB
                     byteOrderFlag = '0';
                 }
            }

            const signSymbol = sig.DataType.toLowerCase().includes('unsigned') ? '+' : '-';
            const unitStr = sig.Unit.replace(/%/g, '%%%%'); // Escape %
            const Receiver = sig.Receiver || 'Vector__XXX';
            
            BO_SG_Content += ` SG_ ${sig.Name} : ${startBit}|${sig.Length}@${byteOrderFlag}${signSymbol} (${sig.Factor},${sig.Offset}) [${sig.PhyMin}|${sig.PhyMax}] "${unitStr}" ${Receiver}${eol}`;
        });
        BO_SG_Content += eol;
    });

    // 2. CM_BO_SG section (Comments)
    MsgInfo.MsgList.forEach(msg => {
        if (msg.Desc) {
            let MsgDesc = msg.Desc.toString().replace(/%/g, '%%%%');
            CM_BO_SG_Content += `CM_ BO_ ${msg.ID} "${MsgDesc}";${eol}`;
        }
        msg.SigList.forEach(sig => {
            if (sig.Desc) {
                let SigDesc = sig.Desc.toString().replace(/%/g, '%%%%');
                CM_BO_SG_Content += `CM_ SG_ ${msg.ID} ${sig.Name} "${SigDesc}";${eol}`;
            }
        });
    });

    // 3. BA_BO section (Message Attributes)
    MsgInfo.MsgList.forEach(msg => {
        // VFrameFormat
        if (parseInt(msg.ID) <= 0x7FF) {
             BA_BO_Content += `BA_ "VFrameFormat" BO_ ${msg.ID} 0;${eol}`;
        }
        
        const cycleTime = parseInt(String(msg.CycleTime));
        if (msg.SendType.toLowerCase() === 'ifactive') {
             BA_BO_Content += `BA_ "GenMsgSendType" BO_ ${msg.ID} 7;${eol}`;
        } else if (msg.SendType.toLowerCase() === 'cycle' && !isNaN(cycleTime)) {
             BA_BO_Content += `BA_ "GenMsgCycleTime" BO_ ${msg.ID} ${cycleTime};${eol}`;
             BA_BO_Content += `BA_ "GenMsgSendType" BO_ ${msg.ID} 0;${eol}`;
        }
    });

    // 4. BA_SG section (Signal Attributes - Start Values)
    MsgInfo.MsgList.forEach(msg => {
        msg.SigList.forEach(sig => {
            try {
                const initValueStr = String(sig.InitValue ?? '0').trim();
                const factor = sig.Factor;
                const offset = sig.Offset;

                if (factor === 0) return;

                let numericValue = 0;
                // Enhanced Hex Regex
                if (/^-?(0x)?[0-9a-f]+$/i.test(initValueStr)) {
                    let sign = 1;
                    let cleanStr = initValueStr.toLowerCase();
                    if (cleanStr.startsWith('-')) {
                        sign = -1;
                        cleanStr = cleanStr.slice(1);
                    }
                    if (cleanStr.startsWith('0x')) cleanStr = cleanStr.slice(2);
                    numericValue = parseInt(cleanStr, 16) * sign;
                } else {
                    numericValue = parseFloat(initValueStr);
                }

                if (!isNaN(numericValue)) {
                    const IV = (numericValue - offset) / factor;
                    BA_SG_Content += `BA_ "GenSigStartValue" SG_ ${msg.ID} ${sig.Name} ${IV};${eol}`;
                }
            } catch (e) {
                // Ignore error
            }
        });
    });

    // 5. VAL_ section (Value Tables)
    if (generateValueTable) {
        MsgInfo.MsgList.forEach(msg => {
            msg.SigList.forEach(sig => {
                if (sig.ValDesc && typeof sig.ValDesc === 'string') {
                     // Basic parsing of the ValDesc format
                     // Example: "0: Off 1: On" or "0=Off 1=On"
                     // The original code was quite robust in splitting newlines etc.
                     const lines = sig.ValDesc.split(/\r?\n/);
                     let valDescStr = '';
                     
                     lines.forEach(line => {
                         let parts;
                         if (line.includes(':')) parts = line.split(':');
                         else if (line.includes('：')) parts = line.split('：');
                         else if (line.includes('=')) parts = line.split('=');
                         
                         if (parts && parts.length === 2) {
                             const valStr = parts[0].trim();
                             const label = parts[1].trim().replace(/%/g, '%%%%');
                             
                             let valNum;
                             if (valStr.toLowerCase().includes('0x')) {
                                 valNum = parseInt(valStr.toLowerCase().split('x')[1], 16);
                             } else {
                                 valNum = parseInt(valStr, 10);
                             }
                             
                             if (!isNaN(valNum)) {
                                 valDescStr += `${valDescStr ? ' ' : ''}${valNum} "${label}"`;
                             }
                         }
                     });

                     if (valDescStr) {
                         VAL_Content += `VAL_ ${msg.ID} ${sig.Name} ${valDescStr};${eol}`;
                     }
                }
            });
        });
    }

    return { BO_SG_Content, CM_BO_SG_Content, BA_BO_Content, BA_SG_Content, VAL_Content };
};

export const generateDBC = (sheetData: MsgInfo, filename: string, generateValueTable: boolean): string => {
    const common = getCommonInfo(filename, sheetData.Node);
    const body = generateBody(sheetData, generateValueTable);
    const eol = '\n';

    // IMPORTANT: Order must match original index.js logic
    let content = common.Header_content + common.BU_Content + eol;
    content += body.BO_SG_Content + eol;
    content += body.CM_BO_SG_Content + eol;
    content += common.BA_DEF_Content; // Includes BA_DEF definitions AND Defaults
    content += common.BA_Content;     // Global BA
    content += body.BA_BO_Content;
    content += body.BA_SG_Content;
    
    if (generateValueTable) {
        content += eol + body.VAL_Content + eol;
    }

    return content;
};

export const processWorkbook = (
    workbook: XLSX.WorkBook, 
    config: { 
        dbcPrefix: string; 
        selectedWorksheets: string[]; 
        generationOption: string; 
        generateValueTable: boolean;
    }
): { files: { filename: string; content: string }[], logs: string[] } => {
    
    const logs: string[] = [];
    const files: { filename: string; content: string }[] = [];
    
    // Original timestamp format: Month-Day-Year_Hour.Minute.Second
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${pad(now.getMonth()+1)}-${pad(now.getDate())}-${now.getFullYear()}_${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;

    if (config.generationOption === 'separately') {
        config.selectedWorksheets.forEach(sheetName => {
            const { result, data, error } = parseSheet(workbook, sheetName);
            if (result === 0) {
                logs.push(`Error parsing ${sheetName}: ${error}`);
                return;
            }
            
            const dbcName = `${config.dbcPrefix}_${sheetName}_${timestamp}`;
            const content = generateDBC(data, dbcName, config.generateValueTable);
            files.push({ filename: `${dbcName}.dbc`, content });
            logs.push(`Generated ${dbcName}.dbc from ${sheetName}`);
        });
    } else {
        // Combined
        const combinedData: MsgInfo = { Node: [], MsgList: [] };
        let combinedSuffix = '';

        config.selectedWorksheets.forEach(sheetName => {
             combinedSuffix += `_${sheetName}`;
             const { result, data, error } = parseSheet(workbook, sheetName);
             if (result === 0) {
                logs.push(`Skipping ${sheetName} due to error: ${error}`);
                return;
             }
             
             data.Node.forEach(n => {
                 if (!combinedData.Node.includes(n)) combinedData.Node.push(n);
             });
             data.MsgList.forEach(m => {
                 if (!combinedData.MsgList.find(ex => ex.ID === m.ID)) {
                     combinedData.MsgList.push(m);
                 } else {
                     logs.push(`Warning: Duplicate Message ID ${m.ID} in ${sheetName} ignored.`);
                 }
             });
        });

        if (combinedData.MsgList.length > 0) {
            const dbcName = `${config.dbcPrefix}${combinedSuffix}_${timestamp}`;
            const content = generateDBC(combinedData, dbcName, config.generateValueTable);
            files.push({ filename: `${dbcName}.dbc`, content });
            logs.push(`Generated Combined DBC: ${dbcName}.dbc`);
        } else {
            logs.push("No valid data found to combine.");
        }
    }

    return { files, logs };
};