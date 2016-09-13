const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const config = require("./config");
const exec = require("child_process").exec;

let dependenciesMap = {};
let dependentsMap = {};

function updateDepsMaps(file, dependencies)
{
  let oldDependencies = dependenciesMap[file] || [];
  oldDependencies.forEach((dep) => {
    delete dependentsMap[dep][file];
  });

  dependenciesMap[file] = dependencies;
  dependencies.forEach((dep) => {
    if(!dependentsMap[dep])
      dependentsMap[dep] = {};
    dependentsMap[dep][file] = true;
  });
}


function parseMM(data)
{
  let deps = data.split(":")[1].trim();
  let files = deps.split(/\s+/)
    .filter((x) => x != '\\');
  return files.slice(1);
}

function execMM(file)
{
  return new Promise((resolve, reject) => {
    exec(config.cxx + " -MM " + config.cxxflags
      + " " + file, (err, stdout) => {
        if(err)
          resolve([]);
        else
          resolve(parseMM(stdout.toString()));
    });
  });
}

function findDependencies(file)
{
  return execMM(file).then((deps) => {
    updateDepsMaps(file, deps);
    return deps;
  });
}

function getDependencies(file)
{
  if(dependenciesMap[file])
  {
    return Promise.resolve(dependenciesMap[file]);
  }
  else
  {
    return findDependencies(file);
  }
}

function getAllDependencies(files)
{
  return Promise.all(files.map(getDependencies))
    .then((deps) => {
      return _.uniq(_.flatten(deps));
    });
}

function getDependents(file)
{
  return _.keys(dependentsMap[file] || {});
}

function updateDependencies(file)
{
  return findDependencies(file);
}

function removeDependencies(file)
{
  let oldDependencies = dependenciesMap[file] || [];
  oldDependencies.forEach((dep) => {
    delete dependentsMap[dep][file];
  });

  delete dependenciesMap[file];
}

module.exports = {
  getDependencies,
  getAllDependencies,
  getDependents,
  updateDependencies,
  removeDependencies,

  dependenciesMap,
  dependentsMap
};
