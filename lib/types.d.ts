export type Input = {
  [id: string]: string;
};

export type Output = {
  [id: string]: {
    success: boolean;
    result: any;
  }
};

export type Config = {
  input: Input;
  output: Output;
};

export type Element = {
  id: string;
  businessObject: ModdleElement;
};

export type ModdleElement = {
  $type: string;
  id: string;
};

export type Variable = {
  name: string;
  type?: string;
  info?: string;
  isList?: boolean;
  entries?: Variable[];
  scope?: ModdleElement;
};

export type Variables = Variable[];