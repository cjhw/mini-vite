const Koa = require('koa')

const fs = require('fs')
const path = require('path')
const complierSFC = require('@vue/compiler-sfc')
const complierDOM = require('@vue/compiler-dom')

const { rewriteImport } = require('./src/utils')

const app = new Koa()

app.use(async (ctx) => {
  const { url, query } = ctx.request
  if (url === '/') {
    // 加载html
    ctx.type = 'text/html'
    ctx.body = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8')
  } else if (url.endsWith('.js')) {
    // 加载js文件
    const p = path.join(__dirname, url)
    // console.log(url)
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(fs.readFileSync(p, 'utf-8'))
  } else if (url.startsWith('/@modules/')) {
    // 模块名称
    const moduleName = url.replace('/@modules/', '')
    // node_modules目录里找
    const prefix = path.join(__dirname, '../node_modules', moduleName)
    // package.json的module字段
    const module = require(prefix + '/package.json').module
    const filePath = path.join(prefix, module)
    console.log(filePath)
    const res = fs.readFileSync(filePath, 'utf-8')
    ctx.type = 'application/javascript'
    ctx.body = rewriteImport(res)
  } else if (url.indexOf('.vue') > -1) {
    // 获取加载文件的路径
    const p = path.join(__dirname, url.split('?')[0])
    const ast = complierSFC.parse(fs.readFileSync(p, 'utf-8'))
    console.log(ast)
    if (!query.type) {
      // SFC请求
      // 读取vue文件,解析为js
      // 获取脚本部分的内容
      const scriptContent = ast.descriptor.script.content
      // 替换默认导出为一个常量，方便后面修改
      const script = scriptContent.replace(
        'export default ',
        'const __script = '
      )
      ctx.type = 'application/javascript'
      ctx.body = `${rewriteImport(script)}
      // 解析tpl
      import {render as __render} from '${url}?type=template'
      __script.render = __render
      export default __script
      `
    } else if (query.type === 'template') {
      const tpl = ast.descriptor.template.content
      // 编译成render函数
      const render = complierDOM.compile(tpl, { mode: 'module' }).code
      console.log(render)
      ctx.type = 'application/javascript'
      ctx.body = rewriteImport(render)
    }
  }
})

app.listen(3000, () => {
  console.log('启动成功')
})
