DOM = {
  messages: document.getElementById('messages'),
  daynightDay: document.getElementById('daynight-day'),
  daynightNight: document.getElementById('daynight-night'),
};


Object.keys(DOM)
  .forEach(function(k) {
    !DOM[k] && console.error('Missing DOM el for ' + k);
  });
