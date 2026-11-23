export interface MatrixCell {
  row: string;
  column: string;
  userInput: string | boolean;
  notes?: string | Record<string, string>;
  inputindex?: number;
}
