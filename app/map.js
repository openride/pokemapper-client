(function initMap() {
  var geoSupport = support('geolocation', 'find your location on the map', 'Geolocation',
    'geolocation' in navigator);
  var glSupport = support('WebGL', 'draw this map', 'WebGL',
    mapboxgl.supported());

  // Constants

  var DAY = '/map-day.json';
  var NIGHT = '/map-night.json';
  var BASE_ID = 'base';
  var SIGHTINGS_ID = 'sightings';
  var SIGHTINGS_LIMIT = 40000;
  var DOUBLE_CLICK_THRESHOLD = 300; // ms

  // https://developer.mozilla.org/en-US/docs/Web/API/PositionError
  var geoErrMsg = {
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Timeout',
  };

  // State

  var loaded = false;
  var selectedLayer = null;
  var sightings = { type: 'FeatureCollection', features: [] };
  var userSightings = { type: 'FeatureCollection', features: [] };
  var newSighting = { type: 'FeatureCollection', features: [] };
  var medot = { type: 'FeatureCollection', features: [] };
  var popup = null;
  var geo = 'waiting';
  var lastClickTime = null;
  var recentDoubleClick = false; // i hate myself

  // Init

  window.map = new mapboxgl.Map({
    attributionControl: false,
    container: 'map',
    style: DAY,
    zoom: 2,
    center: [-94.4519211, 38.9926981],
  });

  // Helpers

  function _addLayer(id, geojson, layerSpec, visible) {
    if (!geojson) return;
    map.getSource(id)
      ? map.getSource(id).setData(geojson)
      : map.addSource(id, { type: 'geojson', data: geojson });
    map.getLayer(id)
      ? null
      : map.addLayer(layerSpec);
    map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  }

  var addDataLayer = window.adl = function addDataLayer() {
    _addLayer('sightings', sightings,
      getSightingsLayer('sightings', 'sightings'),
      selectedLayer === 'sightings');

    _addLayer('userSightings', userSightings,
      getSightingsLayer('userSightings', 'userSightings'),
      selectedLayer === 'userSightings');

    _addLayer('newSighting', newSighting,
      getNewSightingLayer('newSighting', 'newSighting'), true);

    _addLayer('medot', medot,
      getMedotLayer('medot', 'medot'), true);
  }

  function mapReadyQueue(fn) {
    return function(/*args*/) {
      loaded
        ? fn.apply(null, arguments)
        : map.on('load', function() {
          fn.apply(null, arguments);
        });
    };
  }

  function filterPoke(pokeId) {
    if (pokeId) {
      map.setFilter('sightings', ['==', 'speciesId', parseInt(pokeId)]);
    } else {
      map.setFilter('sightings', ['all']);
    }
  }

  function checkDoubleClick() {
    var currentTime = new Date();
    if (!lastClickTime) {
      lastClickTime = currentTime;
      recentDoubleClick = false;
    } else if (currentTime.getTime() - lastClickTime.getTime() <= DOUBLE_CLICK_THRESHOLD) {
      lastClickTime = currentTime;
      recentDoubleClick = true;
    } else {
      lastClickTime = currentTime;
      recentDoubleClick = false;
    }
  }

  function setDayNight(choice) {
    var style = {
      day: DAY,
      night: NIGHT,
    }[choice];
    if (!choice) {
      ga('send', 'event', 'Error', 'Bad setDayNight choice', choice);
      return;
    }
    map.setStyle(style);
    message('Loading map...', function(closeMessage) {
      map.once('style.load', closeMessage);
    });
    ga('send', 'event', 'Sightings form', 'Day/night toggle', style);
  }

  function getPok(e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['sightings', 'userSightings'] });
    return features[0];
  }

  function showPok(pok) {
    var props = pok.properties;
    var name = pokeById(props.speciesId);
    ga('send', 'event', 'Sightings', 'View', name);
    popup = new mapboxgl.Popup({ closeButton: false })
      .setLngLat(pok.geometry.coordinates)
      .setHTML(
        '<h1><img class="pokeicon" alt="icon" src="/icons/' + props.speciesId + '.png" /> ' + name + '</h1>' +
        '<p><b>type:</b> ' + props.type + '</p>' +
        '<p><b>spotted:</b> ' + new Date(props.date).toLocaleDateString() + ' &ndash; ' + props.timing + '</p>'
      )
      .addTo(map);
  }

  function closePopup() {
    popup.remove();
    popup = null;
  }

  function startLog(lngLat) {
    log(lngLat);
  }

  function addTemporaryPoint(lngLat) {
    newSighting.features = [{
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lngLat.lng, lngLat.lat],
      },
    }];
    addDataLayer();
  }

  function clearTemporaryPoint(lngLat) {
    newSighting.features = [];
    addDataLayer();
  }

  function addSessionSighting(feature) {
    sightings.features.push(feature);
    userSightings.features.push(feature);
    addDataLayer();
  }

  function updatePosition(position) {
    medot = positionThing(position);
    addDataLayer();
  }

  function loadGlobalMap() {
    selectedLayer = 'sightings';
    message('Loading Pokémon sightings...', function(closeMessage) {
      var t0 = new Date();
      ajax.get('/sightings?limit=' + SIGHTINGS_LIMIT, function(err, response) {
        closeMessage();
        if (err) {
          complain('Could not load Pokémon sightings, sorry!');
          ga('send', 'event', 'Error', 'Failed to load sightings', String(err));
        } else {
          sightings = JSON.parse(response);
          loaded ? addDataLayer() : map.once('load', addDataLayer);
          message('Showing most recent 40,000 sightings...', function(closeMessage) {
            setTimeout(closeMessage, 7000);
          });
          ga('send', 'event', 'Sightings', 'Load', 'Most recent', new Date() - t0);
        }
      });
    });
  }

  function loadUserMap(uuid) {
    selectedLayer = 'userSightings';
    message('Loading my Pokémon sightings...', function(closeMessage) {
      var t0 = new Date();
      ajax.get('/sightings?author_id=' + uuid, function(err, response) {
        closeMessage();
        var temp = JSON.parse(response);
        if (err) {
          complain('Could not load Pokémon sightings, sorry!');
          ga('send', 'event', 'Error', 'Failed to load user sightings', String(err));
        } else if (temp.features.length === 0) {
          woo('No sightings yet!');
        } else {
          userSightings = JSON.parse(response);
          var west = Infinity;
          var east = -Infinity;
          var north = -Infinity;
          var south = Infinity;
          userSightings.features.forEach(function(feature) {
            var lngLat = feature.geometry.coordinates;
            // WARNING: clusters spanning the -180 - 180 longitude will contain the whole world
            west = Math.min(lngLat[0], west);
            east = Math.max(lngLat[0], east);
            north = Math.max(lngLat[1], north);
            south = Math.min(lngLat[1], south);
          });
          function _draw() {
            addDataLayer();
            if (east > west &&
                north > south) {
              map.fitBounds([[west, south], [east, north]], {
                padding: 30,
                maxZoom: 11,
              });
            }
          }
          loaded ? _draw() : map.once('load', _draw);
          ga('send', 'event', 'Sightings', 'Load', 'User sightings', new Date() - t0);
        }
      });
    });
  }

  var positionMe = mapReadyQueue(function() {
    if (geo === 'ready') {
      loaded && map.flyTo({
        center: medot.features[0].geometry.coordinates,
        zoom: Math.max(map.getZoom(), 14),
        bearing: 0
      });
    } else if (geo === 'waiting') {
      complain('Still waiting for GPS...');
    } else if (geo === 'errored') {
      complain('Could not access GPS :(');
    }
  });


  map.on('load', function() {
    loaded = true;
    if (!geoSupport) return;

    var positioned = false;
    message('Waiting for GPS...', function(closeMessage) {
      navigator.geolocation.watchPosition(function(position) {
        positioned || closeMessage();
        geo = 'ready';
        loaded && updatePosition(position);
        positioned = true;
      }, function watchGeoErr(err) {
        positioned || closeMessage();
        positioned = true;
        geo = 'errored';
        complain('Could not access GPS location :(');
        ga('send', 'event', 'Geolocation', 'GetCurrentPosition Error', geoErrMsg[err.code]);
      }, { enableHighAccuracy: true });
    });
  });

  map.on('style.load', addDataLayer);

  map.on('click', function(e) {
    checkDoubleClick();
    setTimeout(function() {
      if (!recentDoubleClick) {
        if (isLogging) return cancelLog();
        if (popup) {
          closePopup();
          var pokeHere = getPok(e);
          if (pokeHere) return showPok(pokeHere);
          return;
        }
        var pokeHere = getPok(e);
        if (pokeHere) return showPok(pokeHere);
        if (map.getZoom() < 11) return complain('Zoom in to add your Pokémon sighting');
        startLog(e.lngLat);
      }
    }, DOUBLE_CLICK_THRESHOLD);
  });

  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.Navigation({ position: 'bottom-left' }));

  // Export

  window.mapC = {
    filterPoke: mapReadyQueue(filterPoke),
    setDayNight: mapReadyQueue(setDayNight),
    addTemporaryPoint: addTemporaryPoint,
    clearTemporaryPoint: clearTemporaryPoint,
    addSessionSighting: mapReadyQueue(addSessionSighting),
    positionMe: positionMe,
    loadUserMap: loadUserMap,
    loadGlobalMap: loadGlobalMap,
  };
})();
