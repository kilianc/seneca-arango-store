var seneca = require('seneca')()
  , shared = require('seneca-store-test')

describe('seneca-arango-store', function () {
  this.timeout(20000)

  var testcount = seneca.__testcount = 0

  before(function (done) {
    seneca.use('../lib/arango-store', 'http://localhost:8529')

    seneca.ready(function (err) {
      seneca.make$('foo').native$(function (err, db) {
        db.collection.delete('foo', done.bind(null, null))
      })
    })
  })

  it('should pass shared.basictest suite', function (done) {
    testcount++
    shared.basictest(seneca, done)
  })

  it('should pass shared.closetest suite', function (done) {
    shared.closetest(seneca, testcount, done)
  })
})