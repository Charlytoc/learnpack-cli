import Console from "../utils/console"
import SessionCommand from "../utils/SessionCommand"
import socket from "../managers/socket"

import createServer from "../managers/server"
import ExercisesQueue from "../utils/exercisesQueue"
import { IExercise } from "../models/exercise-obj"

class TestCommand extends SessionCommand {
  async init() {
    const { flags } = this.parse(TestCommand)
    await this.initSession(flags)
  }

  async run() {
    const {
      args: { exerciseSlug },
    } = this.parse(TestCommand)

    // Build exercises index
    this.configManager?.buildIndex()

    let exercises: IExercise[] | undefined = []

    // test all exercises
    !exerciseSlug ?
      (exercises = this.configManager?.getAllExercises()) :
      (exercises = [this.configManager!.getExercise(exerciseSlug)])

    const exercisesQueue = new ExercisesQueue(exercises)

    const configObject = this.configManager?.get()

    let hasFailed = false
    let failedTestsCount = 0
    let successTestsCount = 0
    const testsToRunCount = exercisesQueue.size()

    configObject!.config!.testingFinishedCallback = ({ result }) => {
      if (result === "failed") {
        hasFailed = true
        failedTestsCount++
      } else {
        successTestsCount++
      }

      if (exercisesQueue.isEmpty()) {
        Console.info(
          `${testsToRunCount} test${testsToRunCount > 1 ? "s" : ""} runned`
        )
        Console.success(
          `${successTestsCount} test${successTestsCount > 1 ? "s" : ""} passed`
        )
        Console.error(
          `${failedTestsCount} test${failedTestsCount > 1 ? "s" : ""} failed`
        )

        process.exit(hasFailed ? 1 : 0)
      } else {
        exercisesQueue.pop()!.test!(this.config, config!, socket)
      }
    }

    const config = configObject?.config

    const server = await createServer(configObject!, this.configManager!, true)

    socket.start(config!, server, true)

    exercisesQueue.pop()!.test!(this.config, config!, socket)
  }
}

TestCommand.description = `Test exercises`

TestCommand.args = [
  {
    name: "exerciseSlug",
    required: false,
    description: "The name of the exercise to test",
    hidden: false,
  },
]

export default TestCommand
