import * as mockfs from "mock-fs"
import * as path from "path"
import * as fs from "fs"
import { IExercise } from "../../src/models/exercise-obj"

export const mockFolders = (folders: any) => {
  const mockfsConf = {
    "package.json": mockfs.load(path.resolve(__dirname, "../../package.json")),
    "tsconfig.json": mockfs.load(
      path.resolve(__dirname, "../../tsconfig.json")
    ),
    src: mockfs.load(path.resolve(__dirname, "../../src")),
    test: mockfs.load(path.resolve(__dirname, "../../test")),

    node_modules: mockfs.load(path.resolve(__dirname, "../../node_modules")),
    ".nyc_output": mockfs.load(path.resolve(__dirname, "../../.nyc_output")),
    ...(folders ? folders : {}),
  }

  mockfs(mockfsConf, { createCwd: false })
}

export const restoreMockFolders = () => {
  mockfs.restore()
}

export const isDirEmpty = (dirname: string) => {
  return fs.readdirSync(dirname).length === 0
}

export const buildExpectedConfig = (config: any) => {
  delete config.config.session

  return config
}

export const exerciseToPlainJson = (exercise: IExercise) => {
  const exerciseCopy = { ...exercise }
  delete exerciseCopy.getFile
  delete exerciseCopy.getReadme
  delete exerciseCopy.getTestReport
  delete exerciseCopy.saveFile

  return exerciseCopy
}
