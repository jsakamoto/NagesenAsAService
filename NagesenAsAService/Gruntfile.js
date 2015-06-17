module.exports = function (grunt) {
    grunt.initConfig({
        // configuration for ts
        ts: {
            options: {
                target: 'es5',
                module: 'commonjs',
                noImplicitAny: true,
                removeComments: true,
                sourceMap: true
            },
            main: {
                src: ['**/*.ts', '!node_modules/**/*.ts', '!**/typings/**/*.ts', '!**/*.d.ts'],
                outDir: '.'
            }
        },

        // configuration for bower
        pkg: grunt.file.readJSON("package.json"),
        bower: {
            install: {
                options: {
                    verbose: true,
                    install: true,
                    targetDir: '.',
                    layout: function (type, component) {
                        if (type === 'css') {
                            return 'Content';
                        }
                        else {
                            return 'Scripts';
                        }
                    }
                }
            }
        },

        // configuration for tsd
        tsd: {
            install: {
                options: {
                    command: 'reinstall',
                    latest: false,
                    config: './tsd.json'
                }
            }
        },

        watch: {
            files: ['**/*.ts'],
            tasks: ['ts:main']
        }
    });

    grunt.registerTask('default', ['ts:main']);
    grunt.registerTask('setup', ['bower', 'tsd']);

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-tsd');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
