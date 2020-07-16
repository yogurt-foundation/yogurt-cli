const { random } = require('superb')

module.exports = [
  {
    name: 'name',
    message: 'Project name',
    default: '{outFolder}'
  },
  {
    name: 'description',
    message: 'Project description',
    default: `My ${random()} Yogurt.css project`
  },
  {
    name: 'author',
    type: 'string',
    message: 'Author name',
    default: '{gitUser.name}',
    store: true
  },
  {
    name: 'pm',
    message: 'Choose the package manager',
    choices: [
      { name: 'Yarn', value: 'yarn' },
      { name: 'Npm', value: 'npm' }
    ],
    type: 'list',
    default: 'yarn'
  }
]
