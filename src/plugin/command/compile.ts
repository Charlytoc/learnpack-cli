import { IError } from "../../models/errors"

const CompilationError = (messages: string) => {
  const _err: IError = new Error(messages)
  _err.status = 400
  _err.stdout = messages
  _err.type = "compiler-error"
  return _err
}

export default {
  CompilationError,
  default: async ({ action, ...rest }: any) => {
    const stdout = await action.run(rest)
    return stdout
  },
}
