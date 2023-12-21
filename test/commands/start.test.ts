import { expect, test } from "@oclif/test"
import { mockFolders, restoreMockFolders, isDirEmpty } from "../utils"
import { CONFIG_SAMPLE, EDITOR_VERSION } from "../utils/fixtures"
import * as fs from "fs"
import * as chai from "chai"
/* eslint-disable @typescript-eslint/no-var-requires */
const chaiHttp = require("chai-http")

chai.use(chaiHttp)

describe("start", () => {
  afterEach(() => {
    /* eslint-disable node/no-missing-require */
    const { TEST_SERVER } = require("../../src/managers/server/index")

    if (TEST_SERVER) {
      TEST_SERVER.close()
    }
  })

  test
    .stdout()
    .command(["start"])
    .it("should throws an error if no learn.json file present", ctx => {
      expect(ctx.stdout).to.contain(
        "⨉ learn.json file not found on current folder, is this a learnpack package?"
      )
    })

  test
    .do(() => {
      mockFolders({
        "learn.json": JSON.stringify(CONFIG_SAMPLE),
        exercises: {
          "01.12-hello-world": {},
        },
      })
    })
    .command(["start"])
    .it(
      "Giving learn.json file, it should create the .learn folder if doesn't exits",
      ctx => {
        expect(fs.existsSync(".learn")).to.be.true
        restoreMockFolders()
      }
    )

  test
    .nock("https://github.com", api =>
      (api as any)
        .head(`/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist`)
        .reply(200)
    )
    .nock("https://github.com", api =>
      (api as any)
        .get(
          `/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist/app.tar.gz?raw=true`
        )
        .replyWithFile(200, `${__dirname}/../utils/dummy.tar.gz`, {
          "content-type": "application/octet-stream",
        })
    )
    .do(() => {
      mockFolders({
        "learn.json": JSON.stringify(CONFIG_SAMPLE),
        exercises: {
          "01.12-hello-world": {},
        },
      })
    })
    .command(["start"])
    .it(
      "Giving learn.json file, it should download the editor UI and save it as .learn/app.tar.gz",
      ctx => {
        expect(fs.existsSync(".learn/app.tar.gz")).to.be.true
        restoreMockFolders()
      }
    )

  test
    .skip()
    .nock("https://github.com", api =>
      (api as any)
        .head(`/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist`)
        .reply(200)
    )
    .nock("https://github.com", api =>
      (api as any)
        .get(
          `/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist/app.tar.gz?raw=true`
        )
        .replyWithFile(200, `${__dirname}/../utils/dummy.tar.gz`, {
          "content-type": "application/octet-stream",
        })
    )
    .do(() => {
      mockFolders({
        "learn.json": JSON.stringify(CONFIG_SAMPLE),
        exercises: {
          "01.12-hello-world": {},
        },
      })
    })
    .command(["start"])
    .it(
      "Giving learn.json file, it should decompress the app.tar.gz file into .learn/_app folder",
      ctx => {
        expect(isDirEmpty(".learn/_app")).to.be.false
        restoreMockFolders()
      }
    )

  test
    .nock("https://github.com", api =>
      (api as any)
        .head(`/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist`)
        .reply(200)
    )
    .nock("https://github.com", api =>
      (api as any)
        .get(
          `/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist/app.tar.gz?raw=true`
        )
        .replyWithFile(200, `${__dirname}/../utils/dummy.tar.gz`, {
          "content-type": "application/octet-stream",
        })
    )
    .do(() => {
      mockFolders({
        "learn.json": JSON.stringify(CONFIG_SAMPLE),
        exercises: {
          "01.12-hello-world": {},
        },
      })
    })
    .command(["start"])
    .it(
      "It should start a server on port 3004 and return 200 in route /config",
      (_, done) => {
        (chai as any)
          .request("http://localhost:3004")
          .get("/config")
          .end((_: any, res: any) => {
            expect(res.status).to.equal(200)
            restoreMockFolders()
            done()
          })
      }
    )

  test
    .nock("https://github.com", api =>
      (api as any)
        .head(`/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist`)
        .reply(200)
    )
    .nock("https://github.com", api =>
      (api as any)
        .get(
          `/learnpack/coding-ide/blob/${EDITOR_VERSION}/dist/app.tar.gz?raw=true`
        )
        .replyWithFile(200, `${__dirname}/../utils/dummy.tar.gz`, {
          "content-type": "application/octet-stream",
        })
    )
    .do(() => {
      mockFolders({
        "learn.json": JSON.stringify(CONFIG_SAMPLE),
        exercises: {
          "01.12-hello-world": {},
        },
      })
    })
    .command(["start"])
    .it("The route /config should return the config file", (_, done) => {
      (chai as any)
        .request("http://localhost:3004")
        .get("/config")
        .end((_: any, res: any) => {
          expect(res.body.config).not.to.be.undefined
          restoreMockFolders()
          done()
        })
    })
})
