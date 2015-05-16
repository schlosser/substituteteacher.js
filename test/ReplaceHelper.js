/* jshint unused: false */
"use strict";

function getReplaceInstance(id) {
	id = id || "replace";
	if (!document.getElementById(id)) {
      var div = document.createElement("div");
		div.id = id;
		document.body.appendChild(div);
	}
	return new window.Replace([]);
}
