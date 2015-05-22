/* global module */
"use strict";

module.exports = function (grunt) {
  grunt.initConfig({
    jasmine: {
      pivotal: {
        src: "src/replace.js",
        options: {
          specs: "test/*Spec.js",
          helpers: "test/*Helper.js"
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          "src/replace.min.js": ["src/replace.js"]
        }
      }
    }
  });
  grunt.loadNpmTasks("grunt-contrib-jasmine");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.registerTask("default", ["less"]);
};