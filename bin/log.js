const ALERT = 1;
const CRITICAL = 2;
const ERROR = 4;
const WARNING = 8;
const NOTICE = 16;
const INFO = 32;
const DEBUG = 64;

let flags = ALERT | CRITICAL | ERROR | WARNING
  | NOTICE | INFO;

function logMessage(level, ...args)
{
  if(flags & level)
    console.log.apply(console, args);
}

function setFlags(newFlags)
{
  flags = newFlags;
}

module.exports = {
  ALERT, CRITICAL, ERROR, WARNING, NOTICE, INFO, DEBUG,
  a: logMessage.bind(null, ALERT),
  c: logMessage.bind(null, CRITICAL),
  e: logMessage.bind(null, ERROR),
  w: logMessage.bind(null, WARNING),
  n: logMessage.bind(null, NOTICE),
  i: logMessage.bind(null, INFO),
  d: logMessage.bind(null, DEBUG),
};
