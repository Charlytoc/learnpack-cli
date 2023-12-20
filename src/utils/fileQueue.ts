import logger from "../utils/console"
import * as fs from "fs"
// import em from "events"
import * as XXH from "xxhashjs"

// possible events to dispatch
const events = {
  START_EXERCISE: "start_exercise",
  INIT: "initializing",
  RUNNING: "configuration_loaded",
  END: "connection_ended",
  RESET_EXERCISE: "reset_exercise",
  OPEN_FILES: "open_files",
  OPEN_WINDOW: "open_window",
  INSTRUCTIONS_CLOSED: "instructions_closed",
}

let options = {
  path: null,
  create: false,
}
let lastHash: any = null
let watcher: any = null // subscribe to file and listen to changes
let actions: any = null // action queue

const loadDispatcher = (opts: any) => {
  actions = [{ name: "initializing", time: now() }]
  logger.debug(`Loading from ${opts.path}`)

  let exists = fs.existsSync(opts.path)
  if (opts.create) {
    if (exists) 
actions.push({ name: "reset", time: now() })
    fs.writeFileSync(opts.path, JSON.stringify(actions), { flag: "w" })
    exists = true
  }

  if (!exists)
    throw new Error(`Invalid queue path, missing file at: ${opts.path}`)

  let incomingActions = []
  try {
    const content = fs.readFileSync(opts.path, "utf-8")
    incomingActions = JSON.parse(content)
    if (!Array.isArray(incomingActions)) 
incomingActions = []
  } catch {
    incomingActions = []
    logger.debug("Error loading VSCode Actions file")
  }

  logger.debug("Actions load ", incomingActions)
  return incomingActions
}

// eslint-disable-next-line
const enqueue = (name: string, data: any | undefined = undefined) => {
  if (!Object.values(events).includes(name)) {
    logger.debug(`Invalid event ${name}`)
    throw new Error(`Invalid action ${name}`)
  }

  if (!actions) 
actions = []

  actions.push({ name, time: now(), data: data })
  logger.debug(`EMIT -> ${name}:Exporting changes to ${options.path}`)

  return fs.writeFileSync(options.path || "", JSON.stringify(actions))
}

const now = () => {
  const hrTime = process.hrtime()
  // eslint-disable-next-line
  const htTime0 = hrTime[0] * 1000000;
  return (htTime0 + hrTime[1]) / 1000
}

const loadFile = (filePath: string) => {
  if (!fs.existsSync(filePath))
    throw new Error(`No queue.json file to load on ${filePath}`)

  const content = fs.readFileSync(filePath, "utf8")
  const newHash = XXH.h32(content, 0xAB_CD).toString(16)
  const isUpdated = lastHash !== newHash
  lastHash = newHash
  const incomingActions = JSON.parse(content)
  return { isUpdated, incomingActions }
}

const dequeue = () => {
  // first time dequeue loads
  if (!actions) 
actions = []

  const { isUpdated, incomingActions } = loadFile(options.path || "")

  if (!isUpdated) {
    /**
     * make sure no tasks are executed from the queue by matching both
     * queues (the incoming with current one)
     */
    actions = incomingActions
    logger.debug(
      `No new actions to process: ${actions.length}/${incomingActions.length}`
    )
    return null
  }

  // do i need to reset actions to zero?
  if (actions.length > 0 && actions[0].time !== incomingActions[0].time) {
    actions = []
  }

  const action = incomingActions[incomingActions.length - 1]
  logger.debug("Dequeing action ", action)
  actions.push(action)
  return action
}

const pull = (callback: (T: any) => any) => {
  logger.debug("Pulling actions")
  let incoming = dequeue()
  while (incoming) {
    callback(incoming)
    incoming = dequeue()
  }
}

const reset = (callback: (T?: any) => any) => {
  logger.debug("Queue reseted")
  actions = []
  if (fs.existsSync(options.path || "")) {
    fs.writeFileSync(options.path || "", "[]")
    callback()
  }
}

const onPull = (callback: (T?: any) => any) => {
  // eslint-disable-next-line
  const chokidar = require("chokidar");

  logger.debug("Starting to listen...")
  try {
    loadFile(options.path || "")
  } catch {
    logger.debug("No previoues queue file, waiting for it to be created...")
  }

  if (!watcher) {
    logger.debug(`Watching ${options.path}`)
    watcher = chokidar.watch(`${options.path}`, {
      persistent: true,
    })
  } else 
logger.debug("Already watching queue path")

  watcher.on("add", () => pull(callback)).on("change", () => pull(callback))

  return true
}

const onReset = (callback: (T?: any) => any) => {
  // eslint-disable-next-line
  const chokidar = require("chokidar");

  if (!watcher) {
    logger.debug(`Watching ${options.path}`)
    watcher = chokidar.watch(`${options.path}`, {
      persistent: true,
    })
  }

  watcher.on("unlink", () => reset(callback))

  return true
}

export default {
  events,
  dispatcher: (opts: any = {}) => {
    if (!actions) {
      options = { ...options, ...opts }
      logger.debug("Initializing queue dispatcher", options)
      actions = loadDispatcher(options)
    }

    return { enqueue, events }
  },
  listener: (opts: any = {}) => {
    if (!actions) {
      options = { ...options, ...opts }
      logger.debug("Initializing queue listener", options)
    }

    return { onPull, onReset, events }
  },
}
