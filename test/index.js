/*
* The unit tests for metalsmith-index.
* Copyright (C) 2018  David Soulayrol <david.soulayrol@gmail.com>
*/

const assert = require('assert')
const eol = require('eol')
const fs = require('fs')
const metalsmith = require('metalsmith')
const path = require('path')
const readdir = require("recursive-readdir")
const index = require('..')


function areArraysMatching (a, b) {
  var set = new Set(a)
  b.forEach((e) => { set.add(e) })
  return set.size == a.length;
}

function testIndex (options, fn) {
  metalsmith('test/fixtures')
    .use(index(options))
    .build(function(err, files) {
      fn(err, files)
    })
}

describe('metalsmith-index', function () {
  it('should do nothing by default', function (done) {
    testIndex({}, function (err, files) {
      if (err) return done(err)
      assert(files['index.list'] === undefined, 'no files were indexed')
      done()
    })
  })

  it('should ignore invalid paths', function (done) {
    testIndex({
      'somewhere/in/outer/space': { title: 'Title' }
    }, function (err, files) {
      if (err) return done(err);
      assert(files['index.list'] === undefined, 'index was created')
      done()
    })
  })

  it('should list all the files from a directory', function (done) {
    testIndex({
      'pub': {}
    }, function (err, files) {
      if (err) return done(err)
      assert(files['pub/index.list'], 'files were not indexed')
      assert(areArraysMatching(
        eol.split(files['pub/index.list'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/pub')))
      done()
    })
  })

  it('should take the given index filename', function (done) {
    testIndex({
      'pub': { filename: 'ZZZ' }
    }, function (err, files) {
      if (err) return done(err)
      assert(files['pub/ZZZ'], 'files were not indexed')
      assert(areArraysMatching(
        eol.split(files['pub/ZZZ'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/pub')))
      done()
    })
  })

  it('should keep the given index metadata', function (done) {
    testIndex({
      'pub': { title: 'Title' }
    }, function (err, files) {
      if (err) return done(err)
      assert(files['pub/index.list'], 'files were not indexed')
      assert(files['pub/index.list'].title == 'Title', 'metadata was dropped')
      assert(areArraysMatching(
        eol.split(files['pub/index.list'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/pub')))
      done()
    })
  })

  it('should use a custom format for all the indexed files', function(done) {
    var formatFile = function (filename, file) {
      return '[' + filename.toUpperCase() + ']\n'
    }
    testIndex({
      'pub': { format: formatFile }
    }, function(err, files) {
      if (err) return done(err)
      assert(files['pub/index.list'], 'files were not indexed')
      assert(areArraysMatching(
        eol.split(files['pub/index.list'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/pub').map((filename) => {
          return '[' + filename.toUpperCase() + ']'
        })))
      done()
    })
  })

  it('should filter the indexed files', function(done) {
    var filterFile = function (filename, file) {
      return !filename.startsWith('image')
    }
    testIndex({
      'pub': { filter: filterFile }
    }, function(err, files) {
      if (err) return done(err)
      assert(files['pub/index.list'], 'files were not indexed')
      assert(areArraysMatching(
        eol.split(files['pub/index.list'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/pub').filter(filterFile)))
      done()
    })
  })

  it('should sort the indexed files', function(done) {
    var sortFiles = function (a, b) {
      return a.length - b.length;
    }
    testIndex({
      'pub': { sort: sortFiles }
    }, function(err, files) {
      if (err) return done(err)
      assert(files['pub/index.list'], 'files were not indexed')
      assert(areArraysMatching(
        eol.split(files['pub/index.list'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/pub').sort(sortFiles)))
      done()
    })
  })

  it('should handle multiple directories', function(done) {
    testIndex({
      'pub': {},
      'documents': { filename: 'INDEX' }
    }, function(err, files) {
      if (err) return done(err)
      assert(files['pub/index.list'], 'pub files were not indexed')
      assert(areArraysMatching(
        eol.split(files['pub/index.list'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/pub')))
      assert(files['documents/INDEX'], 'document files were not indexed')
      assert(areArraysMatching(
        eol.split(files['documents/INDEX'].contents.toString('utf-8')),
        fs.readdirSync('test/fixtures/src/documents')))
      done()
    })
  })

  it('should ignore subdirectories by default', function(done) {
    testIndex({
      'recursivity': {}
    }, function(err, files) {
      if (err) return done(err)
      assert(files['recursivity/index.list'], 'recursivity files were not indexed')
      readdir('test/fixtures/src/recursivity', [(filename, stats) => {
        return stats.isDirectory()
      }], function (err, readFiles) {
        assert(areArraysMatching(
          eol.split(files['recursivity/index.list'].contents.toString('utf-8')),
          readFiles.map(f => path.relative('test/fixtures/src/recursivity', f))))
        done()
      })
    })
  })

  it('should index in depth when asked to', function(done) {
    testIndex({
      'recursivity': { recursive: true }
    }, function(err, files) {
      if (err) return done(err)
      assert(files['recursivity/index.list'], 'recursivity files were not indexed')
      readdir('test/fixtures/src/recursivity', [], function (err, readFiles) {
        assert(areArraysMatching(
          eol.split(files['recursivity/index.list'].contents.toString('utf-8')),
          readFiles.map(f => path.relative('test/fixtures/src/recursivity', f))))
        done()
      })
    })
  })

});

