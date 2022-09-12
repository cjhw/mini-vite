import { init, parse } from "es-module-lexer";
import {
  BARE_IMPORT_RE,
  PRE_BUNDLE_DIR,
  CLIENT_PUBLIC_PATH,
} from "../constants";
import {
  cleanUrl,
  getShortName,
  isInternalRequest,
  isJSRequest,
  normalizePath,
} from "../utils";
// magic-string 用来作字符串编辑
import MagicString from "magic-string";
import path from "path";
import { Plugin } from "../plugin";
import { ServerContext } from "../server/index";
import type { PluginContext } from "rollup";

export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext;
  return {
    name: "m-vite:import-analysis",
    configureServer(s) {
      // 保存服务端上下文
      serverContext = s;
    },
    async transform(this: PluginContext, code: string, id: string) {
      // 只处理 JS 相关的请求
      if (!isJSRequest(id) || isInternalRequest(id)) {
        return null;
      }
      await init;
      const importedModules = new Set<string>();
      // 解析 import 语句
      const [imports] = parse(code);
      const ms = new MagicString(code);
      const resolve = async (id: string, importer?: string) => {
        const resolved = await serverContext.pluginContainer.resolveId(
          id,
          importer
        );
        if (!resolved) {
          return;
        }
        const cleanedId = cleanUrl(resolved.id);
        const mod = moduleGraph.getModuleById(cleanedId);
        let resolvedId = `${getShortName(resolved.id, serverContext.root)}`;
        console.log(resolvedId);

        if (mod && mod.lastHMRTimestamp > 0) {
          resolvedId += "?t=" + mod.lastHMRTimestamp;
        }
        return resolvedId;
      };
      const { moduleGraph } = serverContext;
      const curMod = moduleGraph.getModuleById(id)!;
      // 对每一个 import 语句依次进行分析
      for (const importInfo of imports) {
        // 举例说明: const str = `import React from 'react'`
        // str.slice(s, e) => 'react'
        const { s: modStart, e: modEnd, n: modSource } = importInfo;
        if (!modSource) continue;
        // 静态资源
        if (modSource.endsWith(".svg")) {
          // 加上 ?import 后缀

          console.log(path.dirname(id));
          console.log(modSource);

          const resolvedUrl = normalizePath(
            path.relative(
              path.dirname(id),
              path.resolve(path.dirname(id), modSource)
            )
          );
          console.log(resolvedUrl);
          ms.overwrite(modStart, modEnd, `./${resolvedUrl}?import`);
          continue;
        }
        // 第三方库: 路径重写到预构建产物的路径
        if (BARE_IMPORT_RE.test(modSource)) {
          // const bundlePath = path.join(
          //   serverContext.root,
          //   PRE_BUNDLE_DIR,
          //   `${modSource}.js`
          // )
          const bundlePath = normalizePath(
            path.join("/", PRE_BUNDLE_DIR, `${modSource}.js`)
          );
          ms.overwrite(modStart, modEnd, bundlePath);
          importedModules.add(bundlePath);
        } else if (modSource.startsWith(".") || modSource.startsWith("/")) {
          // 直接调用插件上下文的 resolve 方法，会自动经过路径解析插件的处理
          const resolved = await resolve(modSource, id);
          if (resolved) {
            ms.overwrite(modStart, modEnd, resolved);
            importedModules.add(resolved);
          }
        }
      }

      // 只对业务源码注入
      if (!id.includes("node_modules")) {
        // 注入 HMR 相关的工具函数
        ms.prepend(
          `import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";` +
            `import.meta.hot = __vite__createHotContext(${JSON.stringify(
              cleanUrl(curMod.url)
            )});`
        );
      }

      return {
        code: ms.toString(),
        // 生成 SourceMap
        map: ms.generateMap(),
      };
    },
  };
}
