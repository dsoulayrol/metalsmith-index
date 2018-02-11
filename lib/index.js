/*
* A simple plugin for Metalsmith to create directory indexes.
* Copyright (C) 2018  David Soulayrol <david.soulayrol@gmail.com>
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const path = require('path')
const readdir = require("recursive-readdir")

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
      var ignored = []

      indexes[dirname].filter = indexes[dirname].filter || defaultFilter
      indexes[dirname].format = indexes[dirname].format || defaultFormat
      indexes[dirname].compare = indexes[dirname].sort || defaultCompare

      if (indexes[dirname].recursive != true) {
        ignored.push((file, stats) => {
          return stats.isDirectory()
        })
      }

      readdir(root, ignored, function (err, children) {
        setImmediate(done)
        if (err) {
          console.log(root + ': ' + err.code)
        } else {
          createIndex(files, dirname, children.map(
            f => path.relative(root, f)))
        }
      })
    })
  }
}
