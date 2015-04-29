module.exports = (grunt) ->

  grunt.initConfig

    connect:
      server:
        options:
          port: 8888

    watch:
      src:
        files: ['src/*.coffee'],
        tasks: ['shell:build-src']
        options:
          livereload: true
      test:
        files: ['test/*.ts', "ts/*.d.ts"],
        tasks: ['shell:build-test']
        options:
          livereload: true

    shell:
      "build-src":
        command: -> "npm run build-src"
      "build-test":
        command: -> "npm run build-test"

  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-shell'

  grunt.registerTask 'default', ['connect', 'watch']
