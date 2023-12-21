import SessionCommand from "../utils/SessionCommand"
import SessionManager from "../managers/session"
import Console from "../utils/console"

class LoginCommand extends SessionCommand {
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
    const { flags } = this.parse(LoginCommand)
    await this.initSession(flags)
  }

  async run() {
    /* const {flags, args} = */ this.parse(LoginCommand)

    try {
      await SessionManager.login()
    } catch (error) {
      Console.error("Error trying to authenticate")
      Console.error((error as TypeError).message || (error as string))
    }
  }
}

export default LoginCommand
