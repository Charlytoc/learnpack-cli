// import  {Command, flags} from '@oclif/command'
// import { prompt } from "enquirer"
// import fetch from 'node-fetch'
import SessionCommand from "../utils/SessionCommand"
import SessionManager from "../managers/session"
// import Console from '../utils/console'
// import { replace } from 'node-emoji'
// import { validURL } from "../utils/validators"
// const BaseCommand from '../utils/BaseCommand');

class LogoutCommand extends SessionCommand {
  static description = `Describe the command here
  ...
  Extra documentation goes here
  `

  static flags: any = {
    // name: flags.string({char: 'n', description: 'name to print'}),
  }

  static args = [
    {
      name: "package", // name of arg to show in help and reference with args[name]
      required: false, // make the arg required with `required: true`
      description:
        "The unique string that identifies this package on learnpack", // help description
      hidden: false, // hide this arg from help
    },
  ]

  async init() {
    const { flags } = this.parse(LogoutCommand)
    await this.initSession(flags)
  }

  async run() {
    // const {flags, args} = this.parse(LogoutCommand)

    SessionManager.destroy()
  }
}

export default LogoutCommand
