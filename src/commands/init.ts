import { flags } from "@oclif/command"
import BaseCommand from "../utils/BaseCommand"

// eslint-disable-next-line
import * as fs from "fs-extra";
import * as prompts from "prompts"
import cli from "cli-ux"
import * as eta from "eta"

import Console from "../utils/console"
import { ValidationError } from "../utils/errors"

import * as path from "path"

class InitComand extends BaseCommand {
  static description =
    "Create a new learning package: Book, Tutorial or Exercise"

  static flags = {
    ...BaseCommand.flags,
    grading: flags.help({ char: "h" }),
  }

  async run() {
    const { flags } = this.parse(InitComand)

    // if the folder/file .learn or .breathecode aleady exists
    await alreadyInitialized()

    const choices = await prompts([
      {
        type: "select",
        name: "grading",
        message: "Is the auto-grading going to be isolated or incremental?",
        choices: [
          {
            title: "Incremental: Build on top of each other like a tutorial",
            value: "incremental",
          },
          { title: "Isolated: Small separated exercises", value: "isolated" },
          {
            title: "No grading: No feedback or testing whatsoever",
            value: null,
          },
        ],
      },
      {
        type: "text",
        name: "title",
        initial: "My Interactive Tutorial",
        message: "Title for your tutorial? Press enter to leave as it is",
      },
      {
        type: "text",
        name: "description",
        initial: "",
        message: "Description for your tutorial? Press enter to leave blank",
      },
      {
        type: "select",
        name: "difficulty",
        message: "How difficulty will be to complete the tutorial?",
        choices: [
          { title: "Begginer (no previous experience)", value: "beginner" },
          { title: "Easy (just a bit of experience required)", value: "easy" },
          {
            title: "Intermediate (you need experience)",
            value: "intermediate",
          },
          { title: "Hard (master the topic)", value: "hard" },
        ],
      },
      {
        type: "text",
        name: "duration",
        initial: "1",
        message: "How many hours avg it takes to complete (number)?",
        validate: (value: string) => {
          const n = Math.floor(Number(value))
          return (
            n !== Number.POSITIVE_INFINITY && String(n) === value && n >= 0
          )
        },
      },
    ])

    const packageInfo = {
      grading: choices.grading,
      difficulty: choices.difficulty,
      duration: parseInt(choices.duration),
      description: choices.description,
      title: choices.title,
      slug: choices.title
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, ""),
    }

    cli.action.start("Initializing package")

    const languages = ["en", "es"]

    const templatesDir = path.resolve(
      __dirname,
      "../../src/utils/templates/" + choices.grading || "no-grading"
    )
    if (!fs.existsSync(templatesDir))
      throw ValidationError(`Template ${templatesDir} does not exists`)
    await fs.copySync(templatesDir, "./")

    // Creating README files
    // eslint-disable-next-line
    languages.forEach((language) => {
      const readmeFilename = `README${language !== "en" ? `.${language}` : ""}`
      fs.writeFileSync(
        `./${readmeFilename}.md`,
        eta.render(
          fs.readFileSync(
            path.resolve(__dirname, `${templatesDir}/${readmeFilename}.ejs`),
            "utf-8"
          ),
          packageInfo
        )
      )
      if (fs.existsSync(`./${readmeFilename}.ejs`))
        fs.removeSync(`./${readmeFilename}.ejs`)
    })

    if (!fs.existsSync("./.gitignore"))
      fs.copyFile(
        path.resolve(__dirname, "../../src/utils/templates/gitignore.txt"),
        "./.gitignore"
      )
    fs.writeFileSync("./learn.json", JSON.stringify(packageInfo, null, 2))

    cli.action.stop()
    Console.success(`😋 Package initialized successfully`)
    Console.help(
      `Start the exercises by running the following command on your terminal: $ learnpack start`
    )
  }
}

const alreadyInitialized = () =>
  new Promise((resolve, reject) => {
    fs.readdir("./", function (err: any, files: any) {
      files = files.filter((f: any) =>
        [".learn", "learn.json", "bc.json", ".breathecode"].includes(f)
      )
      if (err) {
        reject(ValidationError(err.message))
        throw ValidationError(err.message)
      } else if (files.length > 0) {
        reject(
          ValidationError(
            "It seems the package is already initialized because we've found the following files: " +
              files.join(",")
          )
        )
        throw ValidationError(
          "It seems the package is already initialized because we've found the following files: " +
            files.join(",")
        )
      }

      resolve(false)
    })
  })

export default InitComand
