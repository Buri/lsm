#!/usr/bin/env node

var cli = require('commander'),
        chalk = require('chalk'),
        fs = require('fs'),
        ejs = require('ejs'),
        config = require('./config.json'),
        exec = require('child_process').exec


cli.version('0.0.4')
        .option('--root-directory <dir>', 'Path to directory to work in', config.rootDir)
        .option('--hosts-file <hosts-file>', 'Path to /etc/hosts file', config.hostsFile)
        .option('--apache-dir <directory>', 'apache config directory', config.apacheDir)
        .option('-n', '--nette', 'Use /www subdirectory on hosts file');
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
            name += '.local';
            if (!directory) {
                directory = cli.rootDirectory + '/' + name;
            }
            console.log(chalk.green('Create directory: ') + directory);
            var err = false; //fs.mkdirSync(mkdir);
            if(err){
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
            console.log(chalk.green('Add entry to hosts file: ') + cli.hostsFile);
            err = fs.appendFileSync(cli.hostsFile, '127.0.0.1\t' + name + '\n');
            if(err){
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
            var siteEnabled = cli.apacheDir + '/sites-available/' + name + '.conf';
            console.log(chalk.green('Create vhosts file: ') + siteEnabled);
            var template = new String(fs.readFileSync('virtualhost.conf'));
            var vhost = ejs.render(template, {
                sitepath:directory,
                sitename:name
            });
            err = fs.writeFileSync(siteEnabled, vhost);
            if(err){
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
            console.log(chalk.green('Enable site: ') + name);
            exec('a2ensite ' + name);
            console.log(chalk.green('Reload apache service'));
            exec('service apache2 reload');
            
            // @todo: add setup for mysql
            //
        });
cli.command('domain2local <name>')
        .description('route domain name to 127.0.0.1')
        .action(function (name) {
            name += '.local';
            console.log(chalk.green('Add entry to hosts file: ') + cli.hostsFile);
            err = fs.appendFileSync(cli.hostsFile, '127.0.0.1\t' + name + '\n');
            if(err){
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
        });
cli.parse(process.argv);
