(function(window) {

  "use strict";

  function _sortAnnotatedAction(annotatedAction1, annotatedAction2) {
    return annotatedAction1.action.cost - annotatedAction2.action.cost;
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

  function _whichTransitionEndEvent() {
    var t;
    var el = document.createElement("fakeelement");
    var transitions = {
      "WebkitTransition": "webkitTransitionEnd",
      "MozTransition": "transitionend",
      "MSTransition": "msTransitionEnd",
      "OTransition": "otransitionend",
      "transition": "transitionend",
    };
    for (t in transitions) {
      if (transitions.hasOwnProperty(t)) {
        if (el.style[t] !== undefined) {
          return transitions[t];
        }
      }
    }
  }

  function _wordTemplate(namespace, idx) {
    return (
      "<div class=\"idx-" + idx + " " + namespace + "-word\">" +
      "  <span class=\"" + namespace + "-visible\" style=\"opacity: 0\"></span>" +
      "  <span class=\"" + namespace + "-invisible\" style=\"width: 0px\"></span>" +
      "</div>"
    );
  }

  function _injectStyle(namespace, transitionSpeed, height) {
    var css =
      "." + namespace + "-invisible { visibility: hidden; }\n" +
      "." + namespace + "-animating {\n" +
      "  -webkit-transition: " + transitionSpeed + "s all linear;\n" +
      "  -moz-transition: " + transitionSpeed + "s all linear;\n" +
      "  -o-transition: " + transitionSpeed + "s all linear;\n" +
      "  transition: " + transitionSpeed + "s all linear; }\n" +
      "." + namespace + "-text-width-calculation {\n" +
      "  position: absolute;\n" +
      "  visibility: hidden;\n" +
      "  height: auto;\n" +
      "  width: auto;\n" +
      "  display: inline-block;\n" +
      "  white-space: nowrap; }" +
      "." + namespace + " {\n" +
      "  margin: 0;}\n" +
      "  ." + namespace + " ." + namespace + "-punctuation { margin-left: -0.3rem; }\n" +
      "  ." + namespace + " ." + namespace + "-word {\n" +
      "    display: inline;\n" +
      "    position: relative;\n" +
      "    text-align: center;\n" +
      "    height: " + height + "px;\n" +
      "    white-space: nowrap;\n" +
      "    overflow: hidden;}\n" +
      "    ." + namespace + " ." + namespace + "-word span {\n" +
      "      top: 0;\n" +
      "      position: relative;\n" +
      "      overflow: hidden;\n" +
      "      height: 1px;\n" +
      // "      white-space: nowrap;\n" +
      "      display: inline-block;}\n" +
      "      ." + namespace + " ." + namespace + "-word ." + namespace + "-visible {\n" +
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
  }

  /********************************* Replace *********************************/

  function Replace(rawSentences, options) {
    var self = this;
    var opts = options || {};
    self.settings = {
      print: false,
      container: opts.container || "replace",
      namespace: opts.namespace || "replace",
      interval: opts.interval || 1000,
      speed: opts.speed || 100,
      verbose: (opts.verbose !== undefined) ? opts.verbose : false,
      animation: (opts.animation !== undefined) ? opts.animation : true,
      random: (opts.random !== undefined) ? opts.random : false,
      best: (opts.best !== undefined) ? opts.best : true,
    };
    self.wrapper = document.getElementById(self.settings.container);
    _injectStyle(self.settings.namespace, self.settings.speed / 1000, self.wrapper.offsetHeight);
    self.highestTimeoutId = 0;
    self.currentState = null;
    self.actions = [];
    self.invisibleClass = " ." + self.settings.namespace + "-invisible";
    self.visibleClass = " ." + self.settings.namespace + "-visible";
    self.wrapperSelector = "#" + self.settings.namespace;
    self._setupContainer();
    self._setSentences(self._parseSentences(rawSentences));
    return this;
  }

  Replace.prototype._setupContainer = function() {
    var self = this;
    var container = document.getElementById(self.settings.container);
    if (!container) {
      throw "Cannot find element with id:" + self.settings.container;
    }
    container.innerHTML = "";
    container.className = self.settings.namespace;
  };

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

    // We haven't finished generating self.actions yet, so delay running
    if (!self.actions) {
      setTimeout(function() {
        self.run();
      }, 20);
    }

    console.log("ACTIONS: ", self.actions);
    var action = self._computeActionsToChange([], self.actions[0].from);
    if (!action) {
      console.log(action);
      throw "returned null action";
    }
    self._applyAction(action);
    self.highestTimeoutId = setTimeout(function() {
      self._sentenceLoop();
    }, self.settings.interval);
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
    var self = this;
    if (self.settings.verbose) { console.log("_computeActionsToChange: ", from, to); }
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

  Replace.prototype._setSentences = function(sentences) {
    var self = this;
    var i, j, prevIndex;
    if (sentences.length === 0) {
      self.actions = [];
    }

    if (self.settings.best) {
      /* Because who says the Traveling Salesman Problem isn't releveant? */

      // compute a table of values table[fromIndex][toIndex] = {
      //   fromIndex: fromIndex,
      //   toIndex: toIndex,
      //   action: the action from sentences[fromIndex] to sentences[toIndex]
      // }
      var table = sentences.map(function(from, fromIndex) {
        return sentences.map(function(to, toIndex) {
          if (fromIndex === toIndex) {
            return {
              action: { cost: Number.MAX_VALUE },
              fromIndex: fromIndex,
              toIndex: toIndex
            };
          }
          var action = self._computeActionsToChange(sentences[fromIndex],
                                                    sentences[toIndex]);
          return {
            action: action,
            fromIndex: fromIndex,
            toIndex: toIndex
          };
        });
      });
      var usedFromIndexes = [];
      var from = 0;

      // sort each rows by cost, then sort the rows by lowest cost in that row
      table.sort(function(row1, row2) {
        row1.sort(_sortAnnotatedAction);
        row2.sort(_sortAnnotatedAction);
        return row1[0].cost - row2[0].cost;
      });

      var first = table[0][0].fromIndex;

      console.log("it's a table: ", table);

      // Start with table[0][0], the lowest cost action.  Then, find the lowest
      // cost actions starting from table[0][0].toIndex, and so forth.
      for (i = 0; i < sentences.length; i++) {
        for (j = 0; j < sentences.length; j++) {
          if ((i === sentences.length - 1 && table[from][j].toIndex === first) ||
            (i !== sentences.length - 1 && usedFromIndexes.indexOf(table[from][j].toIndex) === -1)) {
            self.actions.push(table[from][j].action);
            usedFromIndexes.push(from);
            from = table[from][j].toIndex;
            break;
          }
        }
      }

      if(self.settings.random) {
        // start from somewhere other than the beginning.
        var start = Math.floor(Math.random() * (sentences.length));
        for (i = 0; i < start; i++) {
          self.actions.push(self.actions.shift());
        }
      }

    } else {

      if (self.settings.random) {
        // shuffle the sentences
        sentences.sort(function() { return 0.5 - Math.random(); });
      }

      for (i = 0; i < sentences.length; i++) {
        prevIndex = (i === 0) ? (sentences.length - 1) : i - 1;
        self.actions.push(self._computeActionsToChange(sentences[prevIndex],
                                                       sentences[i]));
      }
    }
  };

  Replace.prototype._sentenceLoop = function() {
    var self = this;
    var nextAction = self.actions.shift();
    if (!nextAction) {
      console.log(nextAction, self.actions);
      throw "returned null action";
    }
    console.log("-------------------------------");
    self._applyAction(nextAction);
    self.actions.push(nextAction);
    clearTimeout(self.highestTimeoutId);
    self.highestTimeoutId = setTimeout(function() {
      self._sentenceLoop();
    }, self.settings.interval);
  };

  Replace.prototype._applyAction = function(action) {
    var self = this;
    action.replace.map(function(replaceAction) {
      self._replaceAction(replaceAction);
    });
    action.remove.map(function(removeAction) {
      self._removeAction(removeAction);
    });
    action.keep.map(function(keepAction) {
      self._keepAction(keepAction);
    });
    self._performInsertions(action.insert);
  };

  Replace.prototype._removeAction = function(removeAction) {
    var self = this;
    var fromIndexClass = "idx-" + removeAction.fromIndex;
    var animationContext = {
      fromIndexClass: fromIndexClass,
      word: document.querySelector(self.wrapperSelector + " ." + fromIndexClass),
      visible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.visibleClass),
      invisible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.invisibleClass),
      newText: "" // We'll animate to zero width
    };
    if (self.settings.verbose) { console.log("remove", animationContext); }
    return new Animation("remove", self, animationContext);
  };

  Replace.prototype._performInsertions = function(insertions) {
    var self = this;
    setTimeout(function () {
      insertions.forEach(function(insertAction) {

        /* Insert new node (no text yet) */
        var html = _wordTemplate(self.settings.namespace, insertAction.toIndex);
        if (insertAction.toIndex === 0) {
          self.wrapper.insertAdjacentHTML("afterbegin", html);
        } else {
          var selector = self.wrapperSelector + " .idx-" + (insertAction.toIndex - 1);
          var prevSibling = document.querySelector(selector);
          prevSibling.insertAdjacentHTML("afterend", html);
        }

        /*  Startup animations */
        var toIndexClass = "idx-" + insertAction.toIndex;
        var animationContext = {
          toIndexClass: toIndexClass,
          word: document.querySelector(self.wrapperSelector + " ." + toIndexClass),
          visible: document.querySelector(self.wrapperSelector + " ." + toIndexClass + self.visibleClass),
          invisible: document.querySelector(self.wrapperSelector + " ." + toIndexClass + self.invisibleClass),
          newText: insertAction.toWord
        };

        if (self.settings.verbose) { console.log("insert", animationContext); }
        new Animation("insert", self, animationContext);
      });
    }, self.settings.speed);
  };

  Replace.prototype._replaceAction = function(replaceAction) {
    var self = this;
    var fromIndexClass = "idx-" + replaceAction.fromIndex;
    var animationContext = {
      fromIndexClass: fromIndexClass,
      toIndexClass: "idx-" + replaceAction.toIndex,
      word: document.querySelector(self.wrapperSelector + " ." + fromIndexClass),
      visible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.visibleClass),
      invisible: document.querySelector(self.wrapperSelector + " ." + fromIndexClass + self.invisibleClass),
      newText: replaceAction.toWord
    };
    console.log("REPLACE: ", animationContext);
    if (self.settings.verbose) { console.log("replace", animationContext); }
    return new Animation("replace", self, animationContext);
  };

  Replace.prototype._keepAction = function(keepAction) {
    var self = this;
    var fromIndexClass = "idx-" + keepAction.fromIndex;
    var animationContext = {
      fromIndexClass: fromIndexClass,
      toIndexClass: "idx-" + keepAction.toIndex,
      word: document.querySelector(self.wrapperSelector + " ." + fromIndexClass),
    };

    if (self.settings.verbose) { console.log("keep", animationContext); }
    return new Animation("keep", self, animationContext);
  };

  /******************************** Animation ********************************/

  function Animation(animation, replace, animationContext) {
    var self = this;
    self.replace = replace;
    self.ctx = animationContext;
    self.transitionEnd = _whichTransitionEndEvent();
    self.animatingClass = " " + self.replace.settings.namespace + "-animating";
    if (animation === "remove") {
      self.steps = [
        function() {self._fadeOut();},
        function() {self._setWidth();},
        function() {self._removeElement();}
      ];
    } else if (animation === "replace") {
      self.steps = [
        function() {self._reIndex();},
        function() {self._fadeOut();},
        function() {self._setWidth();},
        function() {self._setTextAndFadeIn();},
        function() {self._cleanUp();}];
    } else if (animation === "insert") {
      self.steps = [
        function() {self._setWidth();},
        function() {self._setTextAndFadeIn();},
        function() {self._cleanUp();}];
    } else if (animation === "keep") {
      self.steps = [
        function() {self._reIndex();}
      ];
    } else {
      console.log("Unknown animation: ", animation);
    }
    self.steps[0](); // dequeue an run the first task.
  }

  Animation.prototype._reIndex = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.replace.settings.verbose) { console.log("_reIndex"); }

    // Perform replacement if needed
    console.log("reIndexing ", ctx.word, " from ",  ctx.fromIndexClass, " to ", ctx.toIndexClass);
    ctx.word.className = ctx.word.className.replace(ctx.fromIndexClass, ctx.toIndexClass);

    // run next step if there is one
    self.steps.shift(); // pop _reIndex
    if (self.steps.length > 0) {
      self.steps[0]();
    }
  };

  Animation.prototype._fadeOut = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.replace.settings.verbose) { console.log("_fadeOut"); }

    /* Hold the container width, and fade out */
    ctx.visible.className += self.animatingClass;
    self.steps.shift(); // pop _fadeOut
    ctx.visible.addEventListener(self.transitionEnd, self.steps[0], false);
    ctx.invisible.style.width = ctx.invisible.offsetWidth + "px";
    ctx.visible.style.opacity = 0;
  };

  Animation.prototype._setWidth = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.replace.settings.verbose) { console.log("_setWidth"); }
    /* Animate the width */
    ctx.visible.className = ctx.visible.className.replace(self.animatingClass, "");
    ctx.invisible.className += self.animatingClass;
    ctx.visible.removeEventListener(self.transitionEnd, self.steps[0], false);
    self.steps.shift(); // pop _setWidth
    ctx.invisible.addEventListener(self.transitionEnd, self.steps[0], false);
    var newWidth = self._calculateWordWidth(
      ctx.newText,
      self.replace.wrapper.tagName,
      self.replace.wrapper.className.split(" ")
    );
    setTimeout(function() {
      ctx.invisible.style.width = newWidth + "px";
    }, 5);
  };

  Animation.prototype._removeElement = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.replace.settings.verbose) { console.log("_removeElement"); }

    /* Remove this word */
    ctx.invisible.removeEventListener(self.transitionEnd, self.steps[0], false);
    self.replace.wrapper.removeChild(ctx.word);
  }

  Animation.prototype._setTextAndFadeIn = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.replace.settings.verbose) { console.log("_setTextAndFadeIn"); }
    /* Replace the text then fade in */
    ctx.invisible.className = ctx.invisible.className.replace(self.animatingClass, "");
    ctx.visible.className += self.animatingClass;
    ctx.invisible.removeEventListener(self.transitionEnd, self.steps[0], false);
    self.steps.shift(); // pop _setTextAndFadeIn
    ctx.visible.addEventListener(self.transitionEnd, self.steps[0], false);
    ctx.visible.innerHTML = ctx.newText;
    ctx.invisible.innerHTML = ctx.newText;
    ctx.visible.style.opacity = 1;
  };

  Animation.prototype._cleanUp = function() {
    var self = this;
    var ctx = self.ctx;
    if (self.replace.settings.verbose) { console.log("_cleanUp"); }

    /* Clean Up */
    ctx.invisible.className = ctx.invisible.className.replace(self.animatingClass, "");
    ctx.visible.className = ctx.visible.className.replace(self.animatingClass, "");
    ctx.visible.removeEventListener(self.transitionEnd, self.steps[0], false);
    ctx.invisible.style.width = "auto";
  };

  Animation.prototype._calculateWordWidth = function(text, tag, classes) {
    var self = this;
    var elem = document.createElement(tag);
    classes = classes || [];
    classes.push(self.replace.settings.namespace + "-text-width-calculation");
    elem.setAttribute("class", classes.join(" "));
    elem.innerHTML = text;
    document.body.appendChild(elem);
    /* Get a decimal number of the form 12.455 */
    var width = parseFloat(window.getComputedStyle(elem, null).width);
    elem.parentNode.removeChild(elem);
    return width;
  };

  window.Replace = Replace;

}(window));