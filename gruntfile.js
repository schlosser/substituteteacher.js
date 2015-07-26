/* global module */
"use strict";

module.exports = function (grunt) {
  grunt.initConfig({
    jasmine: {
      pivotal: {
        src: "src/substituteteacher.js",
        options: {
          specs: "test/*Spec.js",
          helpers: "test/*Helper.js"
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          "src/substituteteacher.min.js": ["src/substituteteacher.js"]
        }
      }
    }
  });
  grunt.loadNpmTasks("grunt-contrib-jasmine");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.registerTask("default", ["less"]);
};