const censoredWords = [
  "album",
  "cover",
  "vinyl",
  "usa",
  "import",
  "lp",
  "cd",
  "soundtrack",
  "german import",
];

const fullCensoredWords = censoredWords.reduce(
  (a, c) => [...a, c, `(${c})`, `[${c}]`],
  []
);

module.exports = {
  censoredWords: fullCensoredWords,
};
