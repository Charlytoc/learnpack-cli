import { Command } from "@oclif/command"
import Console from "./console"
import { createInterface } from "readline"
// import SessionManager from '../managers/session'

class BaseCommand extends Command {
  async catch(err: any) {
    Console.debug("COMMAND CATCH", err)

    throw err
  }

  async init() {
    const { flags, args } = this.parse(BaseCommand)
    Console.debug("COMMAND INIT")
    Console.debug("These are your flags: ", flags)
    Console.debug("These are your args: ", args)

    // quick fix for listening to the process termination on windows
    if (process.platform === "win32") {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      rl.on("SIGINT", function () {
        // process.emit('SIGINT')
        // process.emit('SIGINT')
      })
    }

    process.on("SIGINT", function () {
      Console.debug("Terminated (SIGINT)")
      process.exit()
    })
  }

  async finally() {
    Console.debug("COMMAND FINALLY")
    // called after run and catch regardless of whether or not the command errored
  }

  async run() {
    // console.log('running my command')
  }
}

export default BaseCommand
