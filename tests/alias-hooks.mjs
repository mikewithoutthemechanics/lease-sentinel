// Lets node:test resolve the project's "@/..." path alias the same way
// TypeScript and Next.js do, so server modules can be unit tested directly.
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const target = path.join(srcRoot, specifier.slice(2))
    return nextResolve(pathToFileURL(`${target}.ts`).href, context)
  }
  return nextResolve(specifier, context)
}
