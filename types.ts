export interface Signal {
  Name: string;
  Desc: string;
  ValDesc: string;
  ByteOrder: string;
  StartByte: number;
  StartBit: number;
  SendType: string;
  Length: number;
  DataType: string;
  Factor: number;
  Offset: number;
  PhyMin: number;
  PhyMax: number;
  InitValue: string;
  InvalidValue: string;
  Unit: string;
  Receiver: string;
}

export interface Message {
  ID: string;
  Name: string;
  Type: string;
  SendType: string;
  CycleTime: string | number;
  Length: number;
  Desc: string;
  Receiver: string;
  Sender: string;
  SigList: Signal[];
}

export interface MsgInfo {
  Node: string[];
  MsgList: Message[];
}

export interface GenerationConfig {
  dbcPrefix: string;
  selectedWorksheets: string[];
  generationOption: 'separately' | 'combined';
  encoding: string;
  generateValueTable: boolean;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

export interface GeneratedFile {
  filename: string;
  content: string;
}