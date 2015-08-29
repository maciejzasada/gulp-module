/**
 * @author Maciej Zasada <hello@maciejzasda.com>
 * @license MIT
 */

var namespaces = [];

module.exports = {
  define: function (namespace, definition, directExecution) {
    var separator = ':';

    function isArray(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }

    function ns(name) {
      if (directExecution && name === 'default') {
        return name;
      }
      return namespace + separator + name;
    }

    function nsArrayRecursive(arr) {
      return arr.map(function (item) {
        if (typeof item === 'string') {
          return ns(item);
        } else if(isArray(item)) {
          return nsArrayRecursive(item);
        } else {
          return item;
        }
      });
    }

    var namespacedModuleDefinition = function (gulp, runSequence) {

      // Register namespace.
      namespaces.push(namespace);

      // Define gulp and runSequence.
      gulp = gulp || require('gulp');
      runSequence = runSequence || require('run-sequence').use(gulp);

      // Save references to original functions.
      var originalGulpTask = gulp.task;

      // Shim tasks.
      gulp.task = function (taskName) {
        var deps = [], task, shimmedArgs;
        if (isArray(arguments[1])) {
          deps = arguments[1];
          if (arguments.length > 2) {
            task = arguments[2];
          }
        } else if (arguments.length > 1) {
          task = arguments[1];
        }
        deps = deps.map(function (item) {
          return ns(item);
        });
        shimmedArgs = [ns(taskName), deps];
        if (task) {
          shimmedArgs.push(task);
        }
        originalGulpTask.apply(this, shimmedArgs);
      };

      var shimmedRunSequence = function () {
        var shimmedArgs = [], i, arg;
        for (i = 0; i < arguments.length; ++i) {
          arg = arguments[i];
          if (typeof arg === 'string') {
            shimmedArgs.push(ns(arg));
          } else if (isArray(arg)) {
            shimmedArgs.push(nsArrayRecursive(arg));
          } else if (typeof arg === 'function' && i === arguments.length - 1) {
            shimmedArgs.push(arg);
          } else {
            throw new Error('Unsupported runSequence() construct.');
          }
        }
        runSequence.apply(runSequence, shimmedArgs);
      };

      // Define tasks.
      definition(gulp, shimmedRunSequence);

      // Restore original functions.
      gulp.task = originalGulpTask;

      // Deregister namespace.
      namespaces.pop();
    };

    // Return or execute depending on whether the module is imported or run directly.
    if (module.parent.parent.filename.indexOf('gulpfile.js') === -1) {
      var gulp = require('gulp'),
        runSequence = require('run-sequence').use(gulp);
      namespacedModuleDefinition(gulp, runSequence);
      gulp.task('default', [ns('default')]);
    } else {
      return namespacedModuleDefinition;
    }
  }
};