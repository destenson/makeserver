const path = require("path");
const fs = require("fs");
const recReaddir = require("recursive-readdir");
const _ = require("lodash");
const config = require("./config");
const deps = require("./dependencies");

const EXTS_MAP = {
  ".cc": true,
  ".cpp": true,
  ".cxx": true,
  ".c": true
};

function filterFile(file)
{
  return !!EXTS_MAP[path.extname(file)];
}

function readDir(dir)
{
  return new Promise((resolve, reject) => {
    recReaddir(dir, (err, files) => {
      files = files || [];
      resolve(files.map((file) => {
        return path.resolve(dir, file);
      }))
    });
  });
}

function readDirs(dirs)
{
  return Promise.all(dirs.map(readDir))
    .then((data) => _.flatten(data));
}


let srcPaths = null;
let allPaths = null;

function getSrcFiles()
{
  if(srcPaths)
    return Promise.resolve(srcPaths);

  let files = config.srcFiles;

  return readDirs(config.srcDirs).then((data) => {
    files = files.concat(data);
    srcPaths = _.uniq(files.filter(filterFile));
    return srcPaths;
  });
}

function getAllFiles()
{
  if(allPaths)
    return Promise.resolve(allPaths);

  let files = null;

  return getSrcFiles().then((res) => {
      files = res;
      return deps.getAllDependencies(files);
  })

  .then((res) => {
    allPaths = files.concat(res);
    return allPaths;
  });
}


module.exports = {
  getSrcFiles,
  getAllFiles,
  filterFile
};
