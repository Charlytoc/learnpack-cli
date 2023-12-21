import { IConfig } from "./config"
import { IExercise } from "./exercise-obj"

export interface IPluginConfig {
  language: string;
  compile?: {
    run: () => void;
    validate: (args: IValidate) => boolean;
    dependencies: string[];
  };
  test?: () => void;
}

interface IValidate {
  exercise: IExercise;
  configuration: IConfig;
}
