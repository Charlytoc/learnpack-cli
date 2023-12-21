import * as fs from "fs"
import { validateExerciseDirectoryName } from "../managers/config/exercise"
import Console from "../utils/console"
import Audit from "../utils/audit"
import SessionCommand from "../utils/SessionCommand"
import * as path from "path"
import { IFile } from "../models/file"
import { IExercise } from "../models/exercise-obj"
import { IFrontmatter } from "../models/front-matter"
import { IAuditErrors } from "../models/audit"
import { ICounter } from "../models/counter"
import { IFindings } from "../models/findings"

// eslint-disable-next-line
const fetch = require("node-fetch");

class AuditCommand extends SessionCommand {
  async init() {
    const { flags } = this.parse(AuditCommand)
    await this.initSession(flags)
  }

  async run() {
    Console.log("Running command audit...")

    // Get configuration object.
    let config = this.configManager?.get()

    if (config) {
      const errors: IAuditErrors[] = []
      const warnings: IAuditErrors[] = []
      if (config?.config?.projectType === "tutorial") {
        const counter: ICounter = {
          images: {
            error: 0,
            total: 0,
          },
          links: {
            error: 0,
            total: 0,
          },
          exercises: 0,
          readmeFiles: 0,
        }

        // Checks if learnpack clean has been run
        Audit.checkLearnpackClean(config, errors)

        // Build exercises if they are not built yet.
        this.configManager?.buildIndex()
        config = this.configManager?.get()

        // Check if the exercises folder has some files within any ./exercise
        const exercisesPath: string = config!.config!.exercisesPath

        fs.readdir(exercisesPath, (err, files) => {
          if (err) {
            return console.log("Unable to scan directory: " + err)
          }

          // listing all files using forEach
          for (const file of files) {
            // Do whatever you want to do with the file
            const filePath: string = path.join(exercisesPath, file)
            if (fs.statSync(filePath).isFile())
              warnings.push({
                exercise: file!,
                msg: "This file is not inside any exercise folder.",
              })
          }
        })

        // This function is being created because the find method doesn't work with promises.
        const find = async (file: IFile, lang: string, exercise: IExercise) => {
          if (file.name === lang) {
            await Audit.checkUrl(
              config!,
              file.path,
              file.name,
              exercise,
              errors,
              warnings,
              counter
            )
            return true
          }

          return false
        }

        Console.debug("config", config)

        Console.info(" Checking if the config file is fine...")
        // These two lines check if the 'slug' property is inside the configuration object.
        Console.debug(
          "Checking if the slug property is inside the configuration object..."
        )
        // check if the slug property is in the configuration object
        if (!config!.config?.slug)
          errors.push({
            exercise: undefined,
            msg: "The slug property is not in the configuration object",
          })
        // check if the duration property is in the configuration object
        if (!config!.config?.duration)
          warnings.push({
            exercise: undefined,
            msg: "The duration property is not in the configuration object",
          })
        // check if the difficulty property is in the configuration object
        if (!config!.config?.difficulty)
          warnings.push({
            exercise: undefined,
            msg: "The difficulty property is not in the configuration object",
          })
        // check if the bugs_link property is in the configuration object
        if (!config!.config?.bugsLink)
          errors.push({
            exercise: undefined,
            msg: "The bugsLink property is not in the configuration object",
          })
        // check if the video_solutions property is in the configuration object
        if (config!.config?.videoSolutions === undefined)
          warnings.push({
            exercise: undefined,
            msg: "The videoSolutions property is not in the configuration object",
          })

        // These two lines check if the 'repository' property is inside the configuration object.
        Console.debug(
          "Checking if the repository property is inside the configuration object..."
        )
        if (!config!.config?.repository)
          errors.push({
            exercise: undefined,
            msg: "The repository property is not in the configuration object",
          })
        else 
Audit.isUrl(config!.config?.repository, errors, counter)

        // These two lines check if the 'description' property is inside the configuration object.
        Console.debug(
          "Checking if the description property is inside the configuration object..."
        )
        if (!config!.config?.description)
          errors.push({
            exercise: undefined,
            msg: "The description property is not in the configuration object",
          })

        if (errors.length === 0) 
Console.log("The config file is ok")

        // Validates if images and links are working at every README file.
        const exercises = config!.exercises
        const readmeFiles = []

        if (exercises && exercises.length > 0) {
          Console.info(" Checking if the images are working...")
          for (const index in exercises) {
            if (Object.prototype.hasOwnProperty.call(exercises, index)) {
              const exercise = exercises[index]
              if (!validateExerciseDirectoryName(exercise.title))
                errors.push({
                  exercise: exercise.title,
                  msg: `The exercise ${exercise.title} has an invalid name.`,
                })
              let readmeFilesCount = { exercise: exercise.title, count: 0 }
              if (Object.keys(exercise.translations!).length === 0)
                errors.push({
                  exercise: exercise.title,
                  msg: `The exercise ${exercise.title} doesn't have a README.md file.`,
                })

              if (
                exercise.language === "python3" ||
                exercise.language === "python"
              ) {
                for (const f of exercise.files.map(f => f)) {
                  if (
                    f.path.includes("test.py") ||
                    f.path.includes("tests.py")
                  ) {
                    const content = fs.readFileSync(f.path).toString()
                    const isEmpty = Audit.checkForEmptySpaces(content)
                    if (isEmpty || !content)
                      errors.push({
                        exercise: exercise.title,
                        msg: `This file (${f.name}) doesn't have any content inside.`,
                      })
                  }
                }
              } else {
                for (const f of exercise.files.map(f => f)) {
                  if (
                    f.path.includes("test.js") ||
                    f.path.includes("tests.js")
                  ) {
                    const content = fs.readFileSync(f.path).toString()
                    const isEmpty: boolean = Audit.checkForEmptySpaces(content)
                    if (isEmpty || !content)
                      errors.push({
                        exercise: exercise.title,
                        msg: `This file (${f.name}) doesn't have any content inside.`,
                      })
                  }
                }
              }

              for (const lang in exercise.translations) {
                if (
                  Object.prototype.hasOwnProperty.call(
                    exercise.translations,
                    lang
                  )
                ) {
                  const files: any[] = []
                  const findResultPromises = []
                  for (const file of exercise.files) {
                    const found = find(
                      file,
                      exercise.translations[lang],
                      exercise
                    )
                    findResultPromises.push(found)
                  }
                  // eslint-disable-next-line
                  let findResults = await Promise.all(findResultPromises);
                  for (const found of findResults) {
                    if (found) {
                      readmeFilesCount = {
                        ...readmeFilesCount,
                        count: readmeFilesCount.count + 1,
                      }
                      files.push(found)
                    }
                  }

                  if (!files.includes(true))
                    errors.push({
                      exercise: exercise.title,
                      msg: "This exercise doesn't have a README.md file.",
                    })
                }
              }

              readmeFiles.push(readmeFilesCount)
            }
          }
        } else
          errors.push({
            exercise: undefined,
            msg: "The exercises array is empty.",
          })

        Console.log(
          `${counter.images.total - counter.images.error} images ok from ${
            counter.images.total
          }`
        )

        Console.info(
          " Checking if important files are missing... (README's, translations, gitignore...)"
        )
        // Check if all the exercises has the same ammount of README's, this way we can check if they have the same ammount of translations.
        const files: string[] = []
        let count = 0
        for (const item of readmeFiles) {
          if (count < item.count) 
count = item.count
        }

        for (const item of readmeFiles) {
          if (item.count !== count) 
files.push(` ${item.exercise}`)
        }

        if (files.length > 0) {
          const filesString: string = files.join(",")
          warnings.push({
            exercise: undefined,
            msg:
              files.length === 1 ?
                `This exercise is missing translations:${filesString}` :
                `These exercises are missing translations:${filesString}`,
          })
        }

        // Checks if the .gitignore file exists.
        if (!fs.existsSync(".gitignore"))
          warnings.push({
            exercise: undefined,
            msg: ".gitignore file doesn't exist",
          })

        counter.exercises = exercises!.length
        for (const readme of readmeFiles) {
          counter.readmeFiles += readme.count
        }
      } else {
        // This is the audit code for Projects

        // Getting the learn.json schema
        const schemaResponse = await fetch(
          "https://raw.githubusercontent.com/tommygonzaleza/project-template/main/.github/learn-schema.json"
        )
        const schema = await schemaResponse.json()

        // Checking the "learn.json" file:
        const learnjson = JSON.parse(
          fs.readFileSync("./learn.json").toString()
        )

        if (!learnjson) {
          Console.error(
            "There is no learn.json file located in the root of the project."
          )
          process.exit(1)
        }

        // Checking the README.md files and possible translations.
        let readmeFiles: any[] = []
        const translations: string[] = []
        const translationRegex = /README\.([a-z]{2,3})\.md/

        try {
          const data = await fs.promises.readdir("./")
          readmeFiles = data.filter(file => file.includes("README"))
          if (readmeFiles.length === 0)
            errors.push({
              exercise: undefined!,
              msg: `There is no README file in the repository.`,
            })
        } catch (error) {
          if (error)
            Console.error(
              "There was an error getting the directory files",
              error
            )
        }

        for (const readmeFile of readmeFiles) {
          // Checking the language of each README file.
          if (readmeFile === "README.md") 
translations.push("us")
          else {
            const regexGroups = translationRegex.exec(readmeFile)
            if (regexGroups) 
translations.push(regexGroups[1])
          }

          const readme = fs.readFileSync(path.resolve(readmeFile)).toString()

          const isEmpty = Audit.checkForEmptySpaces(readme)
          if (isEmpty || !readme) {
            errors.push({
              exercise: undefined!,
              msg: `This file "${readmeFile}" doesn't have any content inside.`,
            })
            continue
          }

          if (readme.length < 800)
            errors.push({
              exercise: undefined,
              msg: `The "${readmeFile}" file should have at least 800 characters (It currently have: ${readme.length}).`,
            })

          // eslint-disable-next-line
          await Audit.checkUrl(
            config!,
            path.resolve(readmeFile),
            readmeFile,
            undefined,
            errors,
            warnings,
            // eslint-disable-next-line
            undefined
          )
        }

        // Adding the translations to the learn.json
        learnjson.translations = translations

        // Checking if the preview image (from the learn.json) is OK.
        try {
          const res = await fetch(learnjson.preview, { method: "HEAD" })
          if (res.status > 399 && res.status < 500) {
            errors.push({
              exercise: undefined,
              msg: `The link of the "preview" is broken: ${learnjson.preview}`,
            })
          }
        } catch {
          errors.push({
            exercise: undefined,
            msg: `The link of the "preview" is broken: ${learnjson.preview}`,
          })
        }

        const date = new Date()
        learnjson.validationAt = date.getTime()

        if (errors.length > 0) 
learnjson.validationStatus = "error"
        else if (warnings.length > 0) 
learnjson.validationStatus = "warning"
        else 
learnjson.validationStatus = "success"

        // Writes the "learn.json" file with all the new properties
        await fs.promises.writeFile("./learn.json", JSON.stringify(learnjson))
      }

      await Audit.showWarnings(warnings)
      // eslint-disable-next-line
      await Audit.showErrors(errors, undefined);
    }
  }
}

AuditCommand.description = `learnpack audit is the command in charge of creating an auditory of the repository
...
learnpack audit checks for the following information in a repository:
    1. The configuration object has slug, repository and description. (Error)
    2. The command learnpack clean has been run. (Error)
    3. If a markdown or test file doesn't have any content. (Error)
    4. The links are accessing to valid servers. (Error)
    5. The relative images are working (If they have the shortest path to the image or if the images exists in the assets). (Error)
    6. The external images are working (If they are pointing to a valid server). (Error)
    7. The exercises directory names are valid. (Error)
    8. If an exercise doesn't have a README file. (Error)
    9. The exercises array (Of the config file) has content. (Error)
    10. The exercses have the same translations. (Warning)
    11. The .gitignore file exists. (Warning)
    12. If there is a file within the exercises folder but not inside of any particular exercise's folder. (Warning)
`

AuditCommand.flags = {
  // name: flags.string({char: 'n', description: 'name to print'}),
}

export default AuditCommand
