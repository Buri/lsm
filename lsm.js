#!/usr/bin/env node

/* Require block */
var cli = require('commander'),
        chalk = require('chalk'),
        fs = require('fs'),
        ejs = require('ejs'),
        config = require('./config.json'),
        exec = require('child_process').exec,
        package = require('./package.json'),
        crypto = require('crypto'),

        /* Function definition block */
        randomString = function (length) {
            if (!length) {
                length = 48;
            }
            var buf = crypto.randomBytes(length);
            return buf.toString('hex');
        },
        addEntryToHostsFile = function(name){
            name += '.local';
            console.log(chalk.green('Add entry to hosts file: ') + cli.hostsFile);
            err = fs.appendFileSync(cli.hostsFile, '127.0.0.1\t' + name + '\n');
            if (err) {
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
        };

cli.version(package.version)
        .option('--root-directory <dir>', 'Path to directory to work in', config.rootDir)
        .option('--hosts-file <hosts-file>', 'Path to /etc/hosts file', config.hostsFile)
        .option('--apache-dir <directory>', 'apache config directory', config.apacheDir)
        .option('--nette', 'Use /www subdirectory on hosts file')
        .option('--user <user>', 'User to change ownership to', config.user)
        .option('--group <group>', 'Group to change ownership to', config.group)
cli.command('link-binary [path]')
        .description('Use LSM as system binary (/usr/local/bin/lsm)')
        .option('--path <target>', 'Location to link binary to', config.sysBin)
        .action(function (path) {
            if (!path) {
                path = cli.path;
            }
            console.log(chalk.green('Current binary: ') + __filename);
            console.log(chalk.green('Targtet link: ') + path);
            console.log(chalk.green('Linking...'));
            fs.symlink(__filename, path, function (err) {
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
            var originalName = name;
            name += '.local';
            if (!directory) {
                directory = cli.rootDirectory + '/' + name;
            }
            /* Create document root for site */
            console.log(chalk.green('Create directory: ') + directory);
            var err = fs.mkdirSync(directory);
            if (err) {
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
            exec('chown ' + cli.user + ':' + cli.group + ' ' + directory);
            /* Add entry to hosts file */
            addEntryToHostsFile(originalName);
            /* Create VirtualHost file */
            var siteEnabled = cli.apacheDir + '/sites-available/' + name + '.conf';
            console.log(chalk.green('Create vhosts file: ') + siteEnabled);
            var template = fs.readFileSync(__dirname + '/templates/virtualhost.conf', {encoding:'UTF8'});
            var vhost = ejs.render(template, {
                sitepath: directory,
                sitename: name
            });
            err = fs.writeFileSync(siteEnabled, vhost);
            if (err) {
                console.log(chalk.red('Failed: ') + err.code + ' ' + err.path);
                process.exit(err.errno);
            }
            /* Enable site */
            console.log(chalk.green('Enable site: ') + name);
            exec('a2ensite ' + name);
            console.log(chalk.green('Reload apache service'));
            exec('service apache2 reload');
            /* Create new MySQL database */
            console.log(chalk.green('Create sql database: ') + originalName);
            console.log(chalk.green('Set up user: ') + originalName);
            var sqlTmpFile = '/tmp/' + randomString(), params = {
                name:originalName,
                password:randomString(16)
            };
            console.log(chalk.green('Identified by password: ') + params.password);
            var sqlTemplate = fs.readFileSync(__dirname + '/templates/create_database.sql', {encoding:'UTF8'}),
            sqlParsed = ejs.render(sqlTemplate, params);
            fs.writeFileSync(sqlTmpFile, sqlParsed);
            exec('mysql -u root < ' + sqlTmpFile);
            fs.unlinkSync(sqlTmpFile);
        });
cli.command('domain2local <name>')
        .description('route domain name to 127.0.0.1')
        .action(addEntryToHostsFile);
cli.parse(process.argv);
