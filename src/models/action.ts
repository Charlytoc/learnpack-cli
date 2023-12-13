export type TAction =
  | "test"
  | "log"
  | "reload"
  | "ready"
  | "clean"
  | "ask"
  | "generation";

export type ICallback = (...agrs: any[]) => any;
