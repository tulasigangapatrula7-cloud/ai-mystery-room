// client/src/constants.js
// Shared values used by several pages.
// (The server has its own copy and is the real authority. These are for display and form checks only.)

export const DIFFICULTIES = [
  {
    id: "easy",
    name: "Easy",
    suspects: 3,
    clues: 5,
    hints: 2,
    base: 100,
    blurb: "A gentle first case. Few suspects and a clear trail to follow.",
  },
  {
    id: "medium",
    name: "Medium",
    suspects: 4,
    clues: 7,
    hints: 3,
    base: 150,
    blurb: "A proper puzzle. Red herrings start to appear.",
  },
  {
    id: "hard",
    name: "Hard",
    suspects: 5,
    clues: 9,
    hints: 3,
    base: 200,
    blurb: "For seasoned detectives. Many suspects and plenty of distractions.",
  },
];

export const PREMISE_MIN = 10;
export const PREMISE_MAX = 300;
export const EXPLANATION_MAX = 500;

export const EXAMPLES = [
  "A priceless painting vanishes during a charity gala at a seaside mansion",
  "A famous chef's secret recipe book disappears on the night of a big food festival",
  "A rare violin is stolen backstage just before the village concert",
  "Someone sabotages the experiment at a remote Arctic research station",
  "A famous author's final manuscript goes missing from a snowed-in mountain cabin",
  "The winning lottery ticket vanishes from a small-town bakery",
];
