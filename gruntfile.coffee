module.exports = (grunt) ->

  grunt.initConfig

    connect:
      server:
        options:
          port: 8888
          livereload: true

    watch:
      scripts:
        files: ['**/*.coffee'],
        tasks: ['shell:build']

    shell:
      build:
        command: -> "npm run build"

  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-shell'

  grunt.registerTask 'default', ['connect', 'watch']
