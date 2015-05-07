module.exports = (grunt) ->

  grunt.initConfig

    connect:
      server:
        options:
          port: 8888

    watch:

      "src-cs":
        files: ['src/*.coffee'],
        tasks: ['shell:build-src-cs']
        options:
          livereload: true

      "src-ts":
        files: ['src/*.ts'],
        tasks: ['shell:build-src-ts']
        options:
          livereload: true
      test:
        files: ['test/*.ts', "tsd/**/*.d.ts"],
        tasks: ['shell:build-test']
        options:
          livereload: true

    shell:
      "build-src-cs":
        command: -> "npm run build-src-cs"
      "build-src-ts":
        command: -> "npm run build-src-ts"
      "build-test":
        command: -> "npm run build-test"

  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-shell'

  grunt.registerTask 'default', ['connect']
