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

*Returns:* {String} module name (namespace).

## Task namespacing
All tasks are being automatically namespaced with the module name.
E.g. task `build` becomes `moduleName:build`.


## Importing modules
Modules can be imported in parent gulpfiles using the `gulpModule.load` to load a specific gulpfile.js or `gulpModule.loadAll` to recursively load all modules in a specific directory.
Both need to be passed a reference to the parent's `gulp` instance.

```javascript
var gulp = require('gulp'),
  gulpModule = require('gulp-module');

gulpModule.loadAll('modules', gulp);
// or
gulpModule.load('modules/desktop/gulpfile.js', gulp);
```

Then, tasks can be introduced in the parent's tasks as dependencies or in `runSequence` calls.

## Getting submodule task names
Tasks from within the submodules are namespaced with the module name and the separator between the namespace and the task name being a `:`.

However, it is safer to query a child task using the provided `gulpModule.tasks` function.

The `gulpModule.tasks` function also provides a `minimatch` filter so you can even query a group of all loaded tasks.

E.g.
```javascript
gulpModule.tasks('build', 'desktop');  // returns ['desktop:build']
gulpModule.tasks('clean', '*');  // returns clean task in all loaded namespaces, e.g. ['desktop:clean', 'mobile:clean']
gulpModule.tasks(['coffee', 'sass'], 'mobile');  // returns ['mobile:coffee', 'mobile:sass']
```


## Direct module execution
Modules can be still executed directly with gulp. E.g.

```
$ cd project/module
gulp module:build
```
When executed directly, gulp-module adds a non-namespaced `default` task so you can still run a module with simply `gulp`. All other tasks need to be run with a correct namespace, i.e. a defined `clean` task becomes `moduleName:clean` no matter if the module is run directly or if it is imported.


### Example module definition
I.e. `project/module/gulpfile.js` above.
```javascript
module.exports = require('gulp-module').define('module', function (gulp, runSequence) {

  gulp.task('coffee', function () {
    // Becomes 'module:coffe'
  });

  gulp.task('compass', function () {
    // Becomes 'module:compass'
  });

  gulp.task('test', function () {
    // Becomes 'module:test'
  });

  gulp.task('build', function (cb) {
    // Becomes 'module:build'
    // runSequence can still use non-namespaced tasks within module definition
    // and will namespace them automatically at runtime.
    runSequence('clean', ['coffee', 'compass'], 'test', cb);
  });

  gulp.task('default', ['build']);  // Becomes 'module:default'.
  // In direct execution additional task 'default' is defined that runs a
  // 'module:default' task as a dependency.

};
```

## License
MIT
