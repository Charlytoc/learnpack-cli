import { IFile } from "../models/file"

const fs = require("fs")

function createUUID(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  )
}

function stringToBase64(input: string): string {
  return Buffer.from(input).toString("base64")
}

type TCompilationAttempt = {
  source_code: string;
  stdout: string;
  exit_code: number;
  starting_at: number;
  ending_at: number;
};

type TTestAttempt = {
  source_code: string;
  stdout: string;
  exit_code: number;
  starting_at: number;
  ending_at: number;
};

type TAIInteraction = {
  student_message: string;
  source_code: string;
  ai_response: string;
  starting_at: number;
  ending_at: number;
};

export type TStep = {
  slug: string;
  position: number;
  files: IFile[];
  is_testeable: boolean;
  opened_at?: number; // The time when the step was opened
  completed_at?: number; // If the step has tests, the time when all the tests passed, else, the time when the user opens the next step
  compilations: TCompilationAttempt[]; // Everytime the user tries to compile the code
  tests: TTestAttempt[]; // Everytime the user tries to run the tests
  ai_interactions: TAIInteraction[]; // Everytime the user interacts with the AI
};

type TWorkoutSession = {
  started_at: number;
  ended_at?: number;
};

type TStudent = {
  token: string;
  user_id: string;
  email: string;
};

export interface ITelemetryJSONSchema {
  telemetry_id?: string;
  student?: TStudent;
  agent?: string;
  tutorial_started_at?: number;
  last_interaction_at?: number;
  steps: Array<TStep>; // The steps should be the same as the exercise
  workout_session: TWorkoutSession[]; // It start when the user starts Learnpack, if the last_interaction_at is available, it automatically fills with that
  // number and start another session
}

type TStepEvent = "compile" | "test" | "ai_interaction" | "open_step";

export type TTelemetryUrls = {
  streaming?: string;
  batch?: string;
};

interface ITelemetryManager {
  current: ITelemetryJSONSchema | null;
  configPath: string | null;
  urls: TTelemetryUrls;
  salute: (message: string) => void;
  start: (agent: string, steps: TStep[], path: string) => void;
  prevStep?: number;
  registerStepEvent: (
    stepPosition: number,
    event: TStepEvent,
    data: any
  ) => void;
  streamEvent: (stepPosition: number, event: string, data: any) => void;
  submit: () => Promise<void>;
  finishWorkoutSession: () => void;
  setStudent: (student: TStudent) => void;
  save: () => void;
  retrieve: (
    agent: string,
    steps: TStep[]
  ) => Promise<ITelemetryJSONSchema | null>;
}

const TelemetryManager: ITelemetryManager = {
  current: null,
  urls: {},
  configPath: "",
  salute: message => {
    console.log(message)
  },

  start: function (agent, steps, path) {
    this.configPath = path
    if (!this.current) {
      this.retrieve(agent, steps)
        .then(data => {
          const prevTelemetry = data
          if (prevTelemetry) {
            this.current = prevTelemetry
            this.finishWorkoutSession()
          } else {
            this.current = {
              telemetry_id: createUUID(),
              agent,
              tutorial_started_at: Date.now(),
              steps,
              workout_session: [
                {
                  started_at: Date.now(),
                },
              ],
            }
          }

          this.save()
          this.submit()
        })
        .catch(error => {
          console.error(error)
        })
    }
  },

  setStudent: function (student) {
    if (!this.current) {
      return
    }

    this.current.student = student
    this.save()
    this.submit()
  },
  finishWorkoutSession: function () {
    if (!this.current) {
      return
    }

    const lastSession =
      this.current?.workout_session[this.current.workout_session.length - 1]
    if (
      lastSession &&
      !lastSession.ended_at &&
      this.current?.last_interaction_at
    ) {
      lastSession.ended_at = this.current.last_interaction_at
      this.current.workout_session.push({
        started_at: Date.now(),
      })
    }
  },

  registerStepEvent: function (stepPosition, event, data) {
    if (!this.current) {
      // throw new Error("Telemetry has not been started");
      return
    }

    const step = this.current.steps[stepPosition]
    if (!step) {
      return
    }

    if (data.source_code) {
      data.source_code = stringToBase64(data.source_code)
    }

    if (data.stdout) {
      data.stdout = stringToBase64(data.stdout)
    }

    if (data.stderr) {
      data.stderr = stringToBase64(data.stderr)
    }

    switch (event) {
      case "compile":
        if (!step.compilations) {
          step.compilations = []
        }

        step.compilations.push(data)
        this.current.steps[stepPosition] = step
        break
      case "test":
        if (!step.tests) {
          step.tests = []
        }

        // data.stdout =
        step.tests.push(data)
        if (data.exit_code === 0) {
          step.completed_at = Date.now()
        }

        this.current.steps[stepPosition] = step
        break
      case "ai_interaction":
        if (!step.ai_interactions) {
          step.ai_interactions = []
        }

        step.ai_interactions.push(data)
        break
      case "open_step": {
        const now = Date.now()

        if (!step.opened_at) {
          step.opened_at = now
          this.current.steps[stepPosition] = step
        }

        if (this.prevStep || this.prevStep === 0) {
          const prevStep = this.current.steps[this.prevStep]
          if (!prevStep.is_testeable && !prevStep.completed_at) {
            prevStep.completed_at = now
            this.current.steps[this.prevStep] = prevStep
          }
        }

        this.prevStep = stepPosition

        this.submit()
        break
      }

      default:
        throw new Error(`Event type ${event} is not supported`)
    }

    this.current.last_interaction_at = Date.now()
    this.streamEvent(stepPosition, event, data)
    this.save()
  },
  retrieve: function () {
    return new Promise((resolve, reject) => {
      fs.readFile(
        `${this.configPath}/telemetry.json`,
        "utf8",
        (err: any, data: any) => {
          if (err) {
            if (err.code === "ENOENT") {
              // File does not exist, resolve with undefined
              resolve(null)
            } else {
              reject(err)
            }
          } else {
            resolve(JSON.parse(data))
          }
        }
      )
    })
  },
  submit: async function () {
    if (!this.current) 
return Promise.resolve()
    const url = this.urls.batch
    if (!url) {
      return
      // throw new Error("Batch URL not specified");
    }

    const body = this.current
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(response => {
        return response.text()
      })
      .catch(error => {
        console.log("Error", error)
      })
  },
  save: function () {
    fs.writeFile(
      `${this.configPath}/telemetry.json`,
      JSON.stringify(this.current),
      (err: any) => {
        if (err) 
throw err
      }
    )
  },

  streamEvent: async function (stepPosition, event, data) {
    if (!this.current) 
return

    const url = this.urls.streaming
    if (!url) {
      return
      // throw new Error("Streaming URL not specified");
    }

    const stepSlug = this.current.steps[stepPosition].slug

    const body = {
      slug: stepSlug,
      telemetry_id: this.current.telemetry_id,
      user_id: this.current.student?.user_id,
      step_position: stepPosition,
      event,
      data,
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      const responseText = await response.text()
    } catch (error) {
      error
      // Console.error(error);
    }
  },
}

export default TelemetryManager
