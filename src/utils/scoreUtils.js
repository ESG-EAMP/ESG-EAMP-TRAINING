/**
 * Utility functions for score-related operations
 */

/**
 * Get color class for score display
 * Based on ESG Scoring Methodology:
 * - 0%: Yet to Start
 * - 1-30%: Basic
 * - 31-50%: Developing
 * - 51-80%: Intermediate
 * - 81-100%: Advanced
 * @param {number|string} score - The score value
 * @returns {string} Bootstrap color class
 */
export const getScoreColor = (score) => {
    if (!score && score !== 0) return 'text-muted';
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 'text-muted';
    if (numScore === 0 || (numScore > 0 && numScore < 1)) return 'text-muted'; // Yet to Start (0 or 0-1)
    if (numScore >= 81 && numScore <= 100) return 'text-success'; // Advanced (81-100%)
    if (numScore >= 51 && numScore < 81) return 'text-warning'; // Intermediate (51-80%)
    if (numScore >= 31 && numScore < 51) return 'text-orange'; // Developing (31-50%)
    if (numScore >= 1 && numScore < 31) return 'text-danger'; // Basic (1-30%)
    return 'text-muted';
};

/**
 * Get badge color class for score display
 * Based on ESG Scoring Methodology:
 * - 0%: Yet to Start
 * - 1-30%: Basic
 * - 31-50%: Developing
 * - 51-80%: Intermediate
 * - 81-100%: Advanced
 * @param {number|string} score - The score value
 * @returns {string} Bootstrap badge color class
 */
export const getScoreBadge = (score) => {
    if (!score && score !== 0) return 'bg-secondary';
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 'bg-secondary';
    if (numScore === 0 || (numScore > 0 && numScore < 1)) return 'bg-dark'; // Yet to Start (0 or 0-1)
    if (numScore >= 81 && numScore <= 100) return 'bg-success'; // Advanced (81-100%)
    if (numScore >= 51 && numScore < 81) return 'bg-info'; // Intermediate (51-80%)
    if (numScore >= 31 && numScore < 51) return 'bg-warning'; // Developing (31-50%)
    if (numScore >= 1 && numScore < 31) return 'bg-danger'; // Basic (1-30%)
    return 'bg-secondary';
};

/**
 * Get progress bar color class for score display
 * Based on ESG Scoring Methodology:
 * - 0%: Yet to Start
 * - 1-30%: Basic
 * - 31-50%: Developing
 * - 51-80%: Intermediate
 * - 81-100%: Advanced
 * @param {number|string} score - The score value
 * @returns {string} Bootstrap progress bar color class
 */
export const getProgressBarColor = (score) => {
    if (!score && score !== 0) return 'bg-secondary';
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 'bg-secondary';
    if (numScore === 0 || (numScore > 0 && numScore < 1)) return 'bg-dark'; // Yet to Start (0 or 0-1)
    if (numScore >= 81 && numScore <= 100) return 'bg-success'; // Advanced (81-100%)
    if (numScore >= 51 && numScore < 81) return 'bg-info'; // Intermediate (51-80%)
    if (numScore >= 31 && numScore < 51) return 'bg-warning'; // Developing (31-50%)
    if (numScore >= 1 && numScore < 31) return 'bg-danger'; // Basic (1-30%)
    return 'bg-secondary';
};

