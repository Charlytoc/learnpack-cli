import { IConfig, IConfigObj } from "./config"

export interface IPayload {
  email: string;
}

export interface IStartProps {
  token: string;
  payload: IPayload | null;
}

type TLoginResponse = {
  token: string;
  user_id: string;
  email: string;
};

export interface ISession {
  sessionStarted: boolean;
  token: string | null;
  config: IConfig | null;
  currentCohort: null;
  initialize: () => Promise<boolean>;
  setRigoToken: (token: string) => Promise<boolean>;
  setPayload: (value: IPayload) => Promise<boolean>;
  getPayload: () => Promise<any>;
  isActive: () => boolean;
  get: (config?: IConfigObj) => Promise<any>;
  login: () => Promise<void>;
  loginWeb: (email: string, password: string) => Promise<TLoginResponse>;
  sync: () => Promise<void>;
  start: ({ token, payload }: IStartProps) => Promise<void>;
  destroy: () => Promise<void>;
}
