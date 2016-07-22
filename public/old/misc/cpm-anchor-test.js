// this gets injected via optimizely, not directly in our app, but
// still wanted it in source

var DELAY = 20000;

setTimeout(function() {
  var script = document.createElement('script');
  script.src = 'app/cpm-anchor-ad.js';
  document.body.appendChild(script);
}, DELAY);
