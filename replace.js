(function() {
	"use strict";
	var root = this;

	var Replace = function() {};

	Replace.init = function(rawSentences, opts) {
		if (! opts) {
			opts = {};
		}
		var print = false,
			classname = opts["classname"] || "replace",
			interval = opts["interval"] || 5000,
			speed = opts["speed"] || 200,
			commonWords = opts["commonWords"] || 1,
			animation = (opts["animation"] !== undefined)? opts["animation"] : true,
			random = (opts["random"] !== undefined)? opts["random"] : true,
			wrapper = document.getElementsByClassName(classname)[0];

		initStyle(speed/1000.0);

		wrapper.innerHTML = '<div class="' + classname + '-word">' +
			'  <span class="' + classname + '-visible">I</span>' +
			'  <span class="' + classname + '-invisible">I</span>' +
			'</div><div class="' + classname + '-word verb">' +
			'  <span class="' + classname + '-visible"></span>' +
			'  <span class="' + classname + '-invisible"></span>' +
			'</div><div class="' + classname + '-word obj">' +
			'  <span class="' + classname + '-visible"></span>' +
			'  <span class="' + classname + '-invisible"></span>' +
			'</div><div class="' + classname + '-word prep">' +
			'  <span class="' + classname + '-visible"></span>' +
			'  <span class="' + classname + '-invisible"></span>' +
			'</div><div class="' + classname + '-word noun">' +
			'  <span class="' + classname + '-visible"></span>' +
			'  <span class="' + classname + '-invisible"></span>' +
			'</div><div class="' + classname + '-word ' + classname + '-punctuation">' +
			'  <span class="' + classname + '-visible">.</span>' +
			'  <span class="' + classname + '-invisible">.</span>' +
			'</div>';

		var usedSentences = rawSentences,
			sentences = [],
			highestTimeoutId = 0,
			transitionEnd = whichTransitionEvent();
		resetSentences();
		var currentSentence = sentences[0];
		setLiveSentence(currentSentence);
		setTimeout(sentenceLoop, interval);

		function sentencesAreSimilar(a, b) {
			var wordsInCommon = 0;
			for (var key in a) {
				if (key != "_id") {
					if (! b.hasOwnProperty(key) || b[key] == a[key])
						wordsInCommon += 1;
				}
			}
			return wordsInCommon >= commonWords;
		}

		function resetSentences() {
			sentences = sentences.concat(usedSentences.concat());
			usedSentences = [];
			if (random) {
				sentences.sort(function(){ return 0.5 - Math.random(); });
			}
		}

		function sentenceLoop() {
			if (sentences.length < 1) {
				resetSentences();
			}
			var newSentence;
			for (var i = 0; i < sentences.length; i++) {
				if (sentencesAreSimilar(currentSentence, sentences[i])) {
					newSentence = sentences[i];
					usedSentences = usedSentences.concat(sentences.splice(i, 1));
					break;
				} else if (i+1 == sentences.length) {
					resetSentences();
					i=-1;
				}
			}
			setLiveSentence(newSentence);
			currentSentence = newSentence;
			clearTimeout(highestTimeoutId);
			highestTimeoutId = setTimeout(sentenceLoop, interval);
		}

		function setLiveSentence(newSentence) {
			for (var key in newSentence) {
				setKey(key, newSentence);
			}
		}

		function setKey(key, newSentence) {
			var	visible = document.querySelector('.' + classname + ' .' + key +' .' + classname + '-visible'),
				invisible = document.querySelector('.' + classname + ' .' + key +' .' + classname + '-invisible'),
				newText = newSentence[key];
				function stepOne() {
					/* Hold the container width, and fade out */
					console.log(1);
					visible.className += ' ' + classname + '-animating';

					visible.addEventListener(transitionEnd, stepTwo, false);

					invisible.style.width = invisible.offsetWidth+"px";
					visible.style.opacity = 0;
				}
				function stepTwo() {
					/* Animate the width */
					console.log(2);
					visible.className = visible.className.replace(' ' + classname + '-animating', '');
					invisible.className += ' ' + classname + '-animating';

					visible.removeEventListener(transitionEnd, stepTwo, false);
					invisible.addEventListener(transitionEnd, stepThree, false);

					var newWidth = calculateWordWidth(newText, wrapper.tagName, wrapper.className.split(' '));
					invisible.style.width = newWidth+"px";
				}
				function stepThree() {
					/* Replace the text then fade in */
					console.log(3);
					invisible.className = invisible.className.replace(' ' + classname + '-animating', '');
					visible.className += ' ' + classname + '-animating';

					invisible.removeEventListener(transitionEnd, stepThree, false);
					visible.addEventListener(transitionEnd, stepFour, false);

					visible.innerHTML = newText;
					invisible.innerHTML = newText;
					visible.style.opacity = 1;
				}
				function stepFour() {
					/* Reset */
					console.log(4);
					invisible.className = invisible.className.replace(' ' + classname + '-animating', '');
					visible.className = visible.className.replace(' ' + classname + '-animating', '');

					visible.removeEventListener(transitionEnd, stepFour, false);

					invisible.style.width = "auto";
				}

			if (newText != visible.innerHTML) {
				if (animation) {
					stepOne();
				} else  {
					visible.innerHTML = newText;
					invisible.innerHTML = newText;
				}
			}
		}

		function whichTransitionEvent(){
			var t,
				el = document.createElement('fakeelement'),
				transitions = {
				'transition':'transitionend',
				'OTransition':'otransitionend',
				'MozTransition':'transitionend',
				'WebkitTransition':'webkitTransitionEnd'
			};

			for(t in transitions){
				if( el.style[t] !== undefined ){
					return transitions[t];
				}
			}
		}

		function calculateWordWidth(text, tag, classes) {
			classes = classes || [];
			classes.push(classname+'-text-width-calculation');
			var elem = document.createElement(tag);
			elem.setAttribute('class', classes.join(' '));
			elem.innerHTML = text;
			document.body.appendChild(elem);
			var width = elem.offsetWidth;
			elem.parentNode.removeChild(elem);
			return width;
		}

		function initStyle(transitionSpeed) {
			var height = wrapper.offsetHeight,
				css =
				'.' + classname + '-invisible { visibility: hidden; }\n' +
				'.' + classname + '-animating {\n' +
				'  -webkit-transition: ' + transitionSpeed + 's all linear;\n' +
				'  -moz-transition: ' + transitionSpeed + 's all linear;\n' +
				'  -o-transition: ' + transitionSpeed + 's all linear;\n' +
				'  transition: ' + transitionSpeed + 's all linear; }\n' +
				'.' + classname + '-text-width-calculation {\n' +
				'  position: absolute;\n' +
				'  visibility: hidden;\n' +
				'  height: auto;\n' +
				'  width: auto;\n' +
				'  display: inline-block;\n' +
				'  white-space: nowrap; }' +
				'.' + classname + ' {\n' +
				'  margin: 0;}\n' +
				'  .' + classname + ' .' + classname + '-punctuation { margin-left: -0.3rem; }\n' +
				'  .' + classname + ' .' + classname + '-word {\n' +
				'    display: inline;\n' +
				'    position: relative;\n' +
				'    text-align: center;\n' +
				'    height: ' + height + 'px;\n' +
				'    white-space: nowrap;\n' +
				'    overflow: hidden;}\n' +
				'    .' + classname + ' .' + classname + '-word span {\n' +
				'      top: 0;\n' +
				'      position: relative;\n' +
				'      overflow: hidden;\n' +
				'      height: 1px;\n' +
				// '      white-space: nowrap;\n' +
				'      display: inline-block;}\n' +
				'      .' + classname + ' .' + classname + '-word .' + classname + '-visible {\n' +
				'        position: absolute;\n' +
				'        display: inline;\n' +
				'        height: ' + height + 'px;\n' +
				'        top: 0;\n' +
				'        bottom: 0;\n' +
				'        right:0;\n' +
				'        left: 0;}',
			head = document.head || document.getElementsByTagName('head')[0],
			style = document.createElement('style');

			style.type = 'text/css';
			if (style.styleSheet){
				style.styleSheet.cssText = css;
			} else {
				style.appendChild(document.createTextNode(css));
			}

			head.appendChild(style);
		}
	};

	root.Replace = Replace;

}).call(this);