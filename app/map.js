(function initMap() {
  var geoSupport = 'geolocation' in navigator;
  ga('send', 'event', 'Geolocation', 'Support', geoSupport ? 'Supported' : 'Not supported');

  !mapboxgl.supported() && complain('Sorry, your browser can not draw this map');
  ga('send', 'event', 'WebGL', 'Support', mapboxgl.supported() ? 'Supported' : 'Not supported');

  var DAY = '/map-day.json';
  var NIGHT = '/map-night.json';
  var BASE_ID = 'base';

  window.map = new mapboxgl.Map({
    attributionControl: false,
    container: 'map',
    style: DAY,
    zoom: 2,
    center: [-94.4519211, 38.9926981],
  });

  window.mapC = {
    setDayNight: function(choice) {
      // TODO :(
      // map.setStyle({ day: DAY, night: NIGHT }[choice] || DAY);
    }
  };
})();
