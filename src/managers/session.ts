import Console from "../utils/console"
import api from "../utils/api"

import v from "validator"
import { ValidationError, InternalError } from "../utils/errors"

import * as fs from "fs"
import cli from "cli-ux"
import * as storage from "node-persist"

import { IPayload, ISession, IStartProps } from "../models/session"
import { IConfigObj } from "../models/config"

const Session: ISession = {
  sessionStarted: false,
  token: null,
  config: null,
  currentCohort: null,
  initialize: async function () {
    if (!this.sessionStarted) {
      if (!this.config) {
        throw InternalError("Configuration not found")
      }

      if (!fs.existsSync(this.config.dirPath)) {
        fs.mkdirSync(this.config.dirPath)
      }

      await storage.init({ dir: `${this.config.dirPath}/.session` })
      this.sessionStarted = true
    }

    return true
  },
  getOpenAIToken: async function () {
    await this.initialize()
    let token = null
    try {
      token = await storage.getItem("openai-token")
    } catch {
      Console.debug("Error retriving openai token")
    }

    return token
  },
  setOpenAIToken: async function (token: string) {
    await this.initialize()
    await storage.setItem("openai-token", token)
    Console.debug("OpenAI token successfuly set")
    return true
  },
  setPayload: async function (value: IPayload) {
    await this.initialize()
    await storage.setItem("bc-payload", { token: this.token, ...value })
    Console.debug("Payload successfuly found and set for " + value.email)
    return true
  },
  getPayload: async function () {
    await this.initialize()
    let payload = null
    try {
      payload = await storage.getItem("bc-payload")
    } catch {
      Console.debug("Error retriving session payload")
    }

    return payload
  },
  isActive: function () {
    /* if (this.token) {
      return true
    } else {
      return false
    } */
    return !!this.token
  },
  get: async function (configObj?: IConfigObj) {
    if (configObj && configObj.config) {
      this.config = configObj.config
    }

    await this.sync()
    if (!this.isActive()) {
      return null
    }

    const payload = await this.getPayload()

    return {
      payload,
      token: this.token,
    }
  },
  login: async function () {
    const email = await cli.prompt("What is your email?")
    if (!v.isEmail(email)) {
      throw ValidationError("Invalid email")
    }

    const password = await cli.prompt("What is your password?", {
      type: "hide",
    })

    const data = await api.login(email, password)
    if (data) {
      cli.log(data)
      this.start({ token: data.token, payload: data })
    }
  },
  loginWeb: async function (email, password) {
    if (!v.isEmail(email)) {
      throw ValidationError("Invalid email")
    }

    const data = await api.login(email, password)
    if (data) {
      this.start({ token: data.token, payload: data })
      return data
    }
  },
  sync: async function () {
    const payload = await this.getPayload()
    if (payload) {
      this.token = payload.token
    }
  },
  start: async function ({ token, payload = null }: IStartProps) {
    if (!token) {
      throw new Error("A token and email is needed to start a session")
    }

    this.token = token

    if (payload && (await this.setPayload(payload))) {
      Console.success(`Successfully logged in as ${payload.email}`)
    }
  },
  destroy: async function () {
    await storage.clear()
    this.token = null
    Console.success("You have logged out")
  },
}

export default Session
