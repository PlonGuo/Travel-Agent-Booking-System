/**
 * Prepares Prisma client for electron-builder packaging
 * Copies .prisma/client to node_modules/.prisma/client so it can be found by @prisma/client
 */

const fs = require('fs')
const path = require('path')

const projectRoot = path.join(__dirname, '..')

// Source: pnpm's nested structure
const pnpmPrismaPath = path.join(
  projectRoot,
  'node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client'
)

// Destination: standard node_modules location that @prisma/client expects
const targetPrismaDir = path.join(projectRoot, 'node_modules/.prisma')
const targetPrismaClient = path.join(targetPrismaDir, 'client')

console.log('Preparing Prisma client for packaging...')

// Remove existing .prisma directory if it exists
if (fs.existsSync(targetPrismaDir)) {
  fs.rmSync(targetPrismaDir, { recursive: true })
  console.log('Removed existing node_modules/.prisma')
}

// Create .prisma directory
fs.mkdirSync(targetPrismaDir, { recursive: true })

// Copy the client folder
function copyRecursive(src, dest) {
  const stats = fs.statSync(src)

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    const files = fs.readdirSync(src)
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file))
    }
  } else {
    fs.copyFileSync(src, dest)
  }
}

if (fs.existsSync(pnpmPrismaPath)) {
  copyRecursive(pnpmPrismaPath, targetPrismaClient)
  console.log(`Copied .prisma/client to ${targetPrismaClient}`)

  // List copied files
  const files = fs.readdirSync(targetPrismaClient)
  console.log(`Files copied: ${files.length}`)
  console.log('Engine files:', files.filter(f => f.endsWith('.node')))
} else {
  console.error(`ERROR: Source path not found: ${pnpmPrismaPath}`)
  console.log('Checking for alternative paths...')

  // Try to find the correct path
  const pnpmDir = path.join(projectRoot, 'node_modules/.pnpm')
  if (fs.existsSync(pnpmDir)) {
    const dirs = fs.readdirSync(pnpmDir).filter(d => d.startsWith('@prisma+client'))
    console.log('Found Prisma client directories:', dirs)
  }

  process.exit(1)
}

console.log('Prisma client prepared successfully!')
