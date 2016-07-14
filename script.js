const SERVER = isProd
  ? 'https://data.pokemapper.co'
  : 'http://localhost:3000';


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
  attributionControl: false,
  container: 'map',
  style: 'mapbox://styles/mapbox/basic-v9',
  zoom: 2,
  center: [-94.4519211, 38.9926981],
});


var welcome = document.getElementById('welcome');

var logo = document.querySelector('h1 > .img-wrap');
var searchButton = document.getElementById('search');
var searchMag = document.querySelector('#search .mag');
var searchX = document.querySelector('#search .x');

var messages = document.getElementById('messages');

var geoButton = document.querySelector('.center-me');

var loginButton = document.querySelector('button.login');
var user = document.querySelector('.user');
var userImg = document.querySelector('.user img');

var entryLogin = document.getElementById('entry-login');
var entryLoginButton = document.getElementById('entry-login-button');

var entry = document.getElementById('entry');
var entryForm = document.getElementById('entry-form');
var entryError = document.getElementById('entry-error');
var entrySelect = document.getElementById('species');
var searchSelect = entrySelect.cloneNode(true);
var searchWrap = document.getElementById('search-input-wrap');
searchWrap.appendChild(searchSelect);
var barqOpts = {
  enablePagination: false,
  removeFirstOptionFromSearch: true,
  useFirstOptionTextAsPlaceholder: false,
  placeholderText: 'Enter Species',
  noResultsMessage: 'No Pokemon found',
};
var entrySelectBarq = new Barq(entrySelect, barqOpts).init();
var searchSelectBarq = new Barq(searchSelect, Object.assign({}, barqOpts, {
  onchange: function barqHandler() {
    search(this.value);
  },
})).init();
var entryDatepiker = document.getElementById('datepicker');
var picker = new Pikaday({
  field: entryDatepiker,
  minDate: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
  maxDate: new Date(),
});
var entrySave = document.getElementById('save');
var entryCancel = document.getElementById('entry-cancel');

var creditsLink = document.getElementById('credits-link');
var credits = document.getElementById('credits');
var openRideLink = document.getElementById('open-ride-link');

function noop() {}

var positionOpts = { enableHighAccuracy: true };


function positionThing(position) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            position.coords.longitude,
            position.coords.latitude,
          ],
        },
        properties: {
          role: 'outline'
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            position.coords.longitude,
            position.coords.latitude,
          ],
        },
        properties: {
          role: 'fill'
        }
      },
    ]
  };
}


function positionMe(position) {
  map.flyTo({
    center: {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
    },
    pitch: 20,
    zoom: 16,
    bearing: 0
  });
}


message('Waiting for GPS...', function(closeMessage) {
  navigator.geolocation.getCurrentPosition(function(position) {
    closeMessage();
    map.on('load', function() {
      hasPositioned = true;
      myPosition = position;
      myLocation = new mapboxgl.GeoJSONSource({
        data: positionThing(position)
      });
      map.addSource('myLocation', myLocation);
      map.addLayer({
        id: 'myLocation',
        source: 'myLocation',
        type: 'circle',
        paint: {
          'circle-color': {
            property: 'role',
            type: 'categorical',
            stops: [
              ['outline', '#fff'],
              ['fill', '#24f'],
            ],
          },
          'circle-radius': {
            property: 'role',
            type: 'categorical',
            stops: [
              ['outline', 12],
              ['fill', 9],
            ],
          },
          'circle-opacity': 1,
        },
      });
      positionMe(position);
    }, noop, positionOpts);
  });
});
map.on('load', function() {
  mapHasLoaded = true;
  navigator.geolocation.watchPosition(function(position) {
    myPosition = position;
    myLocation.setData(positionThing(position));
  }, noop, positionOpts);
});


message('Loading Pokémon...', function(closeMessage) {
  get('/sightings', function(err, result) {
    if (err) {
      closeMessage();
      complain('Failed to load sightings :(');
      console.error(err);
      return;
    }
    map.on('load', function() {
      sightingsData = result;
      updateData();
      map.addSource('sightings', filteredData);
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
      closeMessage();
    });
  });
});


// awful global state stuff
var isLoggedIn = false;
var fbName = null;
var fbId = null;

var welcomeIsOpen = true;
var searchIsShowing = false;

var isLogging = false;
var isSaving = false;
var loggingPin = null;
var prevZoom = 16;
var selectedLngLat = null;

