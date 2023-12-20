import Console from "../utils/console"
import * as storage from "node-persist"
import cli from "cli-ux"
const HOST = "https://breathecode.herokuapp.com"
const RIGOBOT_HOST = "https://rigobot.herokuapp.com"

// eslint-disable-next-line
const _fetch = require("node-fetch");

interface IHeaders {
  "Content-Type"?: string;
  Authorization?: string;
}

interface IOptions {
  headers?: IHeaders;
  method?: string;
  body?: string;
}

const fetch = async (url: string, options: IOptions = {}) => {
  const headers: IHeaders = { "Content-Type": "application/json" }
  Console.log(`Fetching ${url}`)
  let session = null
  try {
    session = await storage.getItem("bc-payload")
    if (session.token && session.token !== "" && !url.includes("/token"))
      headers.Authorization = "Token " + session.token
  } catch {}

  try {
    const resp = await _fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    } as any)

    if (resp.status >= 200 && resp.status < 300) 
return await resp.json()
    if (resp.status === 401)
      throw APIError("Invalid authentication credentials", 401)
    else if (resp.status === 404) 
throw APIError("Package not found", 404)
    else if (resp.status >= 500)
      throw APIError("Impossible to connect with the server", 500)
    else if (resp.status >= 400) {
      const error = await resp.json()
      if (error.detail || error.error) {
        throw APIError(error.detail || error.error)
      } else if (error.nonFieldErrors) {
        throw APIError(error.nonFieldErrors[0], error)
      } else if (typeof error === "object") {
        if (Object.keys(error).length > 0) {
          const key = error[Object.keys(error)[0]]
          throw APIError(`${key}: ${error[key][0]}`, error)
        }
      } else {
        throw APIError("Uknown error")
      }
    } else 
throw APIError("Uknown error")
  } catch (error) {
    Console.error((error as TypeError).message)
    throw error
  }
}

const login = async (identification: string, password: string) => {
  try {
    cli.action.start(`Looking for credentials with ${identification}`)
    await cli.wait(1000)
    const url = `${HOST}/v1/auth/login/`
    // Console.log(url);
    const data = await fetch(url, {
      body: JSON.stringify({
        email: identification,
        password: password,
      }),
      method: "post",
    })
    cli.action.stop("ready")
    const payload = await loginRigo(data.token)

    return { ...data, rigobot: payload }
  } catch (error) {
    cli.action.stop("error")
    Console.error((error as TypeError).message)
    Console.debug(error)
  }
}

const loginRigo = async (token: string) => {
  const rigoUrl = `${RIGOBOT_HOST}/v1/auth/me/token?breathecode_token=${token}`
  const rigoResp = await _fetch(rigoUrl)
  const rigobotJson = await rigoResp.json()
  return rigobotJson
}

const getOpenAIToken = async () => {
  const token = await storage.getItem("openai-token")
  return token
}

const getRigoFeedback = async (readme: string, currentCode: string) => {
  const payload = {
    current_code: Buffer.from(currentCode).toString("base64"), // Encode currentCode as base64
    tutorial: Buffer.from(readme).toString("base64"), // Encode readme as base64
  }

  const session = await storage.getItem("bc-payload")

  const response = await _fetch(`${RIGOBOT_HOST}/v1/conversation/feedback/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${session.rigobot.key}`,
    },
    body: JSON.stringify(payload),
  })

  const responseData = await response.json()
  return responseData.feedback
}

const publish = async (config: any) => {
  const keys = [
    "difficulty",
    "language",
    "skills",
    "technologies",
    "slug",
    "repository",
    "author",
    "title",
  ]

  const payload: { [key: string]: string } = {}
  for (const k of keys) 
config[k] ? (payload[k] = config[k]) : null
  try {
    console.log("Package to publish:", payload)
    cli.action.start("Updating package information...")
    await cli.wait(1000)
    const data = await fetch(`${HOST}/v1/package/${config.slug}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    cli.action.stop("ready")
    return data
  } catch (error) {
    console.log("payload", payload)
    Console.error((error as TypeError).message)
    Console.debug(error)
    throw error
  }
}

const update = async (config: any) => {
  try {
    cli.action.start("Updating package information...")
    await cli.wait(1000)
    const data = await fetch(`${HOST}/v1/package/`, {
      method: "POST",
      body: JSON.stringify(config),
    })
    cli.action.stop("ready")
    return data
  } catch (error) {
    Console.error((error as any).message)
    Console.debug(error)
    throw error
  }
}

const getPackage = async (slug: string) => {
  try {
    cli.action.start("Downloading package information...")
    await cli.wait(1000)
    const data = await fetch(`${HOST}/v1/package/${slug}`)
    cli.action.stop("ready")
    return data
  } catch (error) {
    if ((error as any).status === 404)
      Console.error(`Package ${slug} does not exist`)
    else 
Console.error(`Package ${slug} does not exist`)
    Console.debug(error)
    throw error
  }
}

const getLangs = async () => {
  try {
    cli.action.start("Downloading language options...")
    await cli.wait(1000)
    const data = await fetch(`${HOST}/v1/package/language`)
    cli.action.stop("ready")
    return data
  } catch (error) {
    if ((error as any).status === 404)
      Console.error("Package slug does not exist")
    else 
Console.error("Package slug does not exist")
    Console.debug(error)
    throw error
  }
}

const getAllPackages = async ({
  lang = "",
  slug = "",
}: {
  lang?: string;
  slug?: string;
}) => {
  try {
    cli.action.start("Downloading packages...")
    await cli.wait(1000)
    const data = await fetch(
      `${HOST}/v1/package/all?limit=100&language=${lang}&slug=${slug}`
    )
    cli.action.stop("ready")
    return data
  } catch (error) {
    Console.error(`Package ${slug} does not exist`)
    Console.debug(error)
    throw error
  }
}

const APIError = (error: TypeError | string, code?: number) => {
  const message: string = (error as TypeError).message || (error as string)
  const _err = new Error(message) as any
  _err.status = code || 400
  return _err
}

export default {
  login,
  publish,
  update,
  getPackage,
  getLangs,
  getAllPackages,
  getRigoFeedback,
  getOpenAIToken,
}
