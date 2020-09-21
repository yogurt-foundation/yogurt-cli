const { join, relative } = require('path')
const glob = require('glob')
const spawn = require('cross-spawn')
const validate = require('validate-npm-package-name')

const rootDir = __dirname

module.exports = {
  prompts: require('./prompts'),
  templateData() {
    const pm = this.answers.pm === 'yarn' ? 'yarn' : 'npm'
    const pmRun = this.answers.pm === 'yarn' ? 'yarn' : 'npm run'
    return {
      pm,
      pmRun
    }
  },
  actions() {
    const validation = validate(this.answers.name)
    validation.warnings && validation.warnings.forEach((warn) => {
      console.warn('Warning:', warn)
    })
    validation.errors && validation.errors.forEach((err) => {
      console.error('Error:', err)
    })
    validation.errors && validation.errors.length && process.exit(1)

    const actions = [{
      type: 'add',
      files: '**'
    }]

    actions.push({
      type: 'move',
      patterns: {
        gitignore: '.gitignore'
      }
    })

    actions.push({
      type: 'modify',
      files: 'package.json',
      handler(data) {
        delete data.scripts['']
        delete data.dependencies['']
        delete data.devDependencies['']
        return data
      }
    })

    return actions
  },
  async completed() {
    this.gitInit()

    await this.npmInstall({ npmClient: this.answers.pm })

    const chalk = this.chalk
    const isNewFolder = this.outDir !== process.cwd()
    const relativeOutFolder = relative(process.cwd(), this.outDir)
    const cdMsg = isNewFolder ? chalk `\t{green cd ${relativeOutFolder}}\n` : ''
    const pmRun = this.answers.pm === 'yarn' ? 'yarn' : 'npm run'

    console.log(chalk `\n{bold Successfully created project} {green ${this.answers.name}}\n`)
    console.log(chalk `{bold For development:}\n`)
    console.log(chalk `${cdMsg}\t{green ${pmRun} build-dev}`)
    console.log(chalk `{bold For production:}\n`)
    console.log(chalk `${cdMsg}\t{green ${pmRun} build-prod}\n`)

  }
}
