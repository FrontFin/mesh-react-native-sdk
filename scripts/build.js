#!/usr/bin/env node
const fs = require('fs')

const rawData = fs.readFileSync('package.json', 'utf8')
const packageModel = JSON.parse(rawData)

delete packageModel.scripts
delete packageModel.devDependencies
delete packageModel.husky
delete packageModel['lint-staged']
delete packageModel['size-limit']
delete packageModel.publishConfig
delete packageModel.packageManager
delete packageModel.prettier

fs.writeFileSync('dist/package.json', JSON.stringify(packageModel, null, 2))
console.log('package.json.dist was copied to ./dist folder')

fs.copyFileSync('src/types.d.ts', 'dist/types.d.ts')
console.log('types were copied to dist/types.d.tst')

fs.copyFileSync('LICENSE.md', 'dist/LICENSE.md')
console.log('LICENSE.md was copied to dist/LICENSE.md')

fs.copyFileSync('README.md', 'dist/README.md')
console.log('README.md was copied to dist/README.md')

fs.cpSync('assets', 'dist/assets', { recursive: true })
console.log('assets were copied to dist/assets')
