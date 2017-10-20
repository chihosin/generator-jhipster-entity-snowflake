const chalk = require('chalk');
const packagejs = require('../../package.json');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');

const fs = require('fs');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterAppConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Can\'t read .yo-rc.json');
                }
            },
            displayLogo() {
                // it's here to show that you can use functions from generator-jhipster
                // this function is in: generator-jhipster/generators/generator-base.js
                // this.printJHipsterLogo();

                // Have Yeoman greet the user.
                this.log(`\nWelcome to the ${chalk.bold.yellow('JHipster entity-snowflake')} generator! ${chalk.yellow(`v${packagejs.version}\n`)}`);
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(`\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`);
                }
            },
            getEntitityNames() {
                const existingEntities = [];
                const existingEntityChoices = [];
                let existingEntityNames = [];

                try {
                    existingEntityNames = fs.readdirSync('.jhipster');
                } catch (e) {
                    this.error(`i can't find your .jhipster file`);
                }

                existingEntityNames.forEach((entry) => {
                    if (entry.indexOf('.json') !== -1) {
                        const entityName = entry.replace('.json', '');
                        existingEntities.push(entityName);
                        existingEntityChoices.push({
                            name: entityName,
                            value: entityName
                        });
                    }
                });
                this.existingEntities = existingEntities;
                this.existingEntityChoices = existingEntityChoices;

                if (existingEntities.length <= 0) {
                    this.error(`i can't find any entity`);
                }
            }
        };
    }

    prompting() {
        const prompts = [
            {
                type: 'list',
                name: 'updateType',
                message: `so you wanner remake all your entities' id with snowflake?`,
                choices: [{
                    name: 'en, all',
                    value: 'all'
                },
                    {
                        name: 'no, let me select them',
                        value: 'selected'
                    }
                ],
                default: 'all'
            },
            {
                when: response => response.updateType !== 'all',
                type: 'checkbox',
                name: 'auditedEntities',
                message: 'select yourself, heh',
                choices: this.existingEntityChoices,
                default: 'none'
            }
        ];

        const done = this.async();
        this.prompt(prompts).then((props) => {
            this.props = props;
            this.updateType = props.updateType
            this.auditedEntities = props.auditedEntities;
            // this.log(props)

            done();
        });
    }

    writing() {
        // read config from .yo-rc.json
        this.baseName = this.jhipsterAppConfig.baseName;
        this.packageName = this.jhipsterAppConfig.packageName;
        this.packageFolder = this.jhipsterAppConfig.packageFolder;
        this.clientFramework = this.jhipsterAppConfig.clientFramework;
        this.clientPackageManager = this.jhipsterAppConfig.clientPackageManager;
        this.buildTool = this.jhipsterAppConfig.buildTool;


        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

        //替换entitiy部分
        if (this.updateType == 'all') {
            this.auditedEntities = this.existingEntities;
        }
        this.auditedEntities.forEach((entityName) => {
            let entityPath = `${javaDir}domain/${entityName}.java`;
            let lineFeed = '\n    ';

            let sourceStr = '@GeneratedValue(strategy = GenerationType.IDENTITY)';
            let targetStr = `@GenericGenerator(name = "sequence", strategy = "${this.packageName}.domain.id.SnowflakeIdGenerator")`
                + lineFeed
                + `@GeneratedValue(generator = "sequence")`;

            let flagImport = `import javax.persistence.*;`;
            let GenericGeneratorPackage = `import org.hibernate.annotations.GenericGenerator;`;

            let entityInfo = this.fs.read(entityPath, {defaults: ''});
            if (entityInfo.includes(sourceStr)) {
                this.replaceContent(entityPath, sourceStr, targetStr);
            }
            if (entityInfo.includes(flagImport)) {
                this.replaceContent(entityPath, flagImport, flagImport + '\n' + GenericGeneratorPackage);
            }
        });

        //使用模板文件
        this.template('_SnowflakeIdGenerator.java', `${javaDir}/domain/id/SnowflakeIdGenerator.java`);
    }

    install() {
        let logMsg =
            `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

        if (this.clientFramework === 'angular1') {
            logMsg =
                `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
        }
        const injectDependenciesAndConstants = (err) => {
            if (err) {
                this.warning('Install of dependencies failed!');
                this.log(logMsg);
            } else if (this.clientFramework === 'angular1') {
                this.spawnCommand('gulp', ['install']);
            }
        };
        const installConfig = {
            bower: this.clientFramework === 'angular1',
            npm: this.clientPackageManager !== 'yarn',
            yarn: this.clientPackageManager === 'yarn',
            callback: injectDependenciesAndConstants
        };
        if (this.options['skip-install']) {
            this.log(logMsg);
        } else {
            this.installDependencies(installConfig);
        }
    }

    end() {
        this.log('End of entity-snowflake generator');
    }
};
