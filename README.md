Replace.js
==========

[![Build status](https://travis-ci.org/danrschlosser/replace.js.svg)](https://travis-ci.org/danrschlosser/replace.js)

Replace.js will rotate through a series of sentences, transitioning between each one.

## Quick Start

Replace.js is easy to use. Add the script to your page, provide a target container and call `run()`.

#### Step 1: Download

[Download the latest release](https://github.com/danrschlosser/replace.js/releases/download/v0.1/replace.min.js) or clone the repo:

```bash
$ git clone git@github.com:danrschlosser/replace.js
```

#### Step 2: Create your container element

```html
<div id="replace"></div>
```

#### Step 3: Add the `replace.js` file

```html
<script src="replace.min.js"></script>
```

#### Step 4: Init Replace.js

```javascript
var replace = new Replace([
    "First sentence.",
    "Second sentence.",
    "How about a third."
]).run();
```

## API

### Replace(_sentences_, [_options_])

The `Replace` constructor create a new instance of replacement. The `sentences` parameter should be a list of sentence strings.  Customize the instance by passing the `options` parameter. The example below uses all options and their defaults:

```javascript
var opts = {
  containerId: "replace",
  namespace: "replace",
  interval: 5000,
  speed: 200,
  verbose: false,
  random: false,
  best: true
};
var replace = new Replace([
    "First sentence.",
    "Second sentence.",
    "How about a third."
], opts).run();
```

### Options

| Option | Description | Defualt |
|--------|-------------|---------|
| `containerId` | Id of the injection point for HTML | `"replace"`
| `namespace` | Namespace to prepend to classes used internally | `"replace"`
| `interval` | Number of milliseconds between each change | `5000`
| `speed` | Number of milliseconds that each step of the animation should take | `200`
| `verbose` | True to enable console logging | `false`
| `random` | True if the first sentence to appear should be random | `false`
| `best` | True if the sentences should be ordered to minimize the number of changes performed | `true`

### run()

Starts the rotation between sentences.

