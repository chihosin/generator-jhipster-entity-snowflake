/* global describe, beforeEach, it */

const path = require('path');
const fse = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');

describe('JHipster generator entity-snowflake', () => {
    describe('Test entity id generator', () => {
        beforeEach((done) => {
            helpers
                .run(path.join(__dirname, '../generators/app'))
                .inTmpDir((dir) => {
                    fse.copySync(path.join(__dirname, '../test/templates'), dir);
                })
                .withOptions({
                    testmode: true
                })
                .withPrompts({
                    updateType: 'all'
                })
                .on('end', done);
        });

        it('generate SnowflakeIdGenerator.java file', () => {
            assert.file('src/main/java/org/bigbug/dummy/domain/id/SnowflakeIdGenerator.java');
        });

        it('modify Dummy.java id generator', () => {
            assert.fileContent('src/main/java/org/bigbug/dummy/domain/Dummy.java', 'import org.hibernate.annotations.GenericGenerator;');
            assert.fileContent('src/main/java/org/bigbug/dummy/domain/Dummy.java', '@GenericGenerator(name = "sequence", strategy = "org.bigbug.dummy.domain.id.SnowflakeIdGenerator")');
        });
    });
});
