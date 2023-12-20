import { IConfigObj, TGrading } from "./config"
import { IExercise } from "./exercise-obj"

export interface IConfigManagerAttributes {
  grading: TGrading;
  disableGrading: boolean;
  version: string;
  mode?: string;
}

export interface IConfigManager {
  validLanguages?: any;
  get: () => IConfigObj;
  clean: () => void;
  getExercise: (slug: string | undefined) => IExercise;
  startExercise: (slug: string) => IExercise;
  reset: (slug: string) => void;
  buildIndex: () => boolean | void;
  watchIndex: (onChange: (...args: Array<any>) => void) => void;
  save: () => void;
  noCurrentExercise: () => void;
  getAllExercises: () => IExercise[];
}
