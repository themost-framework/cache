module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current'
                }
            }
        ]
    ],
    plugins: [
        [
            '@babel/plugin-proposal-decorators', {
                "decoratorsBeforeExport": true,
                "loose": true
            }
        ],
        ["@babel/plugin-proposal-class-properties", { "loose" : true }]
    ]
};
