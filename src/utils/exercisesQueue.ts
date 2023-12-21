import { IConfig } from "../models/config"
import { IExercise } from "../models/exercise-obj"
import { ISocket } from "../models/socket"

class Exercise {
  exercise: IExercise
  constructor(exercise: IExercise) {
    this.exercise = exercise
  }

  test(sessionConfig: IConfig, config: IConfig, socket: ISocket) {
    if (this.exercise.language) {
      socket.log(
        "testing",
        `Testing exercise ${this.exercise.slug} using ${this.exercise.language} engine`
      )

      sessionConfig.runHook("action", {
        action: "test",
        socket,
        configuration: config,
        exercise: this.exercise,
      })
    } else {
      socket.onTestingFinished({ result: "success" })
    }
  }
}

class ExercisesQueue {
  exercises: IExercise[]
  constructor(exercises: any) {
    this.exercises = exercises.map((exercise: IExercise) => {
      return new Exercise(exercise)
    })
  }

  pop() {
    return this.exercises.shift()
  }

  isEmpty() {
    return this.size() === 0
  }

  size() {
    return this.exercises.length
  }
}

export default ExercisesQueue
