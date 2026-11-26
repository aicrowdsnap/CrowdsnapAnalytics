export interface MatrixCell {
  row: string;
  column: string;
  userInput: string | boolean;
  notes?: string | Record<string, string>;
  inputindex?: number;
}

export interface ImageHeader {
  id: string;
  name: string;
  imageUrl: string;
  type: 'row' | 'column';
}
