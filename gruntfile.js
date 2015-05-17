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
    }
  });
  grunt.loadNpmTasks("grunt-contrib-jasmine");
  grunt.registerTask("default", ["less"]);
};