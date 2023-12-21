import * as express from "express"
// eslint-disable-next-line
import * as cors from "cors";
import * as http from "http"
import Console from "../../utils/console"
import addRoutes from "./routes"
import cli from "cli-ux"
import { IConfigObj } from "../../models/config"
import { IConfigManager } from "../../models/config-manager"

export let TEST_SERVER: http.Server

export default async function (
  configObj: IConfigObj,
  configManager: IConfigManager,
  isTestingEnvironment = false
) {
  const { config } = configObj
  const app = express()
  let server: any

  if (isTestingEnvironment) {
    if (TEST_SERVER === undefined) 
TEST_SERVER = require("http").Server(app)
    server = TEST_SERVER
  } else 
server = require("http").Server(app)

  app.use(cors())

  // app.use(function(req, res, next) {
  //     res.header("Access-Control-Allow-Origin", "*")
  //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  //     res.header("Access-Control-Allow-Methods", "GET,PUT")
  //     next()
  // })

  // add all needed endpoints

  await addRoutes(app, configObj, configManager)

  server.listen(isTestingEnvironment ? 5000 : config?.port, function () {
    if (!isTestingEnvironment) {
      Console.success(
        `Exercises are running 😃 Open your browser to start practicing!`
      )
      Console.success(`\n            Open the exercise on this link:`)
      Console.log(`            ${config?.publicUrl}`)
      if (config?.editor.mode === "standalone") 
cli.open(`${config.publicUrl}`)
    }
  })

  const sockets: any = new Set()

  server.on("connection", (socket: any) => {
    sockets.add(socket)

    server.once("close", () => {
      sockets.delete(socket)
    })
  })

  /**
   * Forcefully terminates HTTP server.
   */
  server.terminate = (callback: void) => {
    for (const socket of sockets) {
      socket.destroy()

      sockets.delete(socket)
    }

    server.close(callback)
  }

  return server
}
