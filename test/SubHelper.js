/* jshint unused: false */
"use strict";

function getSubInstance(id) {
	id = id || "sub";
	if (!document.getElementById(id)) {
      var div = document.createElement("div");
		div.id = id;
		document.body.appendChild(div);
	}
	return new window.Sub([], {
		_testing: true
	});
}
