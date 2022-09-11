import { esbuildTransformPlugin } from "./esbuild";
import { resolvePlugin } from "./resolve";
import { importAnalysisPlugin } from "./importAnalysis";
import { cssPlugin } from "./css";
import { assetPlugin } from "./assets";
import { Plugin } from "../plugin";

export function resolvePlugins(): Plugin[] {
  return [
    resolvePlugin(),
    esbuildTransformPlugin(),
    importAnalysisPlugin(),
    cssPlugin(),
    assetPlugin(),
  ];
}
