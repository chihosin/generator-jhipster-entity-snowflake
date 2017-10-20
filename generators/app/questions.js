const askForReplaceIdG = function () {
    const prompts = [
        {
            type: 'list',
            name: 'updateType',
            message: 'so you wanner remake all your entities\' id with snowflake?',
            choices: [{
                name: 'en, all',
                value: 'all'
            }, {
                name: 'no, let me select them',
                value: 'selected'
            }],
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
        this.updateType = props.updateType;
        this.auditedEntities = props.auditedEntities;
        done();
    });
};

module.exports = {
    askForReplaceIdG
};
