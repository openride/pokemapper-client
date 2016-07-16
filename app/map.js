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
  var SIGHTINGS_LIMIT = 10000;

  // https://developer.mozilla.org/en-US/docs/Web/API/PositionError
  var geoErrMsg = {
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Timeout',
  };

  // State

  var loaded = false;
  var sightings = null;
  var newSighting = { type: 'FeatureCollection', features: [] };
  var medot = { type: 'FeatureCollection', features: [] };
  var popup = null;
  var geo = 'waiting';

  // Init

  window.map = new mapboxgl.Map({
    attributionControl: false,
    container: 'map',
    style: DAY,
    zoom: 2,
    center: [-94.4519211, 38.9926981],
  });

  message('Loading Pokémon sightings...', function(closeMessage) {
    ajax.get('/sightings?limit=' + SIGHTINGS_LIMIT, function(err, response) {
      closeMessage();
      if (err) {
        complain('Could not load Pokémon sightings, sorry!');
        ga('send', 'event', 'Error', 'Failed to load sightings', String(err));
      } else {
        sightings = JSON.parse(response);
        loaded ? addDataLayer() : map.once('load', addDataLayer);
        ga('send', 'event', 'Sightings', 'Load', 'Most recent', SIGHTINGS_LIMIT);
      }
    });
  });

  // Helpers

  function addDataLayer() {
    if (map.getSource('sightings')) return;
    map.addSource('sightings', {
      type: 'geojson',
      data: sightings,
    });
    map.addSource('newSighting', {
      type: 'geojson',
      data: newSighting,
    });
    map.addSource('medot', {
      type: 'geojson',
      data: medot,
    });
    map.addLayer(getSightingsLayer('sightings', 'sightings'));
    map.addLayer(getNewSightingLayer('newSighting', 'newSighting'));
    map.addLayer(getMedotLayer('medot', 'medot'));
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

  function setDayNight(choice) {
    const style = {
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
    var features = map.queryRenderedFeatures(e.point, { layers: ['sightings'] });
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
    map.getSource('newSighting').setData(newSighting);
  }

  function clearTemporaryPoint(lngLat) {
    newSighting.features = [];
    map.getSource('newSighting').setData(newSighting);
  }

  function addSessionSighting(feature) {
    sightings.features.push(feature);
    map.getSource('sightings').setData(sightings);
  }

  var updatePosition = function(position) {
    medot = positionThing(position);
    var source = map.getSource('medot');
    source && source.setData(medot);
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
        if (!positioned) {
          positionMe();
          positioned = true;
        }
      }, function watchGeoErr(err) {
        positioned || closeMessage();
        positioned = true;
        geo = 'errored';
        complain('Could not access GPS location :(');
        ga('send', 'event', 'Geolocation', 'GetCurrentPosition Error', geoErrMsg[err.code]);
      }, { enableHighAccuracy: true });
    });
  });

  map.on('style.load', function() {
    if (sightings) addDataLayer();
  });

  map.on('click', function(e) {
    if (isLogging) return cancelLog();
    if (popup) return closePopup();
    var pokeHere = getPok(e);
    if (pokeHere) return showPok(pokeHere);
    if (map.getZoom() < 11) return complain('Zoom in to add your Pokémon sighting ');
    startLog(e.lngLat);
  });

  // Export

  window.mapC = {
    filterPoke: mapReadyQueue(filterPoke),
    setDayNight: mapReadyQueue(setDayNight),
    addTemporaryPoint: addTemporaryPoint,
    clearTemporaryPoint: clearTemporaryPoint,
    addSessionSighting: mapReadyQueue(addSessionSighting),
    positionMe: positionMe,
  };
})();
