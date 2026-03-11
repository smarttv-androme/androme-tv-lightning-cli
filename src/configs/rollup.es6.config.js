const path = require('path')
const process = require('process')
const fs = require('fs')
const chalk = require('chalk')

let config

const configPath = path.join(process.cwd(), 'rollup.es6.config.js')
if (fs.existsSync(configPath)) {
  config = require(configPath)
} else {
  console.warn(chalk.yellow('\nRollup es6 config not found.'))
}

module.exports = config
