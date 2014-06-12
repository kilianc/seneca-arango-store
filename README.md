# seneca-arango-store

[Seneca](http://senecajs.org/) storage plugin for [ArangoDB](https://www.arangodb.org).

This plugin allows you to use ArangoDB as storage for your application ActiveRecord style. You can read more [here](http://senecajs.org/data-entities.html) about internals and specifications.

** This module is not ready for production use yet **

## Install

    $ npm install --save seneca-arango-store

## Example
```js
var seneca = require('seneca')()

seneca.use('arango-store', 'http://localhost:8529')

seneca.ready(function(){
  var hero = seneca.make$('avengers')
  hero.name  = 'Tony'
  hero.quality = 'badass'

  hero.save$(function (err, apple) {
    console.log(hero.id)
  })
})
```

## Methods

Read [here](http://senecajs.org/data-entities.html) for more docs.

```js
var entity = seneca.make('typename')
entity.foo = 'bar'
entity.bar = ['doh!']

entity.save$(function (err, entity) {
  // done
})

//retrieve a document from the storage
entity.load$({ id: ... }, function (err, newEntity) {
  // entity is untouched and newEntity is a new instance
})

// like load but with a result set
entity.list$({ foo: 'something' }, function (err, entities) {
  // entities is an array of entities
})

entity.remove$({ id: ... }, function (err,entity) {
  // removes one or more documents from the storage
})
```

# How to contribute

__seneca-arango-store__ follows the awesome [Vincent Driessen](http://nvie.com/about/) [branching model](http://nvie.com/posts/a-successful-git-branching-model/).

* You must add a new feature on his own topic branch
* You must contribute to hot-fixing directly into the master branch (and pull-request to it)

seneca-arango-store follows (more or less) the [Felix's Node.js Style Guide](http://nodeguide.com/style.html), your contribution must be consistent with this style.

The test suite is written on top of [visionmedia/mocha](http://visionmedia.github.com/mocha/) and it took hours of hard work. Please use the tests to check if your contribution is breaking some part of the library and add new tests for each new feature.

    $ npm test

## License

_This software is released under the MIT license cited below_.

    Copyright (c) 2014 Kilian Ciuffolo, me@nailik.org. All Rights Reserved.

    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the 'Software'), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:

    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
