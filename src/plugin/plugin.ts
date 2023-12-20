import * as shell from "shelljs"
import { IPluginConfig } from "../models/plugin-config"
/**
 * Main Plugin Runner, it defines the behavior of a learnpack plugin
 * dividing it in "actions" like: Compile, test, etc.
 * @param {object} pluginConfig Configuration object that must defined language and each possible action.
 */
export default (pluginConfig: IPluginConfig) => {
  return async (args: any) => {
    const { action, exercise, socket, configuration } = args

    if (pluginConfig.language === undefined)
      throw new Error(`Missing language on the plugin configuration object`)

    if (typeof action !== "string") {
      throw new TypeError("Missing action property on hook details")
    }

    if (!exercise || exercise === undefined) {
      throw new Error("Missing exercise information")
    }

    type actionType = "compile" | "test";

    // if the action does not exist I don't do anything
    if (pluginConfig[action as actionType] === undefined) {
      console.log(`Ignoring ${action}`)
      return () => null
    }

    // ignore if the plugin language its not the same as the exercise language
    if (exercise.language !== pluginConfig.language) {
      return () => null
    }

    if (!exercise.files || exercise.files.length === 0) {
      throw new Error(`No files to process`)
    }

    try {
      const _action = pluginConfig[action as actionType]

      if (_action === null || typeof _action !== "object")
        throw new Error(
          `The ${pluginConfig.language} ${action} module must export an object configuration`
        )
      if (_action.validate === undefined)
        throw new Error(
          `Missing validate method for ${pluginConfig.language} ${action}`
        )
      if (_action.run === undefined)
        throw new Error(
          `Missing run method for ${pluginConfig.language} ${action}`
        )
      if (_action.dependencies !== undefined) {
        if (!Array.isArray(_action.dependencies))
          throw new Error(
            `${action}.dependencies must be an array of package names`
          )

        for (const packageName of _action.dependencies) {
          if (!shell.which(packageName)) {
            throw new Error(
              `🚫 You need to have ${packageName} installed to run test the exercises`
            )
          }
        }
      }

      const valid = await _action.validate({ exercise, configuration })
      if (valid) {
        // look for the command standard implementation and execute it
        const execute = require("./command/" + action + ".js").default
        // no matter the command, the response must always be a stdout
        const stdout = await execute({
          ...args,
          action: _action,
          configuration,
        })

        // Map the action names to socket messaging standards
        const actionToSuccessMapper = { compile: "compiler", test: "testing" }

        socket.success(actionToSuccessMapper[action as actionType], stdout)
        return stdout
      }
    } catch (error: any) {
      if (error.type === undefined) 
socket.fatal(error)
      else 
socket.error(error.type, error.stdout)
    }
  }
}
