// filetoc.config.js
module.exports = {
  remoteUrl: "https://github.com/cjhw/mini-vite", // your repo address
  mainBranch: "main", // your default branch. default 'main'
  dirPath: ".", //  the dir where you want to gengerate the toc. default '.'
  mdPath: ["./README.md", "./README.zh.md"], // the markdown files path, when there is only one path, it also can be a string.  default ['README.md']
  excludes: [".git", "node_modules", "playground/node_modules"], // the excludes file name or dir name
};
