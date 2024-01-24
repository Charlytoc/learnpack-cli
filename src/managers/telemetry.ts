type TEventType =
  | "form_submit"
  | "build"
  | "test"
  | "visualize_step"
  | "code_start";

type TFile = {
  name: string;
  content: string;
};

type TStep = {
  name: string;
  position: number;
  files: TFile[];
};

type TTelemetryEvent = {
  type: TEventType;
  data: any;
  timestamp: number;
  step: TStep;
};

interface ITelemetryManager {
  current: Array<TTelemetryEvent> | null;
  start: () => void;
  submit: () => void;
  registerEvent: (event: Omit<TTelemetryEvent, "timestamp">) => void;
  save: () => void;
  onSaveCallback?: (current: Array<TTelemetryEvent>) => void;
}

const TelemetryManager: ITelemetryManager = {
  current: null,
  start: function () {
    if (!this.current) {
      this.current = []
    }
  },
  submit: function () {
    console.log("submit")
  },
  registerEvent: function (event) {
    this.start()
    const timestamp = Date.now()
    const _event = { ...event, timestamp }
    this.current?.push(_event)
  },
  save: function () {
    if (this.onSaveCallback && this.current) {
      this.onSaveCallback(this.current)
    }
  },
}

export default TelemetryManager
