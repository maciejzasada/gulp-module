# gulp-module
Gulp support for submodules with namespaces and direct submodule execution.

## Installation
`npm install --save-dev gulp-module`

IMPORTANT: gulp-module needs to be installed locally for each module.

## Example project structure
```
project/ -
  gulpfile.js
  (...)
  module/ -
    gulpfile.js
    (...)
```

## Module definition
```javascript
module.exports = require('gulp-module').define('moduleName', function (gulp, runSequence) {
  // Regular gulpfile here.
  // Do not re-import gulp or runSequence, use the arguments instead.
  // Use regular task names, e.g. default, build, coffee.
};
```

## Task namespacing
All tasks are being automatically namespaced with the module name.
E.g. task `build` becomes `moduleName:build`.


## Importing modules
Modules can be imported in parent gulpfiles as any node module with `require`.

E.g. `require('./module/gulpfile.js');`

Then, tasks can be introduced in the parent's tasks as dependencies or in `runSequence` calls.


## Direct execution
Modules can be still executed directly with gulp. E.g.

```
$ cd project/module
gulp module:build
```
When executed directly, gulp-module adds a non-namespaced `default` task so you can still run a module with simply `gulp`.


### Example
I.e. `project/module/gulpfile.js` above.
```javascript
module.exports = require('gulp-module').define('module', function (gulp, runSequence) {

  gulp.task('coffee', function () {
    // task body.
  });

  gulp.task('compass', function () {
    // task body.
  });

  gulp.task('test', function () {
    // task body.
  });

  gulp.task('build', function (cb) {
    runSequence('clean', ['coffee', 'compass'], 'test', cb);
  });

  gulp.task('default', ['build']);

};
```

## License
MIT
