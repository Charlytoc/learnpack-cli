import * as chokidar from "chokidar"
import Console from "./console"
import * as debounce from "debounce"
import { IConfigManager } from "../models/config-manager"

export default (path: string, reloadSocket: (filename: string) => void) =>
  new Promise((resolve /* , reject */) => {
    Console.debug("PATH:", path)
    const watcher = chokidar.watch(path, {
      // TODO: This watcher is not ready yet
      // ignored: /^(?=.*(\.\w+)$)(?!.*\.md$).*$/gm,
      ignored: /\.pyc$/,
      ignoreInitial: true,
    })
    const onChange = (eventname: string, _filename: string) => {
      // Console.info(`Event ${eventname} detected. in file: ${_filename}`)
      resolve(_filename)
      reloadSocket(_filename)
    }

    watcher.on("all", debounce(onChange, 500, true))
    // watcher.on('all', onChange)
    process.on("SIGINT", function () {
      watcher.close()
      process.exit()
    })
  })
