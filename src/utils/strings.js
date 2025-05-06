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
 * Formats an array of numbers into a human-readable string, showing ranges with ellipsis
 * and individual numbers with commas.
 * Examples:
 * [1,2,3,4,5] → "1...5"
 * [1,2,3,5,7,8,9] → "1...3, 5, 7...9"
 * [1,3,5,7] → "1, 3, 5, 7"
 * [1,2] → "1, 2"
 * @param {Array<number|string>} numbers - Array of numbers to format
 * @returns {string} Formatted string representation
 */
function formatNumberSequence(numbers, forFilename = false) {
  const sortedNumbers = numbers.map(Number).sort((a, b) => a - b);
  const rangeSeparator = forFilename ? '-' : '...';
  const commaSeparator = forFilename ? '_' : ', ';
  let result = `${sortedNumbers[0]}`;
  let rangeLength = 1;

  for (let i = 1; i < sortedNumbers.length; i++) {
    const current = sortedNumbers[i];
    const prev = sortedNumbers[i - 1];

    if (current === prev + 1) {
      rangeLength++;
    } else {
      if (rangeLength > 2) {
        result += `${rangeSeparator}${prev}`;
      } else if (rangeLength === 2) {
        result += `${commaSeparator}${prev}`;
      }

      result += `${commaSeparator}${current}`;
      rangeLength = 1;
    }
  }

  // Handle the last range if it exists
  if (rangeLength > 2) {
    result += `${rangeSeparator}${sortedNumbers[sortedNumbers.length - 1]}`;
  } else if (rangeLength === 2) {
    result += `${commaSeparator}${sortedNumbers[sortedNumbers.length - 1]}`;
  }

  return result;
}

export { snakeCaseToStartCase, formatNumberSequence };
