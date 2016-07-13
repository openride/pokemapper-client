const SERVER = isProd
  ? 'https://canary.pokemapper.c66.me'
  : 'http://localhost:3000';


// feature checks
if (!('geolocation' in navigator)) {
  alert('Your browser may not support this app, sorry :(');
}

// ajax utils
function _ajaxCb(request, cb) {
  // request.withCredentials = 'true';  // string?!
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
    err ? cb(err) : cb(null, JSON.parse(responseText));
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



// map & controls setup
mapboxgl.accessToken = 'pk.eyJ1IjoicGhpbG9yIiwiYSI6ImNpcWowcXNhNzA4OWlmb25wNWtleDZteW0ifQ.APZZax09ngrMpErBAcQW5w';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/basic-v9',
    zoom: 2,
    center: [-94.4519211, 38.9926981],
});

var messages = document.getElementById('messages');

var loginButton = document.querySelector('button.login');
var user = document.querySelector('.user');
var userImg = document.querySelector('.user img');

var entryLogin = document.getElementById('entry-login');
var entryLoginButton = document.getElementById('entry-login-button');

var entry = document.getElementById('entry');
var entryForm = document.getElementById('entry-form');
var entryError = document.getElementById('entry-error');
var entrySelect = document.getElementById('species');
var entrySelectBarq = new Barq(entrySelect, {
  enablePagination: false,
  removeFirstOptionFromSearch: true,
  useFirstOptionTextAsPlaceholder: false,
  placeholderText: 'Enter Species',
  noResultsMessage: 'No Pokemon found',
}).init();
var entryDatepiker = document.getElementById('datepicker');
var picker = new Pikaday({
  field: entryDatepiker,
  minDate: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
  maxDate: new Date(),
});
var entrySave = document.getElementById('save');
var entryCancel = document.getElementById('entry-cancel');


function noop() {}

var positionOpts = { enableHighAccuracy: true };

message('Waiting for GPS...', function(closeMessage) {
  navigator.geolocation.getCurrentPosition(function(position) {
    closeMessage();
    map.on('load', function() {
      myLocation = new mapboxgl.GeoJSONSource({
        data: {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [
              position.coords.longitude,
              position.coords.latitude,
            ]
          }
        }
      });
      map.addSource('myLocation', myLocation);
      map.addLayer({
        id: 'myLocation',
        source: 'myLocation',
        type: 'circle',
        paint: {
          'circle-color': '#f90',
          'circle-radius': 12,
          'circle-opacity': 0.5,
        },
      });
      map.flyTo({
        center: {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        },
        pitch: 30,
        zoom: 16,
      });
    }, noop, positionOpts);
  });
});
map.on('load', function() {
  navigator.geolocation.watchPosition(function(position) {
    myLocation.setData({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          position.coords.longitude,
          position.coords.latitude,
        ]
      }
    });
  }, noop, positionOpts);
});


message('Loading sighted pokemon...', function(closeMessage) {
  get('/sightings', function(err, result) {
    closeMessage();
    if (err) {
      complain('Failed to load sightings :(');
      console.error(err);
      return;
    }
    map.on('load', function() {
      sightingsData = result;
      sightings = new mapboxgl.GeoJSONSource({ data: sightingsData });
      map.addSource('sightings', sightings);
      map.addLayer({
        id: 'sightings',
        source: 'sightings',
        type: 'circle',
        paint: {
          'circle-color': {
            property: 'type',
            type: 'categorical',
            stops: [
              ['normal', '#A8A878'],
              ['fighting', '#C03028'],
              ['flying', '#A890F0'],
              ['poison', '#A040A0'],
              ['ground', '#E0C068'],
              ['gock', '#B8A038'],
              ['bug', '#A8B820'],
              ['ghost', '#705898'],
              ['steel', '#B8B8D0'],
              ['fire', '#F08030'],
              ['water', '#6890F0'],
              ['grass', '#78C850'],
              ['electric', '#F8D030'],
              ['psychic', '#F85888'],
              ['ice', '#98D8D8'],
              ['dragon', '#7038F8'],
              ['dark', '#705848'],
              ['fairy', '#EE99AC'],
            ]
          },
          'circle-radius': 16,
          'circle-opacity': 0.667,
        },
      });
    });
  });
});


