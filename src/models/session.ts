import { IConfig, IConfigObj } from "./config";

export interface IPayload {
  email: string;
}

export interface IStartProps {
  token: string;
  payload: IPayload | null;
}

export interface ISession {
  sessionStarted: boolean;
  token: string | null;
  config: IConfig | null;
  currentCohort: null;
  initialize: () => Promise<boolean>;
  getOpenAIToken: () => Promise<string | null>;
  setOpenAIToken: (token: string) => Promise<boolean>;
  setPayload: (value: IPayload) => Promise<boolean>;
  getPayload: () => Promise<any>;
  isActive: () => boolean;
  get: (config?: IConfigObj) => Promise<any>;
  login: () => Promise<void>;
  loginWeb: (email: string, password: string) => Promise<void>;
  sync: () => Promise<void>;
  start: ({ token, payload }: IStartProps) => Promise<void>;
  destroy: () => Promise<void>;
}
