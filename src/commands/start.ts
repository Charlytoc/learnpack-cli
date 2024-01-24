// import path from "path";
import { flags } from "@oclif/command"

import SessionCommand from "../utils/SessionCommand"
import Console from "../utils/console"
import socket from "../managers/socket"
import TelemetryManager from "../managers/telemetry"

import queue from "../utils/fileQueue"
import {
  decompress,
  downloadEditor,
  checkIfDirectoryExists,
} from "../managers/file"
import { prioritizeHTMLFile } from "../utils/misc"

import createServer from "../managers/server"

import { IGitpodData } from "../models/gitpod-data"
import { IExercise, IExerciseData } from "../models/exercise-obj"

export default class StartCommand extends SessionCommand {
  static description = "Runs a small server with all the exercise instructions"

  static flags = {
    ...SessionCommand.flags,
    port: flags.string({ char: "p", description: "server port" }),
    host: flags.string({ char: "h", description: "server host" }),
    disableGrading: flags.boolean({
      char: "D",
      description: "disble grading functionality",
      default: false,
    }),
    // disableGrading: flags.boolean({char: 'dg', description: 'disble grading functionality', default: false }),
    watch: flags.boolean({
      char: "w",
      description: "Watch for file changes",
      default: false,
    }),
    editor: flags.string({
      char: "e",
      description: "[standalone, gitpod]",
      options: ["standalone", "gitpod"],
    }),
    version: flags.string({
      char: "v",
      description: "E.g: 1.0.1",
      default: undefined,
    }),
    grading: flags.string({
      char: "g",
      description: "[isolated, incremental]",
      options: ["isolated", "incremental"],
    }),
    debug: flags.boolean({
      char: "d",
      description: "debugger mode for more verbage",
      default: false,
    }),
  }

  // 🛑 IMPORTANT
  // Every command that will use the configManager needs this init method
  async init() {
    const { flags } = this.parse(StartCommand)
    await this.initSession(flags)
  }

  async run() {
    // get configuration object
    const configObject = this.configManager?.get()
    const config = configObject?.config

    if (configObject) {
      const { config } = configObject

      // build exerises
      this.configManager?.buildIndex()

      Console.debug(
        `Grading: ${config?.grading} ${
          config?.disabledActions?.includes("test") ? "(disabled)" : ""
        }, editor: ${config?.editor.mode} ${config?.editor.version}, for ${
          Array.isArray(configObject?.exercises) ?
            configObject?.exercises.length :
            0
        } exercises found`
      )

      const appAlreadyExists = checkIfDirectoryExists(
        `${config?.dirPath}/_app`
      )

      if (!appAlreadyExists) {
        // download app and decompress
        await downloadEditor(
          config?.editor.version,
          `${config?.dirPath}/app.tar.gz`
        )

        Console.info("Decompressing LearnPack UI, this may take a minute...")
        await decompress(
          `${config?.dirPath}/app.tar.gz`,
          `${config?.dirPath}/_app/`
        )
      }

      // listen to socket commands
      if (config && this.configManager) {
        const server = await createServer(
          configObject,
          this.configManager,
          process.env.NODE_ENV === "test"
        )

        const dispatcher = queue.dispatcher({
          create: true,
          path: `${config.dirPath}/vscode_queue.json`,
        })

        socket.start(config, server, false)

        socket.on("open", (data: IGitpodData) => {
          Console.debug("Opening these files: ", data)

          const files = prioritizeHTMLFile(data.files)

          dispatcher.enqueue(dispatcher.events.OPEN_FILES, files)
          socket.ready("Ready to compile...")
        })

        socket.on("open_window", (data: IGitpodData) => {
          Console.debug("Opening window: ", data)
          dispatcher.enqueue(dispatcher.events.OPEN_WINDOW, data)
          socket.ready("Ready to compile...")
        })

        socket.on("reset", (exercise: IExerciseData) => {
          try {
            this.configManager?.reset(exercise.exerciseSlug)
            dispatcher.enqueue(
              dispatcher.events.RESET_EXERCISE,
              exercise.exerciseSlug
            )
            socket.ready("Ready to compile...")
          } catch (error) {
            socket.error(
              "compiler-error",
              (error as TypeError).message ||
                "There was an error reseting the exercise"
            )
            setTimeout(() => socket.ready("Ready to compile..."), 2000)
          }
        })
        // socket.on("preview", (data) => {
        //   Console.debug("Preview triggered, removing the 'preview' action ")
        //   socket.removeAllowed("preview")
        //   socket.log('ready',['Ready to compile...'])
        // })

        socket.on("build", async (data: IExerciseData) => {
          const exercise = this.configManager?.getExercise(data.exerciseSlug)

          if (!exercise?.language) {
            socket.error(
              "compiler-error",
              "Impossible to detect language to build for " +
                data.exerciseSlug +
                "..."
            )
            return
          }

          socket.log(
            "compiling",
            "Building exercise " +
              data.exerciseSlug +
              " with " +
              exercise.language +
              "..."
          )
          await this.config.runHook("action", {
            action: "compile",
            socket,
            configuration: config,
            exercise,
          })
        })

        socket.on("telemetry", (data: any) => {
          Console.info("Registering telemetry event: ", data)
          TelemetryManager.registerEvent(data)
        })

        socket.on("test", async (data: IExerciseData) => {
          const exercise = this.configManager?.getExercise(data.exerciseSlug)

          if (!exercise?.language) {
            socket.error(
              "compiler-error",
              "Impossible to detect engine language for testing for " +
                data.exerciseSlug +
                "..."
            )
            return
          }

          if (
            config?.disabledActions!.includes("test") ||
            config?.disableGrading
          ) {
            socket.ready("Grading is disabled on configuration")
            return true
          }

          socket.log(
            "testing",
            "Testing your exercise using the " + exercise.language + " engine."
          )

          await this.config.runHook("action", {
            action: "test",
            socket,
            configuration: config,
            exercise,
          })

          this.configManager?.save()

          return true
        })

        const terminate = () => {
          Console.debug("Terminating Learnpack...")
          server.terminate(() => {
            this.configManager?.noCurrentExercise()
            dispatcher.enqueue(dispatcher.events.END)
            process.exit()
          })
        }

        server.on("close", terminate)
        process.on("SIGINT", terminate)
        process.on("SIGTERM", terminate)
        process.on("SIGHUP", terminate)

        // finish the server startup
        setTimeout(() => dispatcher.enqueue(dispatcher.events.RUNNING), 1000)

        // start watching for file changes
        if (StartCommand.flags.watch)
          this.configManager.watchIndex(_filename => {
            // Instead of reloading with socket.reload(), I just notify the frontend for the file change
            socket.emit("file_change", "ready", _filename)
          })
      }
    }
  }
}
