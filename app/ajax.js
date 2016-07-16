(function ajaxSetup() {
  var SERVER = isProd
    ? 'https://pokemapper.global.ssl.fastly.net'
    : 'http://localhost:3000';

  function _ajaxCb(request, cb) {
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        cb(null, request.responseText);
      } else {
        cb(new Error('Server error'));
      }
    };
    request.onerror = function() {
      cb(new Error('Connection error'));
    };
  }

  function get(url, cb) {
    var request = new XMLHttpRequest();
    _ajaxCb(request, function(err, responseText) {
      err ? cb(err) : cb(null, responseText);
    });
    request.open('GET', `${SERVER}${url}`, true);
    request.send();
  }

  function post(url, json, cb) {
    var request = new XMLHttpRequest();
    _ajaxCb(request, cb);
    request.open('POST', `${SERVER}${url}`, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.send(JSON.stringify(json));
  }

  window.ajax = {
    get: get,
    post: post,
  };
})();
