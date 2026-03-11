const path = require('path')
const process = require('process')
const fs = require('fs')

let config

const configPath = path.join(process.cwd(), 'rollup.es6.config.js')
if (fs.existsSync(configPath)) {
  config = require(configPath)
}

module.exports = config
