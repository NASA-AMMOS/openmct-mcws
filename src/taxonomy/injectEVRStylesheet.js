define([], function () {

    var BG_LEVEL_TEMPLATE = `.vista-evr-level-bg-$LEVEL {
        background: $COLOR !important;
    }`;

    var FG_LEVEL_TEMPLATE = `.vista-evr-level-fg-$LEVEL {
        color: $COLOR !important;
    }`;

    var BG_DEFAULT_TEMPLATE = `.vista-evr-default-bg {
        background: $COLOR !important;
    }`;

    var FG_DEFAULT_TEMPLATE = `.vista-evr-default-fg {
        color: $COLOR !important;
    }`;


    /**
     * Defines styles based on given configuration and injects them into head.
     * Will create css classes for default and for each level to be customized.
     * @private
     */
    function injectEVRStylesheet(definitions) {
        var styles = [];

        if (definitions.evrDefaultForegroundColor) {
            styles.push(FG_DEFAULT_TEMPLATE.replace(
                '$COLOR',
                definitions.evrDefaultForegroundColor
            ));
        }

        if (definitions.evrDefaultBackgroundColor) {
            styles.push(BG_DEFAULT_TEMPLATE.replace(
                '$COLOR',
                definitions.evrDefaultBackgroundColor
            ));
        }

        if (definitions.evrBackgroundColorByLevel) {
            Object.keys(definitions.evrBackgroundColorByLevel)
                .forEach(function (level) {
                    var levelColor = definitions
                        .evrBackgroundColorByLevel[level];

                    var style = BG_LEVEL_TEMPLATE
                        .replace('$LEVEL', level.toLowerCase())
                        .replace('$COLOR', levelColor);

                    styles.push(style);
                })
        }

        if (definitions.evrForegroundColorByLevel) {
            Object.keys(definitions.evrForegroundColorByLevel)
                .forEach(function (level) {
                    var levelColor = definitions
                        .evrForegroundColorByLevel[level];

                    var style = FG_LEVEL_TEMPLATE
                        .replace('$LEVEL', level.toLowerCase())
                        .replace('$COLOR', levelColor);

                    styles.push(style);
                })
        }

        var cssText = styles.join('\n\n');
        var styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.appendChild(document.createTextNode(cssText));
        document.querySelector('head').appendChild(styleElement);
    }

    return injectEVRStylesheet;

});

