// feature checks
if (!('geolocation' in navigator)) {
  alert('Your browser may not support this app, sorry :(');
}

// ajax utils
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
    err ? cb(err) : cb(null, JSON.parse(responseText));
  });
  request.open('GET', url, true);
  request.send();
}
function post(url, json) {
  var request = new XMLHttpRequest();
  _ajaxCb(request, cb);
  request.open('POST', url, true);
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

var loginButton = document.querySelector('button.login');
var user = document.querySelector('.user');
var userImg = document.querySelector('.user img');

var entry = document.getElementById('entry');
var entryForm = document.getElementById('entry-form');
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
var entryCancel = document.getElementById('entry-cancel');


// always put the map where we are (annoying?)
function setPosition(position, zoom) {
  if (!isLogging) {
    map.flyTo({
      center: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      pitch: 30,
      zoom: 16,
    });
  }
}
function noop() {}
var positionOpts = { enableHighAccuracy: true };
navigator.geolocation.getCurrentPosition(function(position) {
  setPosition(position, 16);
}, noop, positionOpts);
navigator.geolocation.watchPosition(setPosition, noop, positionOpts);


get('/mocked-sightings.json', function(err, result) {
  if (err) throw err;
  console.log('res', result);
  map.on('load', function() {
    map.addSource('sightings', {
      type: 'geojson',
      data: result,
    });
    map.addLayer({
      id: 'sightings',
      source: 'sightings',
      type: 'circle',
      paint: {
        'circle-color': '#009b91',
        'circle-radius': 16,
        'circle-opacity': 0.5,
      },
    });
  });
});


// awful global state stuff
var isLoggedIn = false;
var fbName = null;
var fbId = null;

var isLogging = false;
var loggingPin = null;
var prevZoom = 16;
var selectedLngLat = null;


// spaghetti
function login(me) {
  ga('send', 'event', 'Account', 'Log in', me.id);
  isLoggedIn = true;
  fbId = me.id;
  fbName = me.first_name;
  loginButton.style.display = 'none';
  user.style.display = 'block';
  userImg.src = 'https://graph.facebook.com/v2.5/' + fbId + '/picture?height=60&width=60';
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


function save() {
  console.log({
    speciesId: entrySelectBarq.value,
    date: picker.getDate(),
    timing: 'day',
    coordinates: [selectedLngLat.lng, selectedLngLat.lat],
  });
  ga('send', 'event', 'Sightings', 'Add', speciesId);
}


function cancelLog() {
  isLogging = false;
  entry.style.bottom = '-300px';
  map.flyTo({ zoom: prevZoom, pitch: 30 });
  // map.zoomTo(prevZoom);
  map.removeLayer('blah');
  map.removeSource('blah');
}


// wiriting it all up
loginButton.addEventListener('click', function() {
  ga('send', 'event', 'Accounts', 'Click log in');
  FB.login(function(res) {
    if (res.status === 'connected') {
      FB.api('/me', { fields: 'first_name' }, function(response) {
        login(response);
      });
    }
  });
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
  cancelLog();
});

entryCancel.addEventListener('click', function(e) {
  e.preventDefault();
  cancelLog();
});

window.addEventListener('keydown', function(e) {
  e.keyCode === 27 && cancelLog();
})
