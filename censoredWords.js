const censoredWords = [
  'album',
  'cover',
  'vinyl',
  '[vinyl]',
  'usa',
  'import',
  '-',
  'lp',
  'smal2835'
];

var semiCensoredWords = [
  
]

for (var i = 1900; i < 2030; i++) {
  semiCensoredWords.push(i.toString); 
}


module.exports = {
  censoredWords: censoredWords
}