module.exports = (grunt) ->
  grunt.loadNpmTasks('grunt-contrib')
  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-espower')

  grunt.initConfig
    coffee:
      compileSrc:
        files:
          'release/Shell.js': [
            'src/SurfaceUtil.coffee'
            'src/Surface.coffee'
            'src/Shell.coffee']
      compileTest:
        files:
          'tests/tests.js': ['tests/*.coffee']

    watch:
      src:
        files: ["src/**/*.coffee"]
        tasks: ["compileSrc"]
      test:
        files: ["tests/**/*.coffee"]
        tasks: ["compileTest"]
      all:
        files: ["*.coffee"]
        tasks: ["compileSrc", "compileTest"]

    connect:
      server:
        options:
          hostname: "localhost"
          port: 18888
          base: './'

  grunt.registerTask("run", [
    "connect",
    "watch"])
  grunt.registerTask("compileSrc", [
    "coffee:compileSrc"])
  grunt.registerTask("compileTest", [
    "coffee:compileTest"])
  grunt.registerTask("make", [
    "compileSrc",
    "compileTest"])
  grunt.registerTask("default", [
    "make"])
