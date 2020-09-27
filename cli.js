#!/usr/bin/env node

const path = require('path')
const sao = require('sao')
const cac = require('cac')
const chalk = require('chalk')
const envinfo = require('envinfo')
const welcome = require('cli-welcome')

const { version } = require('./package.json')
const generator = path.resolve(__dirname, './')
const log = console.log
const cli = cac('create-yogurt-app')

const showEnvInfo = async() => {
  log(chalk.bold('\nEnvironment Info:'))
  const result = await envinfo
    .run({
      System: ['OS', 'CPU'],
      Binaries: ['Node', 'Yarn', 'npm'],
      Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari']
    })
  log(result)
  process.exit(1)
}

cli
  .command('[output_dir]', 'Create new project in custom directory or current directory')
  .option('-i, --info', 'Print out debugging information relating to the local environment')
  .option('--answers <json>', 'Skip all the prompts and use the provided answers')
  .option('--verbose', 'Show debug logs')
  .action((outDir = '.', cliOptions) => {
    if (cliOptions.info) {
      return showEnvInfo()
    }
    welcome(
      `Yogurt CSS`,
      `New project Scaffolder\n\nWelcome! This empty project is also a build tool that bundles\nwith preprocessors and postprocessors for the frontend\ndevelopment environment.\n\nYogurt CSS Documentation (http://yogurtcss.netlify.app/)\n\n\Twitter (https://twitter.com/yogurtcss)\nDiscord (https://discord.gg/A62YjNR)`, {
        version: `v${version}`,
        bgColor: `#ffffff`,
        color: `#000000`,
        bold: true,
        clear: true
      }
    )
    log(chalk `Generating Yogurt.css project in {green ${outDir}} directory.`)

    const { verbose, answers } = cliOptions
    const logLevel = verbose ? 4 : 2
    sao({ generator, outDir, logLevel, answers, cliOptions })
      .run()
      .catch((err) => {
        console.trace(err)
        process.exit(1)
      })
  })

cli.help()

cli.version(version)

cli.parse()
