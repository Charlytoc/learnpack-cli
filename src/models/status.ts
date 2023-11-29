export type TStatus =
  | "ready"
  | "internal-error"
  | "compiler-success"
  | "testing-success"
  | "compiling"
  | "testing"
  | "start_exercise"
  | "initializing"
  | "configuration_loaded"
  | "connection_ended"
  | "reset_exercise"
  | "open_files"
  | "open_window"
  | "instructions_closed"
  | "completed";
