import { Plugin } from "../plugin";
import {
  cleanUrl,
  normalizePath,
  removeImportQuery,
  isWindows,
} from "../utils";

export function assetPlugin(): Plugin {
  return {
    name: "m-vite:asset",
    async load(id) {
      const cleanedId = removeImportQuery(cleanUrl(normalizePath(id)));

      // 这里仅处理 svg
      if (cleanedId.endsWith(".svg")) {
        return {
          // 包装成一个 JS 模块  window系统要把磁盘标识换掉
          code: isWindows
            ? `export default "${cleanedId.replace(/[A-Z]\:/g, "")}"`
            : `export default "${cleanedId}"`,
        };
      }
    },
  };
}
