import * as chalk from "chalk"

const getMatches = (reg: RegExp, content: string) => {
  const inputs = []
  let m
  while ((m = reg.exec(content)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === reg.lastIndex) 
reg.lastIndex++

    // The result can be accessed through the `m`-variable.
    inputs.push(m[1] || null)
  }

  return inputs
}

const cleanStdout = (buffer: string, inputs: string[]) => {
  if (Array.isArray(inputs))
    for (let i = 0; i < inputs.length; i++)
      if (inputs[i]) 
buffer = buffer.replace(inputs[i], "")

  return buffer
}

const indent = (string: string, options: any, count = 1) => {
  options = {
    indent: " ",
    includeEmptyLines: false,
    ...options,
  }

  if (typeof string !== "string") {
    throw new TypeError(
      `Expected \`input\` to be a \`string\`, got \`${typeof string}\``
    )
  }

  if (typeof count !== "number") {
    throw new TypeError(
      `Expected \`count\` to be a \`number\`, got \`${typeof count}\``
    )
  }

  if (count < 0) {
    throw new RangeError(
      `Expected \`count\` to be at least 0, got \`${count}\``
    )
  }

  if (typeof options.indent !== "string") {
    throw new TypeError(
      `Expected \`options.indent\` to be a \`string\`, got \`${typeof options.indent}\``
    )
  }

  if (count === 0) {
    return string
  }

  const regex = options.includeEmptyLines ? /^/gm : /^(?!\s*$)/gm

  return string.replace(regex, options.indent.repeat(count))
}

const Console = {
  // _debug: true,
  _debug: process.env.DEBUG === "true",
  startDebug: function () {
    this._debug = true
  },
  log: (msg: string, ...args: any[]) => console.log(chalk.gray(msg), ...args),
  error: (msg: string, ...args: any[]) =>
    console.log(chalk.red("⨉ " + msg), ...args),
  success: (msg: string, ...args: any[]) =>
    console.log(chalk.green("✓ " + msg), ...args),
  info: (msg: string, ...args: any[]) =>
    console.log(chalk.blue("ⓘ " + msg), ...args),
  help: (msg: string) =>
    console.log(`${chalk.white.bold("⚠ help:")} ${chalk.white(msg)}`),
  debug(...args: any[]) {
    this._debug && console.log(chalk.magentaBright(`⚠ debug: `), args)
  },
}

export default { getMatches, cleanStdout, indent, Console }
