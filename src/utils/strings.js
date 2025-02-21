/**
 * Takes in a string in snake case and converts it to start case
 * @param {string} str snake case string
 * @returns {string} start case string
 */
function snakeCaseToStartCase(str) {
  return str
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

export { snakeCaseToStartCase };