// awful global state stuff
var isLoggedIn = false;
var fbName = null;
var fbId = null;

var isLogging = false;
var isSaving = false;
var loggingPin = null;
var prevZoom = 16;
var selectedLngLat = null;

var myLocation = null;
var sightingsData = null;
var sightings = null;


function message(t, doStuff) {
  const m = document.createElement('p');
  m.textContent = t;
  messages.appendChild(m);
  doStuff(function closeMessage() {
    messages.removeChild(m);
  });
}


function complain(msg) {
  message(msg, function(closeMessage) {
    setTimeout(closeMessage, 3000);
  });
}


function woo(msg) {
  message(msg, function(closeMessage) {
    setTimeout(closeMessage, 1500);
  });
}


// spaghetti
function login(me) {
  ga('send', 'event', 'Account', 'Log in', me.id);
  isLoggedIn = true;
  fbId = me.id;
  fbName = me.first_name;
  loginButton.style.display = 'none';
  user.style.display = 'block';
  userImg.src = 'https://graph.facebook.com/v2.5/' + fbId + '/picture?height=60&width=60';
  entryLogin.style.display = 'none';
  entryForm.classList.remove('visuallyhidden');
}


function log(lngLat) {
  ga('send', 'event', 'Sightings', 'Begin entry');
  isLogging = true;
  selectedLngLat = lngLat;
  prevZoom = map.getZoom();
  map.addSource('blah', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lngLat.lng, lngLat.lat],
      },
    },
  });
  map.addLayer({
    id: 'blah',
    source: 'blah',
    type: 'circle',
    paint: {
      'circle-color': '#009b91',
      'circle-radius': 32,
      'circle-opacity': 0.5,
    },
  })
  map.flyTo({ center: lngLat, zoom: 18, pitch: 60 });
  entry.style.bottom = '0';
  picker.setDate(new Date());
}


function noGood() {
  entryError.style.display = 'block';
}


function save() {
  if (isSaving) return;
  entryError.style.display = 'none';
  var species = entrySelectBarq.value;
  if (!species) {
    return noGood();
  }
  var date = picker.getDate();
  var daynight = document.querySelector('input[name="daynight"]:checked').value;
  isSaving = true;
  message('Saving...', function(closeMessage) {
    post('/sightings', {
      fbId: fbId,
      speciesId: entrySelectBarq.value,
      date: picker.getDate(),
      timing: daynight,
      coordinates: [selectedLngLat.lng, selectedLngLat.lat],
    }, function(err, result) {
      isSaving = false;
      closeMessage();
      if (err) {
        complain('Could not save :(');
        console.error(err);
      } else {
        woo('Saved.');
        cancelLog();
        sightingsData.features.push(JSON.parse(result));
        sightings.setData(sightingsData);
      }
    });
  });
  entrySave.classList.remove('button-grad');
  ga('send', 'event', 'Sightings', 'Add', species);
}


function cancelLog() {
  isLogging = false;
  entry.style.bottom = '-300px';
  entryError.style.display = 'none';
  entrySelectBarq.clear();
  entrySave.classList.add('button-grad');
  map.flyTo({ zoom: prevZoom, pitch: 30 });
  map.removeLayer('blah');
  map.removeSource('blah');
}


// wiriting it all up
function startFbLogin() {
  message('Logging in...', function(closeMessage) {
    FB.login(function(res) {
      if (res.status === 'connected') {
        FB.api('/me', { fields: 'first_name' }, function(response) {
          closeMessage();
          woo('Hi, ' + response.first_name + '!');
          login(response);
        });
      }
    });
  });
}
loginButton.addEventListener('click', function() {
  ga('send', 'event', 'Accounts', 'Click log in', 'FAB');
  startFbLogin();
});
entryLoginButton.addEventListener('click', function() {
  ga('send', 'event', 'Accounts', 'Click log in', 'Entry popup');
  startFbLogin();
});


map.on('click', function(e) {
  if (isLogging) {
    cancelLog();
  } else {
    log(e.lngLat);
  }
});

entryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  save();
});

entryCancel.addEventListener('click', function(e) {
  e.preventDefault();
  cancelLog();
});

window.addEventListener('keydown', function(e) {
  e.keyCode === 27 && cancelLog();
})
