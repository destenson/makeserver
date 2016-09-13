const path = require("path");
const chokidar = require('chokidar');
const deps = require("./dependencies");
const config = require("./config");
const files = require("./files");
const compiler = require("./compiler");

function updateDeps(isSource, file)
{
  if(!isSource)
    return Promise.resolve(deps.getDependents(file))
  else
    return deps.updateDependencies(file).then(() => [file]);
}

function FileWatcher(file)
{
    const isSource = files.filterFile(file);
    let watcher = chokidar.watch(file)

      .on("change", () => {

        updateDeps(isSource, file).then((toCompile) => {
          compiler.filesChanged(toCompile);
        })

        .catch((err) => {
          console.error(err);
        });
      })

      .on("unlink", () => {
          if(isSource)
          {
            deps.removeDependencies(file);
            compiler.removeFile(file);
          }

          else
          {
            let toCompile = deps.getDependents(file);
            compiler.filesChanged(toCompile);
          }
        });
}

function DirWatcher(dir)
{

    let watcher = chokidar.watch(dir, {ignoreInitial: true})

      .on("add", (file) => {
        file = path.resolve(dir, file);
        let toCompile = deps.getDependents(file);
        compiler.filesChanged(toCompile);
        if(!files.filterFile(file))
          return;

        deps.updateDependencies(file).then(() => {
          FileWatcher(file);
        });
      });
}

function init()
{
  return files.getAllFiles().then((paths) => {
    paths.forEach(FileWatcher);
    config.srcDirs.forEach(DirWatcher);
    return true;
  });
}

module.exports = {
  init
};
