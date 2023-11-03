import * as fs from "fs";
import * as p from "path";
import * as shell from "shelljs";
import { cli } from "cli-ux";
import * as targz from "targz";
import Console from "../utils/console";
import * as https from "https";
import { InternalError } from "../utils/errors";

// eslint-disable-next-line
const fetch = require("node-fetch");

export const decompress = (sourcePath: string, destinationPath: string) =>
  new Promise((resolve, reject) => {
    Console.debug("Decompressing " + sourcePath);
    targz.decompress(
      {
        src: sourcePath,
        dest: destinationPath,
      },
      function (err: string | Error | null) {
        if (err) {
          Console.error("Error when trying to decompress");
          reject(err);
        } else {
          Console.info("Decompression finished successfully");
          resolve(/* */ "");
        }
      }
    );
  });

export const downloadEditor = async (
  version: string | undefined,
  destination: string
) => {
  // https://raw.githubusercontent.com/learnpack/coding-ide/master/dist/app.tar.gz
  // if(versions[version] === undefined) throw new Error(`Invalid editor version ${version}`)
  const resp2 = await fetch(
    `https://github.com/learnpack/coding-ide/blob/${version}/dist`,
    { method: "HEAD" }
  );
  if (!resp2.ok)
    throw InternalError(
      `Coding Editor ${version} was not found on learnpack repository, check the config.editor.version property on learn.json`
    );

  Console.info(
    "Downloading the LearnPack coding UI, this may take a minute..."
  );
  return download(
    `https://github.com/learnpack/coding-ide/blob/${version}/dist/app.tar.gz?raw=true`,
    destination
  );
};

export const download = (url: string, dest: string) => {
  Console.debug("Downloading " + url);
  return new Promise((resolve, reject) => {
    const request = https.get(url, response => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest, { flags: "wx" });
        file.on("finish", () => {
          resolve(true);
        });
        file.on("error", err => {
          file.close();
          if (err.code === "EEXIST") {
            Console.debug("File already exists");
            resolve("File already exists");
          } else {
            Console.debug("Error ", err.message);
            fs.unlink(dest, () => reject(err.message)); // Delete temp file
          }
        });
        response.pipe(file);
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Console.debug("Servers redirected to "+response.headers.location)
        // Recursively follow redirects, only a 200 will resolve.
        if (response.headers.location) {
          download(response.headers.location, dest)
            .then(() => resolve(/* */ ""))
            .catch(error => {
              Console.error(error);
              reject(error);
            });
        }
      } else {
        Console.debug(
          `Server responded with ${response.statusCode}: ${response.statusMessage}`
        );
        reject(
          `Server responded with ${response.statusCode}: ${response.statusMessage}`
        );
      }
    });

    request.on("error", err => {
      reject(err.message);
    });
  });
};

export const clone = (repository = "", folder = "./") =>
  new Promise((resolve, reject) => {
    if (!repository) {
      reject("Missing repository url for this package");
      // return false
    }

    cli.action.start("Verifying GIT...");
    if (!shell.which("git")) {
      reject("Sorry, this script requires git");
      // return false
    }

    cli.action.stop();

    let fileName = p.basename(repository);
    if (!fileName) {
      reject("Invalid repository information on package: " + repository);
      // return false
    }

    fileName = fileName.split(".")[0];
    if (fs.existsSync("./" + fileName)) {
      reject(
        `Directory ${fileName} already exists; Did you download this package already?`
      );
      // return false
    }

    cli.action.start(`Cloning repository ${repository}...`);
    if (shell.exec(`git clone ${repository}`).code !== 0) {
      reject("Error: Installation failed");
    }

    cli.action.stop();

    cli.action.start("Cleaning installation...");
    if (shell.exec(`rm -R -f ${folder}${fileName}/.git`).code !== 0) {
      reject("Error: removing .git directory");
    }

    cli.action.stop();

    resolve("Done");
  });

export const rmSync = function (path: string) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    for (const [, file] of files.entries()) {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        rmSync(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    }

    fs.rmdirSync(path);
  }
};

export const checkIfDirectoryExists = (path: string) => {
  const fs = require("fs");
  if (fs.existsSync(path)) {
    return true;
  }

  return false;
};

export default { download, decompress, downloadEditor, clone, rmSync };
