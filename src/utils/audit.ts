import { IAuditErrors } from "../models/audit"
import { IConfigObj } from "../models/config"
import { ICounter } from "../models/counter"
import { IFindings } from "../models/findings"
import { IExercise } from "../models/exercise-obj"
import { IFrontmatter } from "../models/front-matter"
import Console from "./console"
import * as fs from "fs"
import * as path from "path"

// eslint-disable-next-line
const fetch = require("node-fetch");
// eslint-disable-next-line
const fm = require("front-matter");

// This function checks if a url is valid.
const isUrl = async (
  url: string,
  errors: IAuditErrors[],
  counter: ICounter
) => {
  const regexUrl = /(https?:\/\/[\w./-]+)/gm
  counter.links.total++
  if (!regexUrl.test(url)) {
    counter.links.error++
    errors.push({
      exercise: undefined,
      msg: `The repository value of the configuration file is not a link: ${url}`,
    })
    return false
  }

  const res = await fetch(url, { method: "HEAD" })
  if (!res.ok) {
    counter.links.error++
    errors.push({
      exercise: undefined,
      msg: `The link of the repository is broken: ${url}`,
    })
  }

  return true
}

const checkForEmptySpaces = (str: string) => {
  const isEmpty = true
  for (const letter of str) {
    if (letter !== " ") {
      return false
    }
  }

  return isEmpty
}

const checkLearnpackClean = (configObj: IConfigObj, errors: IAuditErrors[]) => {
  if (
    (configObj.config?.outputPath &&
      fs.existsSync(configObj.config?.outputPath)) ||
    fs.existsSync(`${configObj.config?.dirPath}/_app`) ||
    fs.existsSync(`${configObj.config?.dirPath}/reports`) ||
    fs.existsSync(`${configObj.config?.dirPath}/resets`) ||
    fs.existsSync(`${configObj.config?.dirPath}/app.tar.gz`) ||
    fs.existsSync(`${configObj.config?.dirPath}/config.json`) ||
    fs.existsSync(`${configObj.config?.dirPath}/vscode_queue.json`)
  ) {
    errors.push({
      exercise: undefined,
      msg: "You have to run learnpack clean command",
    })
  }
}

const findInFile = (types: string[], content: string) => {
  const regex: any = {
    relativeImages:
      /!\[.*]\s*\((((\.\/)?(\.{2}\/){1,5})(.*\/)*(.[^\s/]*\.[A-Za-z]{2,4})\S*)\)/gm,
    externalImages: /!\[.*]\((https?:\/(\/[^)/]+)+\/?)\)/gm,
    markdownLinks: /(\s)+\[.*]\((https?:\/(\/[^)/]+)+\/?)\)/gm,
    url: /(https?:\/\/[\w./-]+)/gm,
    uploadcare: /https:\/\/ucarecdn.com\/(?:.*\/)*([\w./-]+)/gm,
  }

  const validTypes = Object.keys(regex)
  if (!Array.isArray(types)) 
types = [types]

  const findings: IFindings = {}
  type findingsType =
    | "relativeImages"
    | "externalImages"
    | "markdownLinks"
    | "url"
    | "uploadcare";

  for (const type of types) {
    if (!validTypes.includes(type)) 
throw new Error("Invalid type: " + type)
    else 
findings[type as findingsType] = {}
  }

  for (const type of types) {
    let m: RegExpExecArray
    while ((m = regex[type].exec(content)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++
      }

      // The result can be accessed through the `m`-variable.
      // m.forEach((match, groupIndex) => values.push(match));

      findings[type as findingsType]![m[0]] = {
        content: m[0],
        absUrl: m[1],
        mdUrl: m[2],
        relUrl: m[6],
      }
    }
  }

  return findings
}

