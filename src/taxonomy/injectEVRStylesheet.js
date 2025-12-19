const BG_LEVEL_TEMPLATE = `.vista-evr-level-bg-$LEVEL {
      background: $COLOR !important;
  }`;

const FG_LEVEL_TEMPLATE = `.vista-evr-level-fg-$LEVEL {
      color: $COLOR !important;
  }`;

const BG_DEFAULT_TEMPLATE = `.vista-evr-default-bg {
      background: $COLOR !important;
  }`;

const FG_DEFAULT_TEMPLATE = `.vista-evr-default-fg {
      color: $COLOR !important;
  }`;

/**
 * Defines styles based on given configuration and injects them into head.
 * Will create css classes for default and for each level to be customized.
 * @private
 */
function injectEVRStylesheet(definitions) {
  const styles = [];

  if (definitions.evrDefaultForegroundColor) {
    styles.push(FG_DEFAULT_TEMPLATE.replace('$COLOR', definitions.evrDefaultForegroundColor));
  }

  if (definitions.evrDefaultBackgroundColor) {
    styles.push(BG_DEFAULT_TEMPLATE.replace('$COLOR', definitions.evrDefaultBackgroundColor));
  }

  if (definitions.evrBackgroundColorByLevel) {
    Object.keys(definitions.evrBackgroundColorByLevel).forEach((level) => {
      const levelColor = definitions.evrBackgroundColorByLevel[level];

      const style = BG_LEVEL_TEMPLATE.replace('$LEVEL', level.toLowerCase()).replace(
        '$COLOR',
        levelColor
      );

      styles.push(style);
    });
  }

  if (definitions.evrForegroundColorByLevel) {
    Object.keys(definitions.evrForegroundColorByLevel).forEach((level) => {
      const levelColor = definitions.evrForegroundColorByLevel[level];

      const style = FG_LEVEL_TEMPLATE.replace('$LEVEL', level.toLowerCase()).replace(
        '$COLOR',
        levelColor
      );

      styles.push(style);
    });
  }

  const cssText = styles.join('\n\n');
  const styleElement = document.createElement('style');

  styleElement.appendChild(document.createTextNode(cssText));
  document.querySelector('head').appendChild(styleElement);
}

export default injectEVRStylesheet;
