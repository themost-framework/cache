module.exports = function (api) {
    api.cache(false);
    return {
        "sourceMap": "both",
        "retainLines": true,
        "presets": [
            [
                "@babel/preset-env",
                {
                    "targets": {
                        "node": "current"
                    }
                }
            ]
        ]
    }
};
