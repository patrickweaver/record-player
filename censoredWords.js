const censoredWords = [
  'album',
  'cover',
  'vinyl',
  '[vinyl]',
  'usa',
  'import',
  'lp',
  '[lp]',
  'cd',
  '[cd]',
  'soundtrack'
];


// This isn't used right now
// But maybe it's a good idea to ignore years because
// The google vision API was including release years a lot
var semiCensoredWords = [
  
]

for (var i = 1900; i < 2030; i++) {
  semiCensoredWords.push(i.toString); 
}


module.exports = {
  censoredWords: censoredWords
}