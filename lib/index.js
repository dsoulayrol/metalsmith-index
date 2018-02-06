const fs = require('fs')
const path = require('path')

/**
 * Expose `plugin`.
 */
module.exports = plugin

/**
 * Metalsmith plugin to inject index files in directories.
 *
 * @return {Function}
 */
function plugin (indexes) {
  indexes = indexes || {}

  function defaultFilter (filename, file) {
    return true
  }

  function defaultFormat (filename, file) {
    return filename + '\n'
  }

  function defaultCompare (a, b) {
    return b.length - a.length;
  }

  function createIndex (files, dirname, children) {
    var def = indexes[dirname],
        index = Object.assign({ files: [] }, def),
        file = path.join(dirname, def.filename || 'index.list'),
        contents = ''

    children.sort(def.compare).forEach((f) => {
      var filename = path.join(dirname, f)
      if (def.filter(f, files[filename])) {
        index.files.push({
          name: f,
          path: filename,
          date: files[filename].stats.mtime
        })
        contents = contents + def.format(f, files[filename])
      }
    })

    index.contents = Buffer.from(contents)
    files[file] = index

    return files
  }

  return function (files, metalsmith, done) {
    if (Object.keys(indexes).length == 0)
      done()

    Object.keys(indexes).forEach(function (dirname) {
      var root = metalsmith.path(path.join(metalsmith.source(), dirname))

      indexes[dirname].filter = indexes[dirname].filter || defaultFilter
      indexes[dirname].format = indexes[dirname].format || defaultFormat
      indexes[dirname].compare = indexes[dirname].sort || defaultCompare

      fs.readdir(root, (err, children) => {
        setImmediate(done)
        if (err) {
          console.log(root + ': ' + err.code)
        } else {
          createIndex(files, dirname, children)
        }
      })
    })
  }
}
