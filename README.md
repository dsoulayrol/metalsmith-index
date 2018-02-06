# metalsmith-index

This simple plugin for [Metalsmith][] is aimed at creating directory
indexes. It is different from [metalsmith-collections][] in that it
does not simply create metadata to link documents between them, but
creates new entries in the list of files manipulated by Metalsmith. In
other words, it is useful to create directory indexes *ex-nihilo*.

[metalsmith]: http://metalsmith.io
[metalsmith-collections]: https://github.com/segmentio/metalsmith-collections

##  Usage

metalsmith-index requires a list of indexes to generate or it will do
nothing. This list is provideed using an object. Each key of this
object is the path of a directory to index. Each value associated to a
key is a collection of options aimed at controling the index output.

If using the CLI for Metalsmith, metalsmith-index can be used like any
other plugin by including it in `metalsmith.json`.

```js
{
  "plugins": {
    "metalsmith-index": {
      "pub": {},
      "archives/2017": {}
    }
  }
}
```

In Metalscript's JavaScript API, metalsmith-index can be used like any
other plugin by attaching it to the function invocation chain on the
Metalscript object.

```js
const index = require('metalsmith-index')

require('metalsmith')(__dirname)
  .use(index({
    'pub': {},
    'archives/2017': {}
  }))
  .build();
```

## Behaviour

The examples provided above both add two new files (`pub/index.list`
and `archives/2017/index.list`) to the list of files to be passed to
subsequent plugins. Those files contain respectively the list of the
filenames from the `pub` and `archives/2017` directories.

More specifically, each entry produced by metalsmith-index contains
two keys:

- `files` is the list of the metadata about the indexed files. For
  each file, it contains an object with the name, the path and the
  last modification date. This can be used to easily handle the entry
  programmatically, or with a layout plugin for example.

- `contents` is a buffer with the list of the indexed filenames. This
  is useful to handle the entry like any other source file.

## Options

Each index to produce can be given an options object. Here are the
options that can be used to alter the index content. Everything else
is metadata that is added to the created index file.

- `filename` provides the entry filename (default is `index.list`).

- `filter` is a function to be used to test the files to be indexed.
  The function must take two arguments: the filename and the
  Metalsmith entry (with the file contents and stats). Are only
  indexed the files for which the function returns True.

- `format` is a function to be applied on each index file so as to
  create its representation in the list. Default is the filename
  **followed by a new line character.** The function must take two
  arguments: the filename and the Metalsmith entry (with the file
  contents and stats), and return a string.

- `sort` is a function which is called to sort the files read in the
  source directory before building the index. By default, the
  alphabetic order is used. The function is used to sort an array of
  strings and must behave like a [compareFunction][].

[compareFunction]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
