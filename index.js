/**
 * @author Maciej Zasada <hello@maciejzasda.com>
 * @license MIT
 */

var path = require('path'),
  glob = require('glob'),
  minimatch = require('minimatch'),

  SEPARATOR = ':',

  namespaces = [],
  loadedNamespaces = [];


module.exports = {
  SEPARATOR: SEPARATOR,

  load: function (gulpfilePath, gulp) {
    var namespace = require(gulpfilePath)(gulp);
    loadedNamespaces.push(namespace);
    console.log('[gulp-module] loaded module:', namespace);
  },

  loadAll: function (folderPath, gulp) {
    var moduleGulpfiles = glob.sync(path.resolve(path.join(folderPath, '/*(!(node_modules))/gulpfile.js'))),
      i;
    for (i = 0; i < moduleGulpfiles.length; ++i) {
      this.load(moduleGulpfiles[i], gulp);
    }
  },

  tasks: function (name, moduleFilter) {
    if (typeof name === 'string') {
      moduleFilter = moduleFilter || '*';
      return loadedNamespaces.map(function (namespace) {
        if (minimatch(namespace, moduleFilter)) {
          return namespace + SEPARATOR + name;
        }
      }).filter(function (item) {
        return !!item;
      });
    } else {
      var result = [], i;
      for (i = 0; i < name.length; ++i) {
        result = result.concat(this.tasks(name[i], moduleFilter));
      }
      return result;
    }
  },

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
        return originalGulpTask.apply(this, shimmedArgs);
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

      // Return the namespace name.
      return namespace;
    };

    // Return or execute depending on whether the module is imported or run directly.
    if (module.parent.parent.filename.indexOf('gulp-module/index.js') === -1) {
      var gulp = require('gulp'),
        runSequence = require('run-sequence').use(gulp);
      namespacedModuleDefinition(gulp, runSequence);
      gulp.task('default', [ns('default')]);
    } else {
      return namespacedModuleDefinition;
    }
  }
};
