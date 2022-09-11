import connect from 'connect'
// picocolors 是一个用来在命令行显示不同颜色文本的工具
import { blue, green } from 'picocolors'
import { optimize } from '../optimizer'
import { resolvePlugins } from '../plugins'
import { Plugin } from '../plugin'
import { createPluginContainer, PluginContainer } from '../pluginContainer'
import { indexHtmlMiddware } from './middlwares/indexHtml'
import { transformMiddleware } from './middlwares/transform'

export interface ServerContext {
  root: string
  pluginContainer: PluginContainer
  app: connect.Server
  plugins: Plugin[]
}

export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = Date.now()
  const plugins = resolvePlugins()
  const pluginContainer = createPluginContainer(plugins)

  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
  }

  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext)
    }
  }

  // // 核心编译逻辑
  app.use(transformMiddleware(serverContext))

  // 入口 HTML 资源
  app.use(indexHtmlMiddware(serverContext))

  app.listen(3000, async () => {
    await optimize(root)
    console.log(
      green('🚀 No-Bundle 服务已经成功启动!'),
      `耗时: ${Date.now() - startTime}ms`
    )
    console.log(`> 本地访问路径: ${blue('http://localhost:3000')}`)
  })
}
