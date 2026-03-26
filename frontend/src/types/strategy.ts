// --- Types ---
export type FieldType = 'field' | 'indicator' | 'number';

export interface Entity {
  type: FieldType;
  source: string;
  period?: number;
  value?: number;
  mathOp?: string | null;
  mathVal?: number | string;
}

export interface Condition {
  id: number;
  logicalOp: string | null;
  left: Entity;
  comp: string;
  right: Entity;
}
