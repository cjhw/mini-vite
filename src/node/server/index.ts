import connect from 'connect'

// picocolors 是一个用来在命令行显示不同颜色文本的工具
import { blue, green } from 'picocolors'

export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = Date.now()
  app.listen(3000, async () => {
    console.log(
      green('🚀 No-Bundle 服务已经成功启动!'),
      `耗时: ${Date.now() - startTime}ms`
    )
    console.log(`> 本地访问路径: ${blue('http://localhost:3000')}`)
  })
}
