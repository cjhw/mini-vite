import { esbuildTransformPlugin } from './esbuild'
import { resolvePlugin } from './resolve'
import { importAnalysisPlugin } from './importAnalysis'
import { Plugin } from '../plugin'

export function resolvePlugins(): Plugin[] {
  return [esbuildTransformPlugin(), resolvePlugin(), importAnalysisPlugin()]
}