var hasPositioned = false;
var myPosition = null;
var myLocation = null;
var sightingsData = null;
var typeFilter = null;
var filteredData = new mapboxgl.GeoJSONSource({ data:
  { type: 'FeatureCollection', features: [] } });

var mapHasLoaded = false;
var popupOpen = false;

var creditsShowing = false;


function updateData() {
  var filtered;
  var speciesId = parseInt(typeFilter);
  if (typeFilter) {
    filtered = Object.assign({}, sightingsData, {
      features: sightingsData.features.filter(function(feature) {
        return feature.properties.speciesId === speciesId;
      }),
    });
  } else {
    filtered = sightingsData;
  }
  filteredData.setData(filtered);
}


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
        updateData();
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


function sightingDetails(e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['sightings'] });
  var pokemon = features[0];
  if (pokemon) {
    popupOpen = true;
    var props = pokemon.properties;
    ga('send', 'event', 'Sightings', 'View', props._id);
    var name = allPokemon
      .filter(function(poke) {
        return poke.id === props.speciesId;
      })
      .map(function(poke) {
        return poke.name;
      });
    return new mapboxgl.Popup()
      .setLngLat(pokemon.geometry.coordinates)
      .setHTML(
        '<h1>' + name[0] + '</h1>' +
        '<p><b>type:</b> ' + props.type + '</p>' +
        '<p><b>spotted:</b> ' + new Date(props.date).toLocaleDateString() + ' &ndash; ' + props.timing + '</p>'
      )
      .addTo(map);
  }
}

function hideCredits() {
  // should set a global var?
  credits.style.display = 'none';
}

function closeWelcome() {
  welcome.style.bottom = '-300px';
  welcomeIsOpen = false;
}

function showSearch() {
  function doit() {
    ga('send', 'event', 'UI', 'Open Search');
    searchIsShowing = true;
    logo.style.display = 'none';
    searchMag.style.display = 'none';
    searchWrap.style.display = 'block';
    searchX.style.display = 'block';
    searchSelectBarq.focus();
  }
  mapHasLoaded ? doit() : map.on('load', doit);
}

function search(id) {
  ga('send', 'event', 'Sightings', 'Search', id);
  typeFilter = id;
  updateData();
}

function hideSearch() {
  searchSelectBarq.clear();
  search(null);
  searchIsShowing = false;
  searchWrap.style.display = 'none';
  searchX.style.display = 'none';
  logo.style.display = 'block';
  searchMag.style.display = 'block';
}

loginButton.addEventListener('click', function() {
  ga('send', 'event', 'Accounts', 'Click log in', 'FAB');
  startFbLogin();
});


entryLoginButton.addEventListener('click', function() {
  ga('send', 'event', 'Accounts', 'Click log in', 'Entry popup');
  startFbLogin();
});


geoButton.addEventListener('click', function() {
  hasPositioned && mapHasLoaded && positionMe(myPosition);
});


map.on('click', function(e) {
  creditsShowing && hideCredits();
  if (isLogging) {
    cancelLog();
    sightingDetails(e);
  } else {
    if (!sightingDetails(e)) {
      !popupOpen && log(e.lngLat);
      popupOpen = false;
    }
  }
});


map.on('mousemove', function(e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['sightings'] });
  map.getCanvas().style.cursor = features.length ? 'pointer' : '';
});


searchButton.addEventListener('click', function() {
  searchIsShowing ? hideSearch() : showSearch();
});


entryForm.addEventListener('submit', function(e) {
  e.preventDefault();
  save();
});

entryCancel.addEventListener('click', function(e) {
  e.preventDefault();
  cancelLog();
});

creditsLink.addEventListener('click', function(e) {
  e.preventDefault();
  creditsShowing = true;
  credits.style.display = 'block';
});

openRideLink.addEventListener('click', function(e) {
  e.preventDefault();
  ga('send', 'event', 'Outbound', 'Click', openRideLink.href, {
    transport: 'beacon',
    hitCallback: function() {
      document.location = openRideLink.href;
    }
  });
});

credits.addEventListener('click', function() {
  hideCredits();
});

welcome.addEventListener('click', function() {
  closeWelcome();
});

window.addEventListener('keydown', function(e) {
  if (e.keyCode === 27) {  // esc
    isLogging && cancelLog();
    creditsShowing && hideCredits();
  }
});
