import * as fs from "fs"
import { IError } from "../../models/errors"

const TestingError = (messages: string) => {
  const _err: IError = new Error(messages)
  _err.status = 400
  _err.stdout = messages
  _err.type = "testing-error"
  return _err
}

export default {
  TestingError,
  default: async function (args: any) {
    const { action, configuration, socket, exercise } = args

    if (!fs.existsSync(`${configuration.dirPath}/reports`)) {
      // reports directory
      fs.mkdirSync(`${configuration.dirPath}/reports`)
    }

    // compile
    const stdout = await action.run(args)

    // mark exercise as done
    exercise.done = true

    return stdout
  },
}
