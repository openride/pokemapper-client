(function() {
  // DOM refs
  var globalTab = document.getElementById('global-map-tab');
  var myTab = document.getElementById('my-map-tab');
  var mymapLogin = document.getElementById('mymap-login');
  var mymapLoginButton = document.getElementById('mymap-login-button');
  var entry = document.getElementById('entry');

  // State
  var currentUser = null;

  // helpers
  function getRoute() {
    var nohash = window.location.hash.slice(1);
    var parts = nohash.split('?');
    var path = parts[0] || '/';
    var querystring = parts[1];
    var query = {};
    querystring && querystring.split('&').forEach(function(bit) {
      var kv = bit.split('=');
      query[kv[0]] = kv[1];
    });
    return {
      path: path,
      query: query,
    };
  }

  function setTab() {
    var route = getRoute();
    var selected = document.querySelector('.tabs a.selected');
    selected && selected.classList.remove('selected');
    if (route.path === '/') {
      globalTab.classList.add('selected');
      mapC.loadGlobalMap();
      showWelcome();
    } else if (route.path === '/my-map') {
      myTab.classList.add('selected');
      // TODO: handle no querystring
      if (!route.query.id) {
        showLogin();
      } else {
        mapC.loadUserMap(route.query.id);
      }
    }
    ga('send', 'pageview', route.path);
  }

  function showLogin() {
    // superhack
    entry.style.bottom = '0';
    if (typeof entryLogin !== 'undefined') entryLogin.style.display = 'none';
    mymapLogin.style.display = 'block';
  }

  function setUuid(uuid) {
    myTab.href = '#/my-map?id=' + uuid;
  }

  function onLogin() {
    document.getElementById('entry').style.bottom = '-600px';
    window.location.hash = myTab.hash;
  }

  // init
  setTab();

  // listeners
  window.addEventListener('hashchange', setTab);
  mymapLoginButton.addEventListener('click', function() {
    startFbLogin(onLogin);
    ga('send', 'event', 'UI', 'Click My map login');
  });

  // exports
  window.tabs = {
    setUuid: setUuid,
  };
})();
