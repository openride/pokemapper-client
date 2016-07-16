var welcome = document.getElementById('welcome');

var helloMessage = document.getElementById('hello-message');
var helloThrobber = document.getElementById('email-plz');
var openRideHelloLink = document.getElementById('open-ride-link-hello');
var helloForm = document.getElementById('mc-embedded-subscribe-form');
var helloCancel = document.getElementById('hello-cancel');

var logo = document.querySelector('h1 > .img-wrap');
var searchButton = document.getElementById('search');
var searchMag = document.querySelector('#search .mag');
var searchX = document.querySelector('#search .x');

var geoButton = document.querySelector('.center-me');

var userButton = document.querySelector('.fb-user-position');
var loggedOutUserButton = document.querySelector('button.login');
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
  placeholderText: 'Enter Pokémon name',
  noResultsMessage: 'No Pokémon found',
};
var entrySelectBarq = new Barq(entrySelect, barqOpts).init();
var searchSelectBarq = new Barq(searchSelect, Object.assign({}, barqOpts, {
  onchange: function barqHandler() {
    mapC.filterPoke(this.value);
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

// awful global state stuff
var isLoggedIn = false;
var fbName = null;
var fbId = null;

var welcomeIsOpen = true;
var searchIsShowing = false;

var helloIsOpen = false;

var isLogging = false;
var isSaving = false;
var loggingPin = null;
var prevZoom = 16;
var selectedLngLat = null;

var hasPositioned = false;
var positioningFailed = false;
var myPosition = null;
var myLocation = null;
var sightingsData = null;
var typeFilter = null;
var filteredData = new mapboxgl.GeoJSONSource({ data:
  { type: 'FeatureCollection', features: [] } });

var mapHasLoaded = false;
var popupOpen = false;

var creditsShowing = false;


// spaghetti
function login(me) {
  isLoggedIn = true;
  fbId = me.id;
  fbName = me.first_name;
  loggedOutUserButton.style.display = 'none';
  user.style.display = 'block';
  userImg.src = 'https://graph.facebook.com/v2.5/' + fbId + '/picture?height=60&width=60';
  entryLogin.style.display = 'none';
  entryForm.classList.remove('visuallyhidden');
  ga('send', 'event', 'Account', 'Log in', me.id);
}


function log(lngLat) {
  isLogging = true;
  selectedLngLat = lngLat;
  prevZoom = map.getZoom();
  map.flyTo({ center: lngLat, zoom: prevZoom + 1, pitch: 60 });
  mapC.addTemporaryPoint(lngLat);
  entry.style.bottom = '0';
  picker.setDate(new Date());
  ga('send', 'event', 'Sightings', 'Begin entry');
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
    ajax.post('/sightings', {
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
        mapC.addSessionSighting(JSON.parse(result));
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
  map.flyTo({ zoom: prevZoom, pitch: 0 });
  mapC.clearTemporaryPoint();
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


function pokeById(id) {
  return allPokemon
    .filter(function(poke) {
      return poke.id === id;
    })
    .map(function(poke) {
      return poke.name;
    })[0];
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
  ga('send', 'event', 'UI', 'Open Search');
  searchIsShowing = true;
  logo.style.display = 'none';
  searchMag.style.display = 'none';
  searchWrap.style.display = 'block';
  searchX.style.display = 'block';
  searchSelectBarq.focus();
}

function search(id) {
  typeFilter = id;
  ga('send', 'event', 'Sightings', 'Search', id ? pokeById(parseInt(id)) : null);
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

function hello() {
  helloIsOpen = true;
  helloMessage.style.bottom = '0';
  helloThrobber.style.display = 'none';
}

function closeHello() {
  helloIsOpen = false;
  helloMessage.style.bottom = '-500px';
}

userButton.addEventListener('click', function() {
  helloIsOpen ? closeHello() : hello();
  ga('send', 'event', 'UI', 'Click user button');
});


entryLoginButton.addEventListener('click', function() {
  startFbLogin();
  ga('send', 'event', 'Accounts', 'Click log in', 'Entry popup');
});


geoButton.addEventListener('click', mapC.positionMe);


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

function _updateDayNight() {
  var val = document.querySelector('input[name="daynight"]:checked').value;
  mapC.setDayNight(val);
}
DOM.daynightDay.addEventListener('change', _updateDayNight);
DOM.daynightNight.addEventListener('change', _updateDayNight);

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
  ga('send', 'event', 'Outbound', 'Click', 'Who made this?');
});
openRideHelloLink.addEventListener('click', function(e) {
  ga('send', 'event', 'Outbound', 'Click', 'Mailing list signup');
});

credits.addEventListener('click', function() {
  hideCredits();
});

welcome.addEventListener('click', function() {
  closeWelcome();
});

helloForm.addEventListener('submit', function() {
  closeHello();
  ga('send', 'event', 'Email', 'Subscribe');
});

helloCancel.addEventListener('click', function() {
  closeHello();
});

window.addEventListener('keydown', function(e) {
  if (e.keyCode === 27) {  // esc
    isLogging && cancelLog();
    creditsShowing && hideCredits();
  }
});
