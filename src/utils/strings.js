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

/**
 * Formats multiple session numbers into a string
 * @param {Array<string>} sessionNumbers - Array of session numbers
 * @returns {string} Formatted string of session numbers
 */
function formatMultipleSessionNumbers(sessionNumbers) {
  if (sessionNumbers.length === 2) {
    return `${sessionNumbers[0]} and ${sessionNumbers[1]}`;
  }

  const sortedNumbers = sessionNumbers.map(Number).sort((a, b) => a - b);
  let result = `${sortedNumbers[0]}`;
  let rangeLength = 1;

  for (let i = 1; i < sortedNumbers.length; i++) {
    const current = sortedNumbers[i];
    const prev = sortedNumbers[i - 1];

    if (current === prev + 1) {
      rangeLength++;
    } else {
      if (rangeLength > 2) {
        result += `...${prev}`;
      }
      result += `, ${current}`;
      rangeLength = 1;
    }
  }

  // Handle the last range if it exists
  if (rangeLength > 2) {
    result += `...${sortedNumbers[sortedNumbers.length - 1]}`;
  }

  return result;
}

export { snakeCaseToStartCase, formatMultipleSessionNumbers };
