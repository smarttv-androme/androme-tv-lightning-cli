/*
 * If not stated otherwise in this file or this component's LICENSE file the
 * following copyright and licenses apply:
 *
 * Copyright 2020 Metrological
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path')
const process = require('process')
const fs = require('fs')
const resolve = require('@rollup/plugin-node-resolve').nodeResolve
const commonjs = require('@rollup/plugin-commonjs')
const alias = require('@rollup/plugin-alias')
const json = require('@rollup/plugin-json')
const virtual = require('@rollup/plugin-virtual')
const inject = require('@rollup/plugin-inject')
const image = require('@rollup/plugin-image')
const typescript = require('@rollup/plugin-typescript')
const buildHelpers = require(path.join(__dirname, '../helpers/build'))
const minify = require('rollup-plugin-terser').terser
const license = require('rollup-plugin-license')
const os = require('os')
const extensions = ['.js', '.ts', '.mjs']
const deepMerge = require('deepmerge')
const chalk = require('chalk')

let customConfig

if (process.env.LNG_CUSTOM_ROLLUP === 'true') {
  const customConfigPath = path.join(process.cwd(), 'rollup.es5.config.js')
  if (fs.existsSync(customConfigPath)) {
    customConfig = require(customConfigPath)
  } else {
    console.warn(
      chalk.yellow('\nCustom rollup config not found while LNG_CUSTOM_ROLLUP is set to true')
    )
  }
}

const defaultConfig = {
  onwarn(warning, warn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      warn(warning)
    }
  },
  plugins: [
    json(),
    image(),
    fs.existsSync(path.join(process.cwd(), 'tsconfig.json')) && typescript(),
    inject({
      'process.env': 'processEnv',
    }),
    virtual({
      processEnv: `export default ${JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        ...buildHelpers.getEnvAppVars(process.env),
      })}`,
    }),
    alias({
      entries: {
        'wpe-lightning': path.join(__dirname, '../alias/wpe-lightning.js'),
        '@lightningjs/core': path.join(__dirname, '../alias/lightningjs-core.js'),
        '@': path.resolve(process.cwd(), 'src/'),
        '~': path.resolve(process.cwd(), 'node_modules/'),
      },
    }),
    resolve({ extensions, mainFields: buildHelpers.getResolveConfigForBundlers() }),
    commonjs({ sourceMap: false }),
    (process.env.LNG_BUILD_MINIFY === 'true' || process.env.NODE_ENV === 'production') &&
      minify({ keep_fnames: true }),
    license({
      banner: {
        content: [
          'App version: <%= data.appVersion %>',
          'SDK version: <%= data.sdkVersion %>',
          'CLI version: <%= data.cliVersion %>',
          '',
          'Generated: <%= data.gmtDate %>',
        ].join(os.EOL),
        data() {
          const date = new Date()
          return {
            appVersion: buildHelpers.getAppVersion(),
            sdkVersion: buildHelpers.getSdkVersion(),
            cliVersion: buildHelpers.getCliVersion(),
            gmtDate: date.toGMTString(),
          }
        },
      },
    }),
  ],
  output: {
    format: 'iife',
    inlineDynamicImports: true,
    sourcemap:
      process.env.NODE_ENV === 'production'
        ? true
        : process.env.LNG_BUILD_SOURCEMAP === undefined
        ? true
        : process.env.LNG_BUILD_SOURCEMAP === 'false'
        ? false
        : process.env.LNG_BUILD_SOURCEMAP,
  },
}

const finalConfig = customConfig ? deepMerge(defaultConfig, customConfig) : defaultConfig
module.exports = finalConfig
