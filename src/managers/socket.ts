import { Socket, Server } from "socket.io";
import Console from "../utils/console";
import queue from "../utils/fileQueue";

import { ISocket, TPossibleActions } from "../models/socket";
import { IConfig } from "../models/config";
import { ICallback, TAction } from "../models/action";
import { IExercise, IExerciseData } from "../models/exercise-obj";
import { TStatus } from "../models/status";
import { TSuccessType } from "../models/success-types";
import * as http from "http";

const SocketManager: ISocket = {
  socket: null,
  config: null,
  allowedActions: [],
  possibleActions: ["build", "reset", "test", "tutorial", "generate"],
  isTestingEnvironment: false,
  actionCallBacks: {
    clean: (_, s: { logs: Array<string> }) => {
      s.logs = [];
    },
  },
  addAllowed: function (actions: Array<TPossibleActions> | TPossibleActions) {
    if (!Array.isArray(actions)) 
actions = [actions];

    // avoid adding the "test" action if grading is disabled
    if (
      actions.includes("test") &&
      this.config?.disabledActions?.includes("test")
    ) {
      actions = actions.filter((a: TPossibleActions) => a !== "test");
    }

    this.allowedActions = [
      ...(this.allowedActions || []).filter(
        (a: TPossibleActions) => !actions.includes(a)
      ),
      ...actions,
    ];
  },
  removeAllowed: function (
    actions: Array<TPossibleActions> | TPossibleActions
  ) {
    if (!Array.isArray(actions)) {
      actions = [actions];
    }

    this.allowedActions = (this.allowedActions || []).filter(
      (a: TPossibleActions) => !actions.includes(a)
    );
  },
  start: function (
    config: IConfig,
    server: http.Server,
    isTestingEnvironment = false
  ) {
    this.config = config;
    this.isTestingEnvironment = isTestingEnvironment;
    this.socket = new Server(server, {
      allowEIO3: true,
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    this.allowedActions =
      this.config?.disabledActions?.includes("test") ||
      this.config?.disableGrading ?
        this.possibleActions.filter(
            a => !this.config?.disabledActions?.includes(a) && a !== "test"
          ) :
        this.possibleActions.filter(a => !this.allowedActions?.includes(a));

    if (this.config?.grading === "incremental") {
      this.removeAllowed("reset");
    }

    if (this.socket) {
      this.socket.on("connection", (socket: Socket) => {
        Console.debug(
          "Connection with client successfully established",
          this.allowedActions
        );
        if (!this.isTestingEnvironment) {
          this.log("ready", ["Ready to compile or test..."]);
        }

        socket.on(
          "compiler",
          ({ action, data }: { action: string; data: IExerciseData }) => {
            this.emit("clean", "pending", ["Working..."]);
            if (typeof data.exerciseSlug === "undefined") {
              this.log("internal-error", ["No exercise slug specified"]);
              Console.error("No exercise slug especified");
              return;
            }

            if (
              this.actionCallBacks &&
              typeof this.actionCallBacks[action] === "function"
            ) {
              this.actionCallBacks[action](data);
            } else {
              this.log("internal-error", ["Uknown action " + action]);
            }
          }
        );
      });
    }
  },
  on: function (action: TAction, callBack: ICallback) {
    if (this.actionCallBacks) {
      this.actionCallBacks[action] = callBack;
    }
  },
  clean: function (_ = "pending", logs = []) {
    this.emit("clean", "pending", logs);
  },
  ask: function (questions = []) {
    return new Promise((resolve, _) => {
      this.emit("ask", "pending", ["Waiting for input..."], questions);
      console.log("Setting up listeners");
      this.on("input", ({ inputs }: any) => {
        // Workaround to fix issue because null inputs

        console.log("inputs", inputs);

        let isNull = false;
        // eslint-disable-next-line
        inputs.forEach((input: any) => {
          if (input === null) {
            isNull = true;
          }
        });

        if (!isNull) {
          resolve(inputs);
        }
      });
    });
  },
  reload: function (
    files: Array<string> | null = null,
    exercises: Array<string> | null = null
  ) {
    this.emit(
      "reload",
      files?.join("") || "" /* TODO: Check it out this */,
      exercises!
    );
  },
  openWindow: function (url = "") {
    queue.dispatcher().enqueue(queue.events.OPEN_WINDOW, url);
    this.emit(
      queue.events.OPEN_WINDOW as TAction,
      "ready",
      [`Opening ${url}`],
      [],
      [],
      url
    );
  },
  log: function (
    status: TStatus,
    messages: string | Array<string> = [],
    report: Array<string> = [],
    data: any = null
  ) {
    this.emit("log", status, messages, [], report, data);
    Console.log(messages);
  },
  emit: function (
    action: TAction,
    status: TStatus | string = "ready",
    logs: string | Array<string> = [],
    inputs: Array<string> = [],
    report: Array<string> = [],
    data: any = null
  ) {
    if (
      this.config?.compiler &&
      ["webpack", "vanillajs", "vue", "react", "css", "html"].includes(
        this.config?.compiler
      )
    ) {
      if (["compiler-success", "compiler-warning"].includes(status))
        this.addAllowed("preview");
      if (["compiler-error"].includes(status) || action === "ready")
        this.removeAllowed("preview");
    }

    if (this.config?.grading === "incremental") {
      this.removeAllowed("reset");
    }

    // eslint-disable-next-line
    this.config?.disabledActions?.forEach((a) => this.removeAllowed(a));

    this.socket?.emit("compiler", {
      action,
      status,
      logs,
      allowed: this.allowedActions,
      inputs,
      report,
      data,
    });
  },

  ready: function (message: string) {
    this.log("ready", [message]);
  },
  success: function (type: TSuccessType, stdout: string) {
    const types = ["compiler", "testing"];
    if (!types.includes(type))
      this.fatal(`Invalid socket success type "${type}" on socket`);
    else if (stdout === "")
      this.log((type + "-success") as TSuccessType, [
        "No stdout to display on the console",
      ]);
    else 
this.log((type + "-success") as TSuccessType, [stdout]);
  },
  error: function (type: TStatus, stdout: string) {
    console.error("Socket error: " + type, stdout);
    this.log(type, [stdout]);

    if (this.isTestingEnvironment) {
      this.onTestingFinished({
        result: "failed",
      });
    }
  },
  complete: function () {
    console.log("complete");
  },

  fatal: function (msg: string) {
    this.log("internal-error", [msg]);
    throw msg;
  },
  onTestingFinished: function (result: any) {
    if (this.config?.testingFinishedCallback) {
      this.config.testingFinishedCallback(result);
    }
  },
};

export default SocketManager;
