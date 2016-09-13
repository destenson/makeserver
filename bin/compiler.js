const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;
const spawn = require("child_process").spawn;
const _ = require("lodash");
const config = require("./config");
const files = require("./files");
const promises = require("./promises");

const States = {
  NotCompiled: 1,
  Compiling: 2,
  Ok: 3,
  Fail: 4
};

let srcs = {};
let targetState = null;
let nexTargetState = null;
let execChild = null;

function getObject(file)
{
  return file.substr(0, file.lastIndexOf('.')) + ".o";
}

function getCompileCommand(file)
{
  let out = getObject(file);
  let isC = path.extname(file) === ".c";

  let [compiler, flags] = isC ? [config.cc, config.cflags]
    : [config.cxx, config.cxxflags];

  return compiler + " " + flags + " -c " + file + " -o " + out;
}

function getLinkCommand()
{
  let input = _.keys(srcs).map(getObject).join(" ");
  return config.cxx + " " + config.cxxflags + " " + config.ldflags
    + " " + input + " -o " + config.target;
}

function execCompile(file)
{
  const cmd = getCompileCommand(file);
  console.log(cmd);
  let source = srcs[file];
  source.state = States.Compiling;

  promises.cache(file, (resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {

        let state;

        if(err)
        {
          console.error("Command " + cmd + " failed");
          console.error(stderr);
          state = States.Fail;
        }
        else
        {
          state = States.Ok;
        }

        if(source.nextState != null)
        {
          source.state = source.nextState;
          source.nextState = null;
        }
        else
          source.state = state;

        resolve(source.state);
    });
  });
}

function execLink()
{
  targetState = States.Compiling;

  promises.cache(config.target, (resolve, reject) => {

    compileAll().then((ok) => {

      if(!ok)
      {
        if(nexTargetState != null)
        {
          targetState = nexTargetState;
          nexTargetState = null;
        }
        else
          targetState = States.Fail;
        resolve(targetState);
        return;
      }

      const cmd = getLinkCommand();
      console.log(cmd);

      exec(cmd, (err, stdout, stderr) => {

        let state

        if(err)
        {
          console.error("Command " + cmd + " failed");
          console.error(stderr);
          state = States.Fail;
        }
        else
        {
          state = States.Ok;
        }

        if(nexTargetState != null)
        {
          targetState = nexTargetState;
          nexTargetState = null;
        }
        else
          targetState = state;
        resolve(targetState);
      });
    })

    .catch((err) => {
      reject(err)
    });
  });
}

function execRun()
{
  try
  {
    if(execChild)
      execChild.kill("SIGINT");
  }
  catch(e)
  {
    console.error("sigint failed", e);
  }

  return new Promise((resolve, reject) => {
    try
    {
      execChild = spawn(config.target, []);

      execChild.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      execChild.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      execChild.on("close", ((code) => {
        resolve(code);
      }).bind(execChild));

    }
    catch(e)
    {
      console.log("spawn failed", e);
    }
  });
}

function link()
{
  if(targetState == States.Ok)
  {
    if(config.autorun)
      run();
    return Promise.resolve(States.Ok);
  }

  if(targetState != States.Compiling)
      execLink();

  return promises.getCached(config.target).then((state) => {
    if(state && config.autorun)
      run();
    return state;
  });
}

function compileFile(file)
{
  let source = srcs[file];
  if(source.state == States.Ok)
    return Promise.resolve(States.Ok);

  if(source.state != States.Compiling)
    execCompile(file);

  return promises.getCached(file);
}

function compileAll()
{
  return Promise.all(_.keys(srcs).map(compileFile))
    .then((states) => {
      return _.every(states, (s) => s == States.Ok);
    });
}

function silentRemove(files)
{
  return Promise.all(files.map((file) => {
    return new Promise((resolve, reject) => {
      fs.unlink(file, () => {
        resolve();
      });
    });
  }));
}


function addFile(file)
{
  console.log("File added: ", file);
  srcs[file] = {
      state: States.NotCompiled,
      nextState: null
  };
}

function removeFile(file)
{
  console.log("File removed: ", file);
  delete srcs[file];
  silentRemove([getObject(file)]);
}

function fileChanged(file)
{
  if(targetState == States.Compiling)
    nexTargetState = States.NotCompiled;
  else
    targetState = States.NotCompiled;

  let source = srcs[file];
  if(source.state == States.Compiling)
    source.nextState = States.NotCompiled;
  else
    source.state = States.NotCompiled;
}

function filesChanged(files)
{
  if(!files.length)
    return;
  console.log("Files invalided: ", files);
  files.forEach(fileChanged);
  return link();
}

function clean()
{
  return files.getSrcFiles().then((paths) => {
    paths = paths.map(getObject);
    paths.push(config.target);
    return silentRemove(paths);
  });
}

function init()
{
  return files.getSrcFiles().then((paths) => {
    targetState = States.NotCompiled;
    paths.forEach(addFile);
    return link();
  });
}

function run()
{
  return execRun();
}

function crun()
{
  return link().then((state) => {
    if(state == States.Ok)
      return run();
    else
      return state();
  });
}

module.exports = {
  init,
  addFile,
  removeFile,
  filesChanged,
  clean,

  compileFile,
  compileAll,
  link,
  run,
  crun
};
