const fs = require("fs")
// eslint-disable-next-line
const arrDiff = require("./utils");
const c = require("chalk")
// eslint-disable-next-line
const logger = require("../../src/utils/console");

logger.log("Loading package.json")
const packageContent = fs.readFileSync("./package.json")
logger.log("Parsing package.json")
const package = JSON.parse(packageContent)

logger.log("Comparing oclif.plugins vs oclif.premanent_plugins")
if (
  JSON.stringify(package.oclif.plugins) !==
  JSON.stringify(package.oclif.permanent_plugins)
) {
  logger.error(`There is a missmatch between oclif.plugins and oclif.permanent_plugins.
Normally mismatch occurs because you forgot to delete some compiler plugins like learnpack-node that you only added for testing purpuses.
${c.yellow(
  arrDiff(package.oclif.plugins, package.oclif.permanent_plugins).join("\n")
)}
If your oclif.plugins are ok as it is, make sure to add all of them to the oclif.permanent_plugins as well to avoid this error.
    `)
  process.exit(1)
}

logger.success("Precommit test OK")
process.exit(0)
