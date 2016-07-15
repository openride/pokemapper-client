function message(t, doStuff) {
  var m = document.createElement('p');
  m.textContent = t;
  DOM.messages.appendChild(m);
  doStuff(function closeMessage() {
    DOM.messages.removeChild(m);
  });
}


function complain(msg) {
  message(msg, function(closeMessage) {
    setTimeout(closeMessage, 5000);
  });
}


function woo(msg) {
  message(msg, function(closeMessage) {
    setTimeout(closeMessage, 2400);
  });
}
