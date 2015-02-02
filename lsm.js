#!/usr/bin/env node

var cli = require('commander'),
        chalk = require('chalk'),
        fs = require('fs')
config = require('./config.json')


cli.version('0.0.3')
        .option('--root-directory <dir>', 'Path to directory to work in', config.rootDir)
        .option('--hosts-file <hosts-file>', 'Path to /etc/hosts file', config.hostsFile)
        .option('--apache-dir', 'apache config directory', config.apacheDir)
cli.command('link-binary [path]')
        .description('Use LSM as system binary (/usr/local/bin/lsm)')
        .action(function (path) {
            if (!path) {
                path = config.sysBin;
            }
            console.log(chalk.green('Current binary: ') + process.argv[1]);
            console.log(chalk.green('Targtet link: ') + path);
            console.log(chalk.green('Linking...'));
            fs.symlink(process.argv[1], path, function (err) {
                if (err) {
                    console.log(chalk.red('Linking failed: ' + err.code + ' ' + err.path));
                    process.exit(err.errno);
                }
                console.log(chalk.green('DONE!'));
            });
        });
cli.command('add <name> [directory]')
        .alias('create')
        .description('haha')
        .action(function (name, directory) {
            if (!directory) {
                directory = cli.rootDirectory + '/' + name;
            }
            console.log(chalk.green('Create directory: ') + directory);
            var err = fs.mkdirSync(mkdir);
            if(err){
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
            console.log(chalk.green('Add entry to hosts file: ') + cli.hostsFile);
            var err = fs.appendFileSync(cli.hostsFile, '\n127.0.0.1\t' + name + '\n');
            if(err){
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
            
        });

cli.parse(process.argv);
