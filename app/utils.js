function message(t, doStuff) {
  var m = document.createElement('p');
  var removed = false;
  m.textContent = t;
  DOM.messages.appendChild(m);
  doStuff(function closeMessage() {
    if (removed) {
      console.error('Already removed node for child', m);
    } else {
      DOM.messages.removeChild(m);
      removed = true;
    }
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
