// 裸模块地址重写
function rewriteImport(content) {
  return content.replace(/ from ['"](.*)['"]/g, function (s1, s2) {
    if (s2.startsWith('./') || s2.startsWith('../') || s2.startsWith('/')) {
      return s1
    } else {
      return ` from '/@modules/${s2}'`
    }
  })
}

module.exports = {
  rewriteImport,
}
