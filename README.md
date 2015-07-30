substituteteacher.js ([demo][sub])
===========================

[![Build status](https://travis-ci.org/danrschlosser/substituteteacher.js.svg)](https://travis-ci.org/danrschlosser/substituteteacher.js)

[![Substitute Teacher](http://static.schlosser.io/ss/sub/sub.gif)][sub]

`substituteteacher.js` will rotate through a series of sentences, transitioning between each one.

## Quick Start

`substituteteacher.js` is easy to use. Add the script to your page, provide a target container and call `run()`.

#### Step 0: Download

[Download the latest release][download] or clone the repo:

```bash
$ git clone git@github.com:danrschlosser/substituteteacher.js
```

#### Step 1: Add the `substituteteacher.min.js` file

```html
<script src="substituteteacher.min.js"></script>
```

#### Step 2: Create your container element

```html
<div id="sub">Fallback Text</div>
```

#### Step 3: Init substituteteacher.js

```javascript
var sub = new Sub([
    "A daring JavaScript library for subsitute teachers",
    "A hilarious JavaScript library for awesome taglines",
    "A svelte JavaScript library for sweet taglines",
    "A badass JavaScript library for sliding fun",
    "A JavaScript library for word substitution"
]).run();
```

## API

### Sub(_sentences_, [_options_])

The `Sub` constructor create a new instance of sub. The `sentences` parameter should be a list of sentence strings.  Customize the instance by passing the `options` parameter. The example below uses all options and their defaults:

```javascript
var opts = {
  containerId: "sub",
  namespace: "sub",
  interval: 5000,
  speed: 200,
  verbose: false,
  random: false,
  best: true
};
var sub = new Sub([
    "A daring JavaScript library for subsitute teachers",
    "A hilarious JavaScript library for awesome taglines",
    "A svelte JavaScript library for sweet taglines",
    "A badass JavaScript library for sliding fun",
    "A JavaScript library for word substitution"
], opts).run();
```

### Options

| Option | Description | Defualt |
|--------|-------------|---------|
| `containerId` | Id of the injection point for HTML | `"sub"`
| `namespace` | Namespace to prepend to classes used internally | `"sub"`
| `interval` | Number of milliseconds between each change | `5000`
| `speed` | Number of milliseconds that each step of the animation should take | `200`
| `verbose` | True to enable console logging | `false`
| `random` | True if the first sentence to appear should be random | `false`
| `best` | True if the sentences should be ordered to minimize the number of changes performed | `true`

### run()

Starts the rotation between sentences.

[download]: https://github.com/danrschlosser/substituteteacher.js/releases/download/v0.3/substituteteacher.min.js
[sub]: http://danrschlosser.github.io/substituteteacher.js/