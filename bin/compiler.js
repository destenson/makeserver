const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;
const spawn = require("child_process").spawn;
const _ = require("lodash");
const config = require("./config");
const files = require("./files");
const promises = require("./promises");
const log = require("./log");

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

  let pre = isC ? config.ccPre : config.cxxPre;
  let post = isC ? config.ccPost : config.cxxPost;

  return pre + compiler + " " + flags + " -c "
    + file + " -o " + out + post;
}

function getLinkCommand()
{
  let input = _.keys(srcs).map(getObject).join(" ");
  return config.cxx + " " + config.cxxflags + " " + input
    + " " + config.ldflags + " -o " + config.target;
}

function execCompile(file)
{
  const cmd = getCompileCommand(file);
  log.i("Compiling " + path.relative(config.dir, file) + "...");
  log.d(cmd);
  let source = srcs[file];
  source.state = States.Compiling;

  promises.cache(file, (resolve, reject) => {
    let child = exec(cmd, (err, stdout, stderr) => {

        let state;

        if(err)
        {
          log.e("Command " + cmd + " failed");
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

    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(data);
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
      log.d(cmd);
      log.i("Building binary...");

      let child = exec(cmd, (err, stdout, stderr) => {

        let state

        if(err)
        {
          log.e("Command " + cmd + " failed");
          state = States.Fail;
        }
        else
        {
          state = States.Ok;
          log.i("Binary "
            + path.relative(config.dir, config.target)
            + " successfully built");
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

      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      child.stderr.on('data', (data) => {
        process.stderr.write(data);
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
    log.e("sigint failed", e);
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
      log.e("spawn failed", e);
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
  srcs[file] = {
      state: States.NotCompiled,
      nextState: null
  };
}

function removeFile(file)
{
  log.d("File removed: ", file);
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
  log.d("Files invalided: ", files);
  files.forEach(fileChanged);
  return link();
}

function addFileOut(file)
{
  if(targetState == States.Compiling)
    nexTargetState = States.NotCompiled;
  else
    targetState = States.NotCompiled;

  log.d("File added: ", file);
  addFile(file);
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
  addFile: addFileOut,
  removeFile,
  filesChanged,
  clean,

  compileFile,
  compileAll,
  link,
  run,
  crun
};
