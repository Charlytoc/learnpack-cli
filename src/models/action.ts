export type TAction =
  | "test"
  | "log"
  | "reload"
  | "ready"
  | "clean"
  | "ask"
  | "file_change";

export type ICallback = (...agrs: any[]) => any;
