function support(thing, capability, category, isSupported) {
  ga('send', 'event', category, 'Support', isSupported ? 'Supported' : 'Not supported');
  isSupported || complain('Sorry, your browser is missing ' + thing + ' support, and may not be able to ' + capability + '.');
  return isSupported;
}
