/*!
 * arango-store.js
 * Created by Kilian Ciuffolo on June 12, 2014
 * (c) 2013-2014 Clevertech http://clevertech.biz
 */ "use strict";

var arango = require('arango')
  , async = require('async')
  , debug = require('debug')('sas')

/**
 * Initialize store
 * @param  {String|Object} opts Passed directly to arango driver
 * @return {Object}             ???
 */

module.exports = function (opts) {
  var db = null
  var seneca = this

  // default options when creating a document
  var createOptions = {
    createCollection: true,
    waitForSync: true
  }

  var store = {
    name: 'arango-store',

    save: function (args, callback) {
      var entity = args.ent
      var doc = entity2doc(entity)
      var collname = getCollectionName(entity)
      var path = collname + '/' + doc.id

      if (undefined !== doc.id) { // UPDATE
        db.document.put(path, doc, {}, function (err, res) {
          if (err) return error(callback, res)
          entity.rev$ = res._rev
          callback(null, entity)
        })
      } else { // CREATE
        db.document.create(collname, doc, createOptions, function (err, res) {
          if (err) return error(callback, res)

          doc._id = res._id
          doc._key = res._key
          doc._rev = res._rev

          callback(null, doc2Entity(entity, doc))
        })
      }
    },

    load: function (args, callback) {
      var q = args.q
      var entity = args.qent
      var collname = getCollectionName(args.qent)

      // ensure limit 1
      q.all$ = false

      // build q from id
      if ('string' === typeof q) {
        q = { id: q }
      }

      buildQuery(db, collname, q).exec(function (err, res) {
        if (err) return error(callback, res)
        callback(null, doc2Entity(entity, res.result[0]))
      })
    },

    list: function (args, callback) {
      var q = args.q
      var entity = args.qent
      var collname = getCollectionName(args.ent)

      q.all$ = true

      buildQuery(db, collname, q).exec(function (err, res) {
        if (err && 404 !== res.code) return error(callback, res)
        if (err && 404 === res.code) return callback(null, [])

        var docs = res.result.map(doc2Entity.bind(null, entity))

        callback(null, docs)
      })
    },

    remove: function (args, callback) {
      var q = args.q
      var collname = getCollectionName(args.ent)

      // if empty query and all$ then drop database
      if (1 === Object.keys(q).length && q.all$) {
        return db.collection.delete(collname, function (err, res) {
          // ignore 404 whene dropping a collection twice
          if (err && 404 !== res.code) return error(callback, res)
          callback(null)
        })
      }

      // retrieve list of ids to remove
      buildQuery(db, collname, q, 'doc._id').exec(function (err, res) {
        if (err && 404 !== res.code) return error(callback, res)
        if (err && 404 === res.code) return callback(null)

        async.map(res.result, function (doc) {
          db.document.delete(doc, function (err, res) {
            // ignore 404 when removing a document twice
            if (err && 404 !== res.code) return error(callback, res)
            callback(null)
          })
        }, callback)
      })
    },

    native: function (args, callback) {
      callback(null, db)
    },

    close: function (args, callback) {
      callback(null)
    }
  }

  var meta = seneca.store.init(seneca, opts, store)

  seneca.add({
    init: store.name,
    tag: meta.tag
  }, function configure(args, callback) {
    db = arango.Connection(args)
    db.collection.list(callback)
  })

  return {
    name: store.name,
    tag: meta.tag
  }
}

/**
 * Handles arango driver error
 * @param  {Function} callback Done function
 * @param  {Object}   data     Error description
 */

function error(callback, data, q) {
  console.log(data)
  callback(new Error(data.errorMessage + ': ' + q))
}

/**
 * Create a seneca entity from an arangodb document
 * @param  {Object} doc     ArangoDB document
 * @param  {Entity} entity  Seneca parent entity
 * @return {Entity}         New entity instance
 */

function doc2Entity(entity, doc) {
  doc.id = doc._key
  doc.id$ = doc._key
  doc.rev$ = doc._rev

  delete doc._id
  delete doc._rev
  delete doc._key

  return entity.make$(doc)
}

/**
 * Retrieves the collection name from an entity
 * @param  {Entity} entity Entity input
 * @return {String}        The collection name
 */

function getCollectionName(entity) {
  var canon = entity.canon$({ object: true })
  return (canon.base ? canon.base + '_' : '' ) + canon.name
}

/**
 * Creates a plain object from an input entity
 * @param  {Entity} entity Entity input
 * @return {Object}        Plain object
 */

function entity2doc(entity) {
  var fields = entity.fields$()
  var doc = Object.create(null)

  fields.forEach(function (field) {
    doc[field] = entity[field]
  })

  doc._key = entity.id$ || entity.id

  return doc
}

/**
 * Build SQL query given a query object
 * @param  {Db}     db     Db instance
 * @param  {Entity} entity Seneca entity
 * @param  {Object} fields Search fields
 * @return {Query}         The query
 */

function buildQuery(db, collname, q, projection) {
  var query = db.query.for('doc').in(collname)

  // _key is the object id in arangodb
  q._key = q.id
  delete q.id

  if (!q.all$ || q.skip$) {
    var limit = q.all$ ? '' : ', 1'
    var skip = q.skip$ ? q.skip$ : '0'
    query.limit(skip + limit)
  }

  if (q.sort$ && 'function' === typeof q.sort$.hasOwnPoperty) {
    var sortkey = Object.keys(q.sort$).pop()
    var direction = sortkey > 0 ? 'ASC' : 'DESC'
    query.sort(sortkey + ' ' + direction)
  }

  delete q.skip$
  delete q.sort$
  delete q.fields$ // TBD
  delete q.all$

  Object.keys(q).forEach(function (key) {
    if (undefined === q[key]) return
    query.filter('doc.' + key + ' == ' + JSON.stringify(q[key]))
  })

  query.return(projection || 'doc')

  debug('query: %s', query)

  return query
}