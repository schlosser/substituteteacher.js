(function(window) {

  "use strict";

  var ActionsEnum = {
    REMOVE: 1,
    INSERT: 2,
    KEEP: 3
  };
  if (Object.freeze) {
    Object.freeze(ActionsEnum);
  }

  /**
   * Parse the raw sentence into an array of words.
   *
   * Separate the sentence by spaces, and then go along each word and pull
   * punctuation off words that end with a punctuation symbol:
   *
   *  "We're here (in Wilkes-Barre), finally!" =>
   *  ["We're", "here", "(", "in", "Wilkes-Barre", ")", ",", "finally", "!"]
   *
   * TODO: figure out some way to annotate puncatation so that it can be
   * rendered without a space in it.
   *
   * @param {string[]} rawSentences the sentences to parse
   * @returns {string[][]} sentences the sentences split up into tokens
   */
  function _parseSentence(rawSentence) {
    if (!rawSentence || typeof rawSentence !== "string") {
      throw "rawSentence must be a string.";
    }
    var components = [];
    var start, end, endChar;
    for (start = 0, end = 0; end < rawSentence.length; end++) {
      endChar = rawSentence.charAt(end);

      /**
       * Characters that should "detach" from strings are:
       *   ().,/![]*;:{}=?"+ or whitespace
       * Characters that remain that remain a part of the word include:
       *   -#$%^&_`~'
       */
      if (endChar.match(/[\.,"\/!\?\*\+;:{}=()\[\]\s]/g)) {
        // Append the word we"ve been building
        if (end > start) {
          components.push(rawSentence.slice(start, end));
        }

        // If the character is not whitespace, then it is a special character
        // and should be split off into its own string
        if (!endChar.match(/\s/g)) {
          components.push(endChar);
        }

        // The start of the next word is the next character to be seen.
        start = end + 1;
      }
    }
    if (start < end) {
      components.push(rawSentence.slice(start, end));
    }
    return components;
  }

  function Replace(rawSentences, options) {
    var self = this;
    var opts = options || {};
    self.settings = {
      print: false,
      container: opts.container || "replace",
      namespace: opts.namespace || "replace",
      interval: opts.interval || 5000,
      speed: opts.speed || 200,
      commonWords: opts.commonWords || 1,
      animation: (opts.animation !== undefined) ? opts.animation : true,
      random: (opts.random !== undefined) ? opts.random : true,
      best: (opts.best !== undefined) ? opts.best : true,
    };
    self.wrapper = document.getElementById(self.settings.container);
    self.highestTimeoutId = 0;
    self.transitionEnd = _whichTransitionEndEvent();
    self.currentState = null;
    self.actions = [];
    // self._setSentences(self._parseSentences(rawSentences));
    return this;
  }
  /**
   * Parse the array of raw sentence strings into an array of arrays of words.
   *
   * @param {string[]} rawSentences the sentences to parse
   * @returns {string[][]} sentences the
   */
  Replace.prototype._parseSentences = function(rawSentences) {
    if (!rawSentences || typeof rawSentences !== "object") {
      throw "rawSentences must be an array of strings.";
    }
    return rawSentences.map(_parseSentence);
  };

  Replace.prototype.run = function() {
    var self = this;
    setTimeout(self._sentenceLoop, self.interval);
  };

  /**
   * Compute the actions required to transform `from` into `to`.
   *
   * Example:
   *     from: ["The", "quick", "brown", "fox", "is", "very", "cool", ",", "supposedly", "."]
   *       to: ["The", "brown", "color", "is", "very", "very", "pretty", ",", "no", "?"]
   *   output:
   *     {
   *       from: ["The", "quick", "brown", "fox", "is", "very", "cool", ",", "supposedly", "."],
   *       to: ["The", "brown", "color", "is", "very", "very", "pretty", ",", "no", "?"],
   *       replace:[
   *       { fromWord: "fox",        toWord: "color", fromIndex: 3, toIndex: 2 },
   *       { fromWord: "cool",       toWord: "very",  fromIndex: 6, toIndex: 5 },
   *       { fromWord: "supposedly", toWord: "no",    fromIndex: 8, toIndex: 8 },
   *       { fromWord: ".",          toWord: "?",     fromIndex: 9, toIndex: 9 } ],
   *       remove: [
   *       { fromWord: "quick", fromIndex: 1 } ],
   *       insert: [
   *       { toWord: "pretty", toIndex: 6 } ],
   *       keep: [
   *       { fromWord: "The",   toWord: "The",   fromIndex: 0, toIndex: 0 },
   *       { fromWord: "brown", toWord: "brown", fromIndex: 2, toIndex: 1 },
   *       { fromWord: "is",    toWord: "is",    fromIndex: 4, toIndex: 3 },
   *       { fromWord: "very",  toWord: "very",  fromIndex: 5, toIndex: 4 },
   *       { fromWord: ",",     toWord: ",",     fromIndex: 7, toIndex: 7 } ],
   *       cost: 6
   *     }
   *
   * @param {string[]} from - the sentence to change from
   * @param {string[]} to - the sentence to change to
   *
   * @returns {object} actions - comamnds to perform
   *   @returns {string[]} actions.from - the from sentence
   *   @returns {string[]} actions.to - the to sentence
   *   @returns {object[]} actions.replace - replacements to do
   *     @returns {string} actions.replace.fromWord - word to replace
   *     @returns {string} actions.replace.toWord - word to replace with
   *     @returns {int} actions.replace.fromIndex - index of word to replace
   *     @returns {int} actions.replace.toIndex - index of word to replace with
   *   @returns {object[]} actions.remove - removals to do
   *     @returns {string} actions.remove.fromWord - word to remove
   *     @returns {int} actions.remove.fromIndex - index of word to remove
   *   @returns {object[]} actions.insert - insertions to do
   *     @returns {string} actions.insert.toWord - word to insert
   *     @returns {int} actions.insert.toIndex - index of word to insert
   *   @returns {object[]} actions.keep - words to keep (no-ops)
   *     @returns {string} actions.keep.fromWord - word to keep (from)
   *     @returns {string} actions.keep.toWord - word to keep (to)
   *     @returns {int} actions.keep.fromIndex - index in from of word to keep
   *     @returns {int} actions.keep.toIndex - index in to of word to keep
   *   @returns {int} actions.cost - total cost of action =
   *                                 removals + replacements + insertions
   */
  Replace.prototype._computeActionsToChange = function(from, to) {

    var actions = {
      from: from,
      to: to,
      replace: [],
      remove: [],
      insert: [],
      keep: [],
      cost: 0
    };

    /**
     * Recursively creates `actions`, given a start index for each sentence
     *
     * @param {int} fromIndex - index of first word to consider in from sentence
     * @param {int} toIndex - index of first word to consider in to sentence
     * @param {bool} lookAhead - true if we are looking ahead at other
     *                           possible solutions.  Actions will not be
     *                           modified.  false if actions should be modified.
     * @returns {int} cost - the recursively built cost of actions to take.
     */
    var __computeActionsToCange = function(fromIndex, toIndex, lookAhead) {
      var i;
      lookAhead = lookAhead || false;

      // End of from list
      if (fromIndex >= from.length) {
        if (!lookAhead) {
          for (i = toIndex; i < to.length; i++) {
            actions.insert.push({
              toWord: to[i],
              toIndex: i
            });
          }
        }
        // base case, each insert costs 1
        return to.length - toIndex;
      }

      // End of to list
      if (toIndex >= to.length) {
        if (!lookAhead) {
          for (i = fromIndex; i < from.length; i++) {
            actions.remove.push({
              fromWord: from[i],
              fromIndex: i
            });
          }
        }
        // base case, each remove costs 1
        return from.length - toIndex;
      }

      // Easy Case: a match!
      if (from[fromIndex] === to[toIndex]) {
        if (lookAhead) {
          return 0;
        }
        actions.keep.push({
          fromWord: from[fromIndex],
          toWord: to[toIndex],
          fromIndex: fromIndex,
          toIndex: toIndex
        });
        // keep is free
        return __computeActionsToCange(fromIndex + 1, toIndex + 1);
      }

      var foundIndex = from.indexOf(to[toIndex], fromIndex);

      if (lookAhead) {
        return foundIndex;
      }

      if (fromIndex + 1 == from.length) {
        // Can't look ahead, make a move now
        if(foundIndex === -1) {
          actions.replace.push({
            fromWord: from[fromIndex],
            toWord: to[toIndex],
            fromIndex: fromIndex,
            toIndex: toIndex
          });
          // Replace costs 1
          return __computeActionsToCange(fromIndex + 1, toIndex + 1) + 1;
        }
      }

      var futureIndex = __computeActionsToCange(fromIndex, toIndex + 1, true);

      if (foundIndex === -1) {
        if (futureIndex === 0) {
          actions.insert.push({
            toWord: to[toIndex],
            toIndex: toIndex
          });
          // insert costs 1
          return __computeActionsToCange(fromIndex, toIndex + 1) + 1;
        }
        actions.replace.push({
          fromWord: from[fromIndex],
          toWord: to[toIndex],
          fromIndex: fromIndex,
          toIndex: toIndex
        });
        // replace costs 1
        return __computeActionsToCange(fromIndex + 1, toIndex + 1) + 1;
      }

      if (foundIndex === fromIndex + 1 && futureIndex === fromIndex || foundIndex === futureIndex) {
        var fromLeft = from.length - fromIndex;
        var toLeft = to.length - toIndex;

        if (fromLeft > toLeft) {
          actions.insert.push({
            toWord: to[toIndex],
            toIndex: toIndex
          });
          // Insert costs 1
          return __computeActionsToCange(fromIndex + 1, toIndex) + 1;
        }

        // toLeft >= fromLeft
        actions.remove.push({
          fromWord: from[fromIndex],
          fromIndex: fromIndex
        });
        // remove costs 1
        return __computeActionsToCange(fromIndex, toIndex + 1) + 1;
      }

      if (foundIndex > futureIndex && futureIndex !== -1 ) {
        actions.replace.push({
          fromWord: from[fromIndex],
          toWord: to[toIndex],
          fromIndex: fromIndex,
          toIndex: toIndex
        });
        // Replace costs 1
        return __computeActionsToCange(fromIndex + 1, toIndex + 1) + 1;
      }

      // foundIndex < futureIndex
      for (i = fromIndex; i < foundIndex; i++) {
        actions.remove.push({
          fromWord: from[i],
          fromIndex: i
        });
      }
      actions.keep.push({
        fromWord: from[foundIndex],
        toWord: to[toIndex],
        fromIndex: foundIndex,
        toIndex: toIndex
      });
      // Each remove costs 1, the keep is free
      return __computeActionsToCange(foundIndex + 1, toIndex + 1) + (foundIndex - fromIndex);
    };

    // Initalize the recursive call, the final result is the cost.
    actions.cost = __computeActionsToCange(0, 0);
    return actions;
  };

  function _whichTransitionEndEvent() {
    var t;
    var el = document.createElement("fakeelement");
    var transitions = {
      "transition": "transitionend",
      "OTransition": "otransitionend",
      "MozTransition": "transitionend",
      "WebkitTransition": "webkitTransitionEnd"
    };
    for (t in transitions) {
      if (transitions.hasOwnProperty(t)) {
        if (el.style[t] !== undefined) {
          return transitions[t];
        }
      }
    }
  }



  // Replace.prototype._injectTemplate = function() {
  //   var self = this;
  //   self.wrapper.innerHTML = "<div class="" + classname + "-word">" +
  //     "  <span class="" + classname + "-visible">I</span>" +
  //     "  <span class="" + classname + "-invisible">I</span>" +
  //     "</div><div class="" + classname + "-word verb">" +
  //     "  <span class="" + classname + "-visible"></span>" +
  //     "  <span class="" + classname + "-invisible"></span>" +
  //     "</div><div class="" + classname + "-word obj">" +
  //     "  <span class="" + classname + "-visible"></span>" +
  //     "  <span class="" + classname + "-invisible"></span>" +
  //     "</div><div class="" + classname + "-word prep">" +
  //     "  <span class="" + classname + "-visible"></span>" +
  //     "  <span class="" + classname + "-invisible"></span>" +
  //     "</div><div class="" + classname + "-word noun">" +
  //     "  <span class="" + classname + "-visible"></span>" +
  //     "  <span class="" + classname + "-invisible"></span>" +
  //     "</div><div class="" + classname + "-word " + classname + "-punctuation">" +
  //     "  <span class="" + classname + "-visible">.</span>" +
  //     "  <span class="" + classname + "-invisible">.</span>" +
  //     "</div>";
  // };

  Replace.prototype._setSentences = function(sentences) {
    var self = this;
    var i, j, prevIndex;

    if (self.settings.best) {
      /* Because who says the Traveling Salesman Problem isn't releveant? */

      // compute a table of values
      var table = sentences.map(function(from, fromIndex) {
        return sentences.map(function(to, toIndex) {
          var actions = self._computeActionsToChange(from, to);
          return {
            actions: actions,
            fromIndex: fromIndex,
            toIndex: toIndex
          };
        });
      });
      var usedFromIndexes = [];
      var from = 0;

      table.sort(function(row) {
        row.sort(function(annotatedAction) {
          return annotatedAction.actions.cost;
        });
      });

      for (i = 0; i < sentences.length; i++) {
        for (j = 0; j < sentences.length; j++) {
          if (usedFromIndexes.indexOf(table[from][j].fromIndex) === -1){
            from = table[from][j].toIndex;
            break;
          }
        }
      }
      if(self.settings.random) {
        // start from somewhere other than the beginning.
        var start = Math.floor(Math.random() * (self.sentences.length));
        for (i = 0; i < start; i++) {
          self.actions.push(self.actions.shift());
        }
      }
      return;
    } else {
      if (self.settings.random) {
        // shuffle the sentences
        sentences.sort(function() { return 0.5 - Math.random(); });
      }

      for (i = 0; i < sentences.length; i++) {
        prevIndex = (i === 0) ? sentences.length : i - 1;
        self.actions.push(self._computeActionsToChange(sentences[prevIndex],
                                                       sentences[i]));
      }
    }

  };

  Replace.prototype._sentenceLoop = function() {
    var self = this;
    var nextAction = self.actions.shift();
    self.setLiveSentence(nextAction);
    self.actions.append(nextAction);
    clearTimeout(self.highestTimeoutId);
    self.highestTimeoutId = setTimeout(self._sentenceLoop,
                                       self.settings.interval);
  };

  // Replace.prototype.setLiveSentence = function(nextAction) {
  //   var key;
  //   for (key in newSentence) {
  //     setKey(key, newSentence);
  //   }
  // };

  //   function setKey(key, newSentence) {
  //     var visible = document.querySelector("." + classname + " ." + key +" ." + classname + "-visible"),
  //       invisible = document.querySelector("." + classname + " ." + key +" ." + classname + "-invisible"),
  //       newText = newSentence[key];
  //       function stepOne() {
  //         /* Hold the container width, and fade out */
  //         visible.className += " " + classname + "-animating";

  //         visible.addEventListener(transitionEnd, stepTwo, false);

  //         invisible.style.width = invisible.offsetWidth+"px";
  //         visible.style.opacity = 0;
  //       }
  //       function stepTwo() {
  //         /* Animate the width */
  //         visible.className = visible.className.replace(" " + classname + "-animating", ");
  //         invisible.className += " " + classname + "-animating";

  //         visible.removeEventListener(transitionEnd, stepTwo, false);
  //         invisible.addEventListener(transitionEnd, stepThree, false);

  //         var newWidth = _calculateWordWidth(newText, wrapper.tagName, wrapper.className.split(" "));
  //         invisible.style.width = newWidth+"px";
  //       }
  //       function stepThree() {
  //         /* Replace the text then fade in */
  //         invisible.className = invisible.className.replace(" " + classname + "-animating", ");
  //         visible.className += " " + classname + "-animating";

  //         invisible.removeEventListener(transitionEnd, stepThree, false);
  //         visible.addEventListener(transitionEnd, stepFour, false);

  //         visible.innerHTML = newText;
  //         invisible.innerHTML = newText;
  //         visible.style.opacity = 1;
  //       }
  //       function stepFour() {
  //         /* Reset */
  //         invisible.className = invisible.className.replace(" " + classname + "-animating", ");
  //         visible.className = visible.className.replace(" " + classname + "-animating", ");

  //         visible.removeEventListener(transitionEnd, stepFour, false);

  //         invisible.style.width = "auto";
  //       }

  //     if (newText != visible.innerHTML) {
  //       if (animation) {
  //         stepOne();
  //       } else  {
  //         visible.innerHTML = newText;
  //         invisible.innerHTML = newText;
  //       }
  //     }
  //   }

  Replace.prototype._calculateWordWidth = function(text, tag, classes) {
    var self = this;
    var elem = document.createElement(tag);
    classes = classes || [];
    classes.push(self.settings.namespace + "-text-width-calculation");
    elem.setAttribute("class", classes.join(" "));
    elem.innerHTML = text;
    document.body.appendChild(elem);
    var width = elem.offsetWidth;
    elem.parentNode.removeChild(elem);
    return width;
  };

  Replace.prototype._injectStyle = function() {
    var self = this;
    var className = self.settings.namespace;
    var transitionSpeed = self.settings.speed / 1000; // s -> ms
    var height = self.wrapper.offsetHeight;
    var css =
      "." + className + "-invisible { visibility: hidden; }\n" +
      "." + className + "-animating {\n" +
      "  -webkit-transition: " + transitionSpeed + "s all linear;\n" +
      "  -moz-transition: " + transitionSpeed + "s all linear;\n" +
      "  -o-transition: " + transitionSpeed + "s all linear;\n" +
      "  transition: " + transitionSpeed + "s all linear; }\n" +
      "." + className + "-text-width-calculation {\n" +
      "  position: absolute;\n" +
      "  visibility: hidden;\n" +
      "  height: auto;\n" +
      "  width: auto;\n" +
      "  display: inline-block;\n" +
      "  white-space: nowrap; }" +
      "." + className + " {\n" +
      "  margin: 0;}\n" +
      "  ." + className + " ." + className + "-punctuation { margin-left: -0.3rem; }\n" +
      "  ." + className + " ." + className + "-word {\n" +
      "    display: inline;\n" +
      "    position: relative;\n" +
      "    text-align: center;\n" +
      "    height: " + height + "px;\n" +
      "    white-space: nowrap;\n" +
      "    overflow: hidden;}\n" +
      "    ." + className + " ." + className + "-word span {\n" +
      "      top: 0;\n" +
      "      position: relative;\n" +
      "      overflow: hidden;\n" +
      "      height: 1px;\n" +
      // "      white-space: nowrap;\n" +
      "      display: inline-block;}\n" +
      "      ." + className + " ." + className + "-word ." + className + "-visible {\n" +
      "        position: absolute;\n" +
      "        display: inline;\n" +
      "        height: " + height + "px;\n" +
      "        top: 0;\n" +
      "        bottom: 0;\n" +
      "        right:0;\n" +
      "        left: 0;}";
    var head = document.head || document.getElementsByTagName("head")[0];
    var style = document.createElement("style");

    style.type = "text/css";
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  };

  window.Replace = Replace;

}(window));