// This function checks that each of the url's are working.
const checkUrl = async (
  config: IConfigObj,
  filePath: string,
  fileName: string,
  exercise: IExercise | undefined,
  errors: IAuditErrors[],
  warnings: IAuditErrors[],
  counter: ICounter | undefined
) => {
  if (!fs.existsSync(filePath)) 
return false
  const content: string = fs.readFileSync(filePath).toString()
  const isEmpty = checkForEmptySpaces(content)
  if (isEmpty || !content)
    errors.push({
      exercise: exercise?.title!,
      msg: `This file (${fileName}) doesn't have any content inside.`,
    })

  const frontmatter: IFrontmatter = fm(content)
  for (const attribute in frontmatter.attributes) {
    if (
      Object.prototype.hasOwnProperty.call(frontmatter.attributes, attribute) &&
      (attribute === "intro" || attribute === "tutorial")
    ) {
      counter && counter.links.total++
      try {
        // eslint-disable-next-line
        let res = await fetch(frontmatter.attributes[attribute], {
          method: "HEAD",
        })
        if (!res.ok) {
          counter && counter.links.error++
          errors.push({
            exercise: exercise?.title!,
            msg: `This link is broken (${res.ok}): ${frontmatter.attributes[attribute]}`,
          })
        }
      } catch {
        counter && counter.links.error++
        errors.push({
          exercise: exercise?.title,
          msg: `This link is broken: ${frontmatter.attributes[attribute]}`,
        })
      }
    }
  }

  // Check url's of each README file.
  const findings: IFindings = findInFile(
    ["relativeImages", "externalImages", "markdownLinks"],
    content
  )
  type findingsType =
    | "relativeImages"
    | "externalImages"
    | "markdownLinks"
    | "url"
    | "uploadcare";
  for (const finding in findings) {
    if (Object.prototype.hasOwnProperty.call(findings, finding)) {
      const obj = findings[finding as findingsType]
      // Valdites all the relative path images.
      if (finding === "relativeImages" && Object.keys(obj!).length > 0) {
        for (const img in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, img)) {
            // Validates if the image is in the assets folder.
            counter && counter.images.total++
            const relativePath = path
              .relative(
                exercise ? exercise.path.replace(/\\/gm, "/") : "./",
                `${config!.config?.dirPath}/assets/${obj[img].relUrl}`
              )
              .replace(/\\/gm, "/")
            if (relativePath !== obj[img].absUrl.split("?").shift()) {
              counter && counter.images.error++
              errors.push({
                exercise: exercise?.title,
                msg: `This relative path (${obj[img].relUrl}) is not pointing to the assets folder.`,
              })
            }

            if (
              !fs.existsSync(
                `${config!.config?.dirPath}/assets/${obj[img].relUrl}`
              )
            ) {
              counter && counter.images.error++
              errors.push({
                exercise: exercise?.title,
                msg: `The file ${obj[img].relUrl} doesn't exist in the assets folder.`,
              })
            }
          }
        }
      } else if (finding === "externalImages" && Object.keys(obj!).length > 0) {
        // Valdites all the aboslute path images.
        for (const img in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, img)) {
            counter && counter.images.total++
            if (
              fs.existsSync(
                `${config!.config?.dirPath}/assets${obj[img].mdUrl
                  .split("?")
                  .shift()}`
              )
            ) {
              const relativePath = path
                .relative(
                  exercise ? exercise.path.replace(/\\/gm, "/") : "./",
                  `${config!.config?.dirPath}/assets/${obj[img].mdUrl}`
                )
                .replace(/\\/gm, "/")
              warnings.push({
                exercise: exercise?.title,
                msg: `On this exercise you have an image with an absolute path "${obj[img].absUrl}". We recommend you to replace it by the relative path: "${relativePath}".`,
              })
            }

            try {
              // eslint-disable-next-line
              let res = await fetch(obj[img].absUrl, {
                method: "HEAD",
              })
              if (!res.ok) {
                counter && counter.images.error++
                errors.push({
                  exercise: exercise?.title,
                  msg: `This link is broken: ${obj[img].absUrl}`,
                })
              }
            } catch {
              counter && counter.images.error++
              errors.push({
                exercise: exercise?.title,
                msg: `This link is broken: ${obj[img].absUrl}`,
              })
            }
          }
        }
      } else if (finding === "markdownLinks" && Object.keys(obj!).length > 0) {
        for (const link in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, link)) {
            counter && counter.links.total++
            if (!obj[link].mdUrl.includes("twitter")) {
              try {
                // eslint-disable-next-line
                let res = await fetch(obj[link].mdUrl, {
                  method: "HEAD",
                })
                if (res.status > 399 && res.status < 500) {
                  counter && counter.links.error++
                  errors.push({
                    exercise: exercise?.title,
                    msg: `This link is broken: ${obj[link].mdUrl}`,
                  })
                }
              } catch {
                counter && counter.links.error++
                errors.push({
                  exercise: exercise?.title,
                  msg: `This link is broken: ${obj[link].mdUrl}`,
                })
              }
            }
          }
        }
      }
    }
  }

  return true
}

// This function writes a given file with the given content.
const writeFile = async (content: string, filePath: string) => {
  try {
    await fs.promises.writeFile(filePath, content)
  } catch (error) {
    if (error)
      Console.error(
        `We weren't able to write the file in this path "${filePath}".`,
        error
      )
  }
}

// This function checks if there are errors, and show them in the console at the end.
const showErrors = (errors: IAuditErrors[], counter: ICounter | undefined) => {
  return new Promise((resolve, reject) => {
    if (errors) {
      if (errors.length > 0) {
        Console.log("Checking for errors...")
        for (const [i, error] of errors.entries())
          Console.error(
            `${i + 1}) ${error.msg} ${
              error.exercise ? `(Exercise: ${error.exercise})` : ""
            }`
          )
        if (counter) {
          Console.error(
            ` We found ${errors.length} error${
              errors.length > 1 ? "s" : ""
            } among ${counter.images.total} images, ${
              counter.links.total
            } link, ${counter.readmeFiles} README files and ${
              counter.exercises
            } exercises.`
          )
        } else {
          Console.error(
            ` We found ${errors.length} error${
              errors.length > 1 ? "s" : ""
            } related with the project integrity.`
          )
        }

        process.exit(1)
      } else {
        if (counter) {
          Console.success(
            `We didn't find any errors in this repository among ${counter.images.total} images, ${counter.links.total} link, ${counter.readmeFiles} README files and ${counter.exercises} exercises.`
          )
        } else {
          Console.success(`We didn't find any errors in this repository.`)
        }

        process.exit(0)
      }
    } else {
      reject("Failed")
    }
  })
}

// This function checks if there are warnings, and show them in the console at the end.
const showWarnings = (warnings: IAuditErrors[]) => {
  return new Promise((resolve, reject) => {
    if (warnings) {
      if (warnings.length > 0) {
        Console.log("Checking for warnings...")
        for (const [i, warning] of warnings.entries())
          Console.warning(
            `${i + 1}) ${warning.msg} ${
              warning.exercise ? `File: ${warning.exercise}` : ""
            }`
          )
      }

      resolve("SUCCESS")
    } else {
      reject("Failed")
    }
  })
}

export default {
  isUrl,
  checkForEmptySpaces,
  checkLearnpackClean,
  findInFile,
  checkUrl,
  writeFile,
  showErrors,
  showWarnings,
}
