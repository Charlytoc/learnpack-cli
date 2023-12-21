import * as p from "path"
// import frontMatter from 'front-matter'
import * as fs from "fs"
import Console from "../../utils/console"
import allowed from "./allowed_files"

import { IConfigObj } from "../../models/config"
import { IFile } from "../../models/file"
import { IExercise } from "../../models/exercise-obj"

// eslint-disable-next-line
const frontMatter = require("front-matter");

export const exercise = (
  path: string,
  position: number,
  configObject: IConfigObj
): IExercise => {
  const { config, exercises } = configObject
  let slug = p.basename(path)

  if (!validateExerciseDirectoryName(slug)) {
    Console.error(
      `Exercise directory ${slug} has an invalid name, it has to start with two or three digits followed by words separated by underscors or hyphen (no white spaces). e.g: 01.12-hello-world`
    )
  }

  // get all the files
  const files = fs.readdirSync(path)

  /**
   * build the translation array like:
   {
       "us": "path/to/Readme.md",
        "es": "path/to/Readme.es.md"
      }
      */
  const translations: { [key: string]: string } = {}
  for (const file of files.filter(file =>
    file.toLowerCase().includes("readme")
  )) {
    const parts = file.split(".")

    if (parts.length === 3) 
translations[parts[1]] = file
    else 
translations.us = file
  }

  // if the slug is a dot, it means there is not "exercises" folder, and its just a single README.md
  if (slug === ".") 
slug = "default-index"

  const detected = detect(configObject, files)

  const exerciseObj: IExercise = {
    position,
    path,
    slug,
    translations,
    language: detected?.language,
    entry: detected?.entry ? path + "/" + detected.entry : null, // full path to the exercise entry
    title: slug || "Exercise",
    graded: files.some(
      (file: any) =>
        file.toLowerCase().startsWith("test.") ||
        file.toLowerCase().startsWith("tests.")
    ),
    files: filterFiles(files, path),
    // if the exercises was on the config before I may keep the status done
    done:
      Array.isArray(exercises) &&
      typeof exercises[position] !== "undefined" &&
      path.slice(Math.max(0, path.indexOf("exercises/") + 10)) ===
        exercises[position].slug ?
        exercises[position].done :
        false,
    getReadme: function (lang = null) {
      if (lang === "us") 
lang = null // <-- english is default, no need to append it to the file name

      if (!fs.existsSync(`${this.path}/README${lang ? "." + lang : ""}.md`)) {
        Console.error(
          `Language ${lang} not found for exercise ${slug}, switching to default language`
        )

        if (lang) 
lang = null

        if (!fs.existsSync(`${this.path}/README${lang ? "." + lang : ""}.md`))
          throw new Error(
            "Readme file not found for exercise: " + this.path + "/README.md"
          )
      }

      const content = fs.readFileSync(
        `${this.path}/README${lang ? "." + lang : ""}.md`,
        "utf8"
      )
      const attr = frontMatter(content)
      return attr
    },
    getFile: function (name: string) {
      const file: IFile | undefined = this.files.find(
        (f: IFile) => f.name === name
      )

      if (!file || !fs.existsSync(file.path)) {
        throw new Error(`File not found: + ${file?.path}`)
      } else if (fs.lstatSync(file.path).isDirectory()) {
        return (
          "Error: This is not a file to be read, but a directory: " + file.path
        )
      }

      // get file content
      const content = fs.readFileSync(file.path)

      // create reset folder
      if (!fs.existsSync(`${config?.dirPath}/resets`))
        fs.mkdirSync(`${config?.dirPath}/resets`)
      if (!fs.existsSync(`${config?.dirPath}/resets/` + this.slug)) {
        fs.mkdirSync(`${config?.dirPath}/resets/` + this.slug)
        for (const _file of this.files) {
          const fileContent = fs.readFileSync(_file.path)
          if (
            !fs.existsSync(
              `${config?.dirPath}/resets/${this.slug}/${_file.name}`
            )
          ) {
            fs.writeFileSync(
              `${config?.dirPath}/resets/${this.slug}/${_file.name}`,
              fileContent
            )
          }
        }
      }

      return content
    },
    saveFile: function (name: string, content: string) {
      const file: IFile | undefined = this.files.find(
        (f: IFile) => f.name === name
      )

      if (file) {
        if (!fs.existsSync(file.path)) {
          throw new Error("File not found: " + file.path)
        }

        return fs.writeFileSync(file.path, content, "utf8")
      }
    },
    getTestReport: function () {
      const _path = `${configObject?.confPath?.base}/reports/${this.slug}.json`

      if (!fs.existsSync(_path)) 
return {}

      const content = fs.readFileSync(_path)
      const data = JSON.parse(`${content}`)
      return data
    },
  }

  return exerciseObj
}

