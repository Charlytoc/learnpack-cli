import Console from "../../utils/console"
import * as express from "express"
import * as fs from "fs"
import * as bodyParser from "body-parser"
import socket from "../socket"
import queue from "../../utils/fileQueue"
// import gitpod from '../gitpod'
import { detect, filterFiles } from "../config/exercise"
import { IFile } from "../../models/file"
import { IConfigObj, TEntries } from "../../models/config"
import { IConfigManager } from "../../models/config-manager"
import { IExercise } from "../../models/exercise-obj"
import SessionManager from "../../managers/session"

const withHandler =
  (func: (req: express.Request, res: express.Response) => void) =>
  (req: express.Request, res: express.Response) => {
    try {
      func(req, res)
    } catch (error) {
      Console.debug(error)
      const _err = {
        message: (error as TypeError).message || "There has been an error",
        status: (error as any).status || 500,
        type: (error as any).type || null,
      }
      Console.error(_err.message)

      // send rep to the server
      res.status(_err.status)
      res.json(_err)
    }
  }

export default async function (
  app: express.Application,
  configObject: IConfigObj,
  configManager: IConfigManager
) {
  const { config, exercises } = configObject
  const session = await SessionManager.get(configManager?.get())

  const dispatcher = queue.dispatcher({
    create: true,
    path: `${config?.dirPath}/vscode_queue.json`,
  })
  app.get(
    "/config",
    withHandler((_: express.Request, res: express.Response) => {
      res.json(configObject)
    })
  )

  // Added this line to parse the json body

  const jsonBodyParser = bodyParser.json()
  // Trying to log in from frontend
  app.post(
    "/login",
    jsonBodyParser,
    withHandler(async (req: express.Request, res: express.Response) => {
      const email = req.body.email
      const password = req.body.password

      SessionManager.destroy()
      const payload = await SessionManager.loginWeb(email, password)

      res.json(payload)
    })
  )
  app.post(
    "/set-rigobot-token",
    jsonBodyParser,
    withHandler(async (req: express.Request, res: express.Response) => {
      const token = req.body.token
      // Ensure token is provided in the request body
      if (!token) {
        return res.status(400).json({ error: "Token is required" })
      }

      try {
        const tokenSaved = await SessionManager.setRigoToken(token)
        // Check if the token was saved successfully
        if (tokenSaved) {
          res.json({ status: "ok" })
        } else {
          res.status(500).json({ error: "Failed to save the token" })
        }
      } catch {
        // Handle any unexpected errors during the process
        res.status(500).json({ error: "Internal server error" })
      }
    })
  )
  app.get(
    "/check/rigo/status",
    withHandler(async (_: express.Request, res: express.Response) => {
      const payload = await SessionManager.getPayload()

      if (payload && payload.rigobot && payload.rigobot.key) {
        res.json({ rigoToken: payload.rigobot.key })
      } else {
        res
          .status(400)
          .json({ details: `Rigobot token not found, please log in first!` })
      }
    })
  )

  // symbolic link to maintain path compatiblity
  const fetchStaticAsset = withHandler((req, res) => {
    const filePath = `${config?.dirPath}/assets/${req.params.filePath}`
    if (!fs.existsSync(filePath))
      throw new Error("File not found: " + filePath)
    const content = fs.readFileSync(filePath)
    res.write(content)
    res.end()
  })

  app.get(
    `${
      config?.dirPath.indexOf("./") === 0 ?
        config.dirPath.slice(1) :
        config?.dirPath
    }/assets/:filePath`,
    fetchStaticAsset
  )

  app.get("/assets/:filePath", fetchStaticAsset)

  app.get(
    "/exercise",
    withHandler((_: express.Request, res: express.Response) => {
      res.json(exercises)
    })
  )

  app.get(
    "/exercise/:slug/readme",
    withHandler(
      (
        { params: { slug }, query: { lang } }: express.Request,
        res: express.Response
      ) => {
        const exercise: IExercise = configManager.getExercise(slug)

        if (exercise && exercise.getReadme) {
          const readme = exercise.getReadme((lang as string) || null)
          res.json(readme)
        } else {
          res.status(400)
        }
      }
    )
  )

  app.get(
    "/exercise/:slug/report",
    withHandler(
      ({ params: { slug } }: express.Request, res: express.Response) => {
        const exercise = configManager.getExercise(slug)
        if (exercise && exercise.getTestReport) {
          const report = exercise.getTestReport()
          res.json(JSON.stringify(report))
        }
      }
    )
  )

  app.get(
    "/exercise/:slug",
    withHandler((req: express.Request, res: express.Response) => {
      // no need to re-start exercise if it's already started
      if (
        configObject.currentExercise &&
        req.params.slug === configObject.currentExercise
      ) {
        const exercise = configManager.getExercise(req.params.slug)
        res.json(exercise)
        return
      }

      const exercise = configManager.startExercise(req.params.slug)
      dispatcher.enqueue(dispatcher.events.START_EXERCISE, req.params.slug)

      type TEntry = "python3" | "html" | "node" | "react" | "java";

      const entries = new Set(
        Object.keys(config?.entries!).map(
          lang => config?.entries[lang as TEntry]
        )
      )

      // if we are in incremental grading, the entry file can by dinamically detected
      // based on the changes the student is making during the exercise
      if (config?.grading === "incremental") {
        const scanedFiles = fs.readdirSync("./")

        // update the file hierarchy with updates
        exercise.files = [
          ...exercise.files.filter(f => f.name.includes("test.")),
          ...filterFiles(scanedFiles),
        ]
        Console.debug(`Exercise updated files: `, exercise.files)
      }

      const detected = detect(
        configObject,
        exercise.files
          .filter(fileName => entries.has(fileName.name))
          .map(f => f.name || f) as string[]
      )

      // if a new language for the testing engine is detected, we replace it
      // if not we leave it as it was before
      if (config?.language && !["", "auto"].includes(config?.language)) {
        Console.debug(
          `Exercise language ignored, instead imported from configuration ${config?.language}`
        )
        exercise.language = detected?.language
      } else if (
        detected?.language &&
        (!config?.language || config?.language === "auto")
      ) {
        Console.debug(
          `Switching to ${detected.language} engine in this exercise`
        )
        exercise.language = detected.language
      }

      // WARNING: has to be the FULL PATH to the entry path
      // We need to detect entry in both gradings: Incremental and Isolate
      exercise.entry = detected?.entry
      Console.debug(
        `Exercise detected entry: ${detected?.entry} and language ${exercise.language}`
      )

      // exercises.graded and exercises.disableGrading deprecated.
      if (
        !exercise.graded ||
        config?.disableGrading ||
        config?.disabledActions?.includes("test")
      ) {
        socket.removeAllowed("test")
      } else {
        socket.addAllowed("test")
      }

      if (!exercise.entry || config?.disabledActions?.includes("build")) {
        socket.removeAllowed("build")
      } else {
        socket.addAllowed("build")
      }

      if (
        exercise.files.filter(
          (f: IFile) =>
            !f.name.toLowerCase().includes("readme.") &&
            !f.name.toLowerCase().includes("test.")
        ).length === 0 ||
        config?.disabledActions?.includes("reset")
      ) {
        socket.removeAllowed("reset")
      } else if (!config?.disabledActions?.includes("reset")) {
        socket.addAllowed("reset")
      }

      socket.log("ready")

      res.json(exercise)
    })
  )

  app.get(
    "/exercise/:slug/file/:fileName",
    withHandler((req: express.Request, res: express.Response) => {
      const exercise = configManager.getExercise(req.params.slug)
      if (exercise && exercise.getFile) {
        res.write(exercise.getFile(req.params.fileName))
        res.end()
      }
    })
  )

  /*
  app.post(
    "/exercise/:slug/file/:fileName",
    withHandler((req: express.Request, res: express.Response) => {
      get tokens but also, add allowed action for 'generate'
      use the sessionManager to keep compatibility with the cli login command.
    })
  );
  */

  const textBodyParser = bodyParser.text()
  app.put(
    "/exercise/:slug/file/:fileName",
    textBodyParser,
    withHandler((req: express.Request, res: express.Response) => {
      const exercise = configManager.getExercise(req.params.slug)
      if (exercise && exercise.saveFile) {
        exercise.saveFile(req.params.fileName, req.body)
        res.end()
      }
    })
  )

  if (config?.outputPath) {
    app.use("/preview", express.static(config.outputPath))
  }

  app.use("/", express.static(`${config?.dirPath}/_app`))
}
