export const EDITOR_VERSION = "1.0.72"

export const EXERCISE_SLUG = "00-Welcome"

export const CONFIG_SAMPLE = {
  config: {
    port: 3000,
    address: "http://localhost",
    editor: {
      mode: "standalone",
      agent: "localhost",
      version: "1.0.72",
    },
    dirPath: "./.learn",
    configPath: "learn.json",
    outputPath: ".learn/dist",
    publicPath: "/preview",
    exerciseNameValidationRegex: "/^(d{2,3}(.d{1,2})?-([dA-Za-z]+(-|_)?)+)$/",
    language: "auto",
    grading: "isolated",
    exercisesPath: "./exercises",
    webpackTemplate: null,
    disableGrading: true,
    autoPlay: true,
    projectType: "tutorial",
    disabledActions: [],
    actions: [],
    entries: {
      html: "index.html",
      vanillajs: "index.js",
      react: "app.jsx",
      node: "app.js",
      python3: "app.py",
      java: "app.java",
    },
    slug: "the-dom-exercises",
    repository:
      "https://github.com/4GeeksAcademy/javascript-dom-tutorial-exercises",
    title: "Learn how to manipulate The DOM with JS",
    preview:
      "https://github.com/4GeeksAcademy/javascript-dom-tutorial-exercises/blob/master/preview.png?raw=true",
    description:
      "Step by step, go over all the most important DOM concepts and methods: Use javascript to manipulate styles, html elements.",
    duration: 8,
    translations: [],
    difficulty: "easy",
  },
  session: 6_941_983_401_542_737_000,
  address: "http://localhost",
  currentExercise: null,
  exercises: [
    {
      position: 0,
      path: "exercises/00-Welcome",
      slug: "00-Welcome",
      translations: {
        es: "README.es.md",
        us: "README.md",
      },
      language: null,
      entry: null,
      title: "00-Welcome",
      graded: false,
      files: [
        {
          path: "exercises/00-Welcome/README.es.md",
          name: "README.es.md",
          hidden: true,
        },
        {
          path: "exercises/00-Welcome/README.md",
          name: "README.md",
          hidden: true,
        },
      ],
      done: false,
    },
  ],
}

export const LEARN_JSON = {
  slug: "the-dom-exercises",
  grading: "isolated",
  repository:
    "https://github.com/4GeeksAcademy/javascript-dom-tutorial-exercises",
  title: "Learn how to manipulate The DOM with JS",
  preview:
    "https://github.com/4GeeksAcademy/javascript-dom-tutorial-exercises/blob/master/preview.png?raw=true",
  description:
    "Step by step, go over all the most important DOM concepts and methods: Use javascript to manipulate styles, html elements.",
  duration: 8,
  difficulty: "easy",
  projectType: "tutorial",
  config: {
    disableGrading: true,
    editor: {
      version: "1.0.72",
    },
  },
}
