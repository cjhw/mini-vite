import { Plugin } from "../plugin";
import { cleanUrl, normalizePath, removeImportQuery } from "../utils";

export function assetPlugin(): Plugin {
  return {
    name: "m-vite:asset",
    async load(id) {
      const cleanedId = removeImportQuery(cleanUrl(normalizePath(id)));

      // 这里仅处理 svg
      if (cleanedId.endsWith(".svg")) {
        return {
          // 包装成一个 JS 模块
          code: `export default "${cleanedId.replace("C:", "")}"`,
        };
      }
    },
  };
}
