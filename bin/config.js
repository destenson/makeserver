const program = require('commander');
const path = require("path");
const fs = require("fs");

const CONFIG_FILE = "make.json";
const dir = program.dir || '.';

let data;
try
{
  data = fs.readFileSync(path.join(dir, CONFIG_FILE));
}
catch(e)
{
  data = "{}";
}

let config = JSON.parse(data);

config.port = config.port || 3300;
config.cc = config.cc || "gcc";
config.ccPre = config.ccPre || "";
config.ccPost = config.ccPost || "";
config.cflags = config.cflags || "";
config.cxx = config.cxx || "g++";
config.cxxPre = config.cxxPre || "";
config.cxxPost = config.cxxPost || "";
config.cxxflags = config.cxxflags || "";
config.ldflags = config.ldflags || "";
config.target = config.target || "a.out";
config.srcFiles = config.srcFiles || [];
config.srcDirs = config.srcDirs || [];
config.autorun = config.autorun || false;
config.dir = dir;

config.srcFiles = config.srcFiles.map((p) => {
  return path.resolve(dir, p);
});

config.srcDirs = config.srcDirs.map((p) => {
  return path.resolve(dir, p);
});

config.target = path.resolve(dir, config.target);


module.exports = config;