export const validateExerciseDirectoryName = (str: string) => {
  if (str === "./") 
return true
  // TODO: Add nameValidationREgex from the config
  const regex = /^(\d{2,3}(\.\d{1,2})?-([\dA-Za-z]+(-|_)?)+)$/
  return regex.test(str)
}

export const isCodable = (str: string) => {
  const extension = p.extname(str)
  return allowed.extensions.includes(extension.slice(1).toLowerCase())
}

const isNotConfiguration = (str: string) => {
  return !allowed.names.includes(str)
}

export const shouldBeVisible = function (file: IFile) {
  return (
    // doest not have "test." on their name
    !file.name.toLocaleLowerCase().includes("test.") &&
    !file.name.toLocaleLowerCase().includes("tests.") &&
    !file.name.toLocaleLowerCase().includes(".hide.") &&
    // ignore hidden files
    file.name.charAt(0) !== "." &&
    // ignore learn.json and bc.json
    !file.name.toLocaleLowerCase().includes("learn.json") &&
    !file.name.toLocaleLowerCase().includes("bc.json") &&
    // ignore images, videos, vectors, etc.
    isCodable(file.name) &&
    isNotConfiguration(file.name) &&
    // readme's and directories
    !file.name.toLowerCase().includes("readme.") &&
    !isDirectory(file.path) &&
    file.name.charAt(0) !== "_"
  )
}

export const isDirectory = (source: string) => {
  // if(path.basename(source) === path.basename(config.dirPath)) return false
  return fs.lstatSync(source).isDirectory()
}

export const detect = (
  configObject: IConfigObj | undefined,
  files: Array<string>
) => {
  if (!configObject) {
    return
  }

  const { config } = configObject

  if (!config)
    throw new Error("No configuration found during the engine detection")

  if (!config.entries)
    throw new Error(
      "No configuration found for entries, please add a 'entries' object with the default file name for your exercise entry file that is going to be used while compiling, for example: index.html for html, app.py for python3, etc."
    )
  // A language was found on the config object, but this language will only be used as last resort, learnpack will try to guess each exercise language independently based on file extension (js, jsx, html, etc.)

  let hasFiles = files.filter(f => f.includes(".py"))
  if (hasFiles.length > 0)
    return {
      language: "python3",
      entry: hasFiles.find(f => config.entries.python3 === f),
    }

  hasFiles = files.filter(f => f.includes(".java"))
  if (hasFiles.length > 0)
    return {
      language: "java",
      entry: hasFiles.find(f => config.entries.java === f),
    }

  hasFiles = files.filter(f => f.includes(".jsx"))
  if (hasFiles.length > 0)
    return {
      language: "react",
      entry: hasFiles.find(f => config.entries.react === f),
    }
  const hasHTML = files.filter(f => f.includes("index.html"))
  const hasIndexJS = files.find(f => f.includes("index.js"))
  const hasJS = files.filter(f => f.includes(".js"))
  // angular, vue, vanillajs needs to have at least 2 files (html,css,js),
  // the test.js and the entry file in js
  // if not its just another HTML

  if (hasIndexJS && hasHTML.length > 0)
    return {
      language: "vanillajs",
      entry: hasIndexJS,
    }
  if (hasHTML.length > 0)
    return {
      language: "html",
      entry: hasHTML.find(f => config.entries.html === f),
    }
  if (hasJS.length > 0)
    return {
      language: "node",
      entry: hasJS.find(f => config.entries.node === f),
    }

  return {
    language: null,
    entry: null,
  }
}

export const filterFiles = (files: Array<string>, basePath = ".") =>
  files
    .map((ex: string) => ({
      path: basePath + "/" + ex,
      name: ex,
      hidden: !shouldBeVisible({
        name: ex,
        path: basePath + "/" + ex,
      } as IFile),
    }))
    .sort((f1, f2) => {
      const score: { [key: string]: number } = {
        // sorting priority
        "index.html": 1,
        "styles.css": 2,
        "styles.scss": 2,
        "style.css": 2,
        "style.scss": 2,
        "index.css": 2,
        "index.scss": 2,
        "index.js": 3,
      }
      return score[f1.name] < score[f2.name] ? -1 : 1
    })

export default {
  exercise,
  detect,
  filterFiles,
}
