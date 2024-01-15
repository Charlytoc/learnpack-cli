import { Command /* , flags */ } from "@oclif/command"
// import fetch from 'node-fetch'
import { clone } from "../managers/file"
import Console from "../utils/console"
import api from "../utils/api"
import { askPackage } from "../ui/download"
// const BaseCommand = require('../utils/BaseCommand');

class DownloadCommand extends Command {
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
  // async init() {
  //   const {flags} = this.parse(DownloadCommand)
  //   await this.initSession(flags)
  // }

  async run() {
    const { /* flags, */ args } = this.parse(DownloadCommand)
    // start watching for file changes
    let _package: string = args.package
    if (!_package) {
      _package = (await askPackage()) as string
    }

    if (!_package) {
      return null
    }

    try {
      const packageInfo = await api.getAllPackages({ slug: _package })
      if (packageInfo.results.length === 0)
        Console.error(`Package ${_package} not found`)
      else
        clone(packageInfo.results[0].repository)
          .then(_result => {
            Console.success("Successfully downloaded")
            Console.info(
              `You can now CD into the folder like this: $ cd ${_package}`
            )
          })
          .catch(error => Console.error(error.message || error))
    } catch {}
  }
}

export default DownloadCommand
