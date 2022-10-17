import connect from "connect";
// picocolors 是一个用来在命令行显示不同颜色文本的工具
import { blue, green } from "picocolors";
import { optimize } from "../optimizer";
import { resolvePlugins } from "../plugins";
import { Plugin } from "../plugin";
import { createPluginContainer, PluginContainer } from "../pluginContainer";
import { indexHtmlMiddware } from "./middlwares/indexHtml";
import { transformMiddleware } from "./middlwares/transform";
import { staticMiddleware } from "./middlwares/static";
import { ModuleGraph } from "../ModuleGraph";
import chokidar, { FSWatcher } from "chokidar";
import { createWebSocketServer } from "../ws";
import { bindingHMREvents } from "../hmr";

export interface ServerContext {
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
  moduleGraph: ModuleGraph;
  // WebSocket 服务端实例
  ws: { send: (data: any) => void; close: () => void };
  // 文件变化监控
  watcher: FSWatcher;
}

export async function startDevServer() {
  debugger;
  const app = connect();
  const root = process.cwd();

  const startTime = Date.now();
  const plugins = resolvePlugins();
  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url));
  const pluginContainer = createPluginContainer(plugins);
  const watcher = chokidar.watch(root, {
    ignored: ["**/node_modules/**", "**/.git/**"],
    ignoreInitial: true,
  });

  // WebSocket 对象
  const ws = createWebSocketServer(app);

  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher,
  };

  bindingHMREvents(serverContext);

  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext);
    }
  }

  // // 核心编译逻辑
  app.use(transformMiddleware(serverContext));

  // 入口 HTML 资源
  app.use(indexHtmlMiddware(serverContext));

  // 静态资源
  app.use(staticMiddleware());

  app.listen(3000, async () => {
    await optimize(root);
    console.log(
      green("🚀 No-Bundle 服务已经成功启动!"),
      `耗时: ${Date.now() - startTime}ms`
    );
    console.log(`> 本地访问路径: ${blue("http://localhost:3000")}`);
  });
}
