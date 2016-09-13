
let listeners = {};

function cache(id, cons)
{
  listeners[id] = [];

  let onResolved = (i, data) => {
    listeners[id].forEach((list) => {
      if(list[i])
        list[i](data);
    });
    listeners[id] = [];
  };

  cons(onResolved.bind(null, 0),
    onResolved.bind(null, 1));
}

function getCached(id)
{
  return new Promise((resolve, reject) => {
    listeners[id].push([resolve, reject]);
  });
}

module.exports = {
  cache,
  getCached
};
