// import {flags} from '@oclif/command'
import Console from "../utils/console"
import SessionCommand from "../utils/SessionCommand"

class CleanCommand extends SessionCommand {
  static description = `Clean the configuration object
  ...
  Extra documentation goes here
  `

  static flags: any = {
    // name: flags.string({char: 'n', description: 'name to print'}),
  }

  async init() {
    const { flags } = this.parse(CleanCommand)
    await this.initSession(flags)
  }

  async run() {
    const { flags } = this.parse(CleanCommand)

    this.configManager?.clean()

    Console.success("Package cleaned successfully, ready to publish")
  }
}

export default CleanCommand
