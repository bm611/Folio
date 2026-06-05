const crypto = require('crypto');

function getNoteTitle(n) {
  return n.title || 'Untitled';
}

function generateNotes(count) {
  const notes = [];
  for (let i = 0; i < count; i++) {
    notes.push({
      id: crypto.randomUUID(),
      title: `Note ${i} test`,
      deletedAt: null,
      updatedAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    });
  }
  return notes;
}

const N = 50000;
const M = 1000;
const notes = generateNotes(N);
const mentionedNotes = [];
for (let i = 0; i < M; i++) {
    mentionedNotes.push(notes[Math.floor(Math.random() * N)]);
}

const mentionQuery = 'test';

console.time('Baseline O(N*M)');
const res1 = notes
    .filter((n) => !n.deletedAt)
    .filter((n) => {
      const title = getNoteTitle(n).toLowerCase()
      return title.includes(mentionQuery.toLowerCase())
    })
    .filter((n) => !mentionedNotes.find((m) => m.id === n.id))
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || '') || 0
      const bTime = Date.parse(b.updatedAt || '') || 0
      return bTime - aTime
    })
    .slice(0, 8);
console.timeEnd('Baseline O(N*M)');

console.time('Optimized O(N+M)');
const mentionedIds = new Set(mentionedNotes.map(m => m.id));
const res2 = notes
    .filter((n) => !n.deletedAt)
    .filter((n) => {
      const title = getNoteTitle(n).toLowerCase()
      return title.includes(mentionQuery.toLowerCase())
    })
    .filter((n) => !mentionedIds.has(n.id))
    .sort((a, b) => {
      const aTime = Date.parse(a.updatedAt || '') || 0
      const bTime = Date.parse(b.updatedAt || '') || 0
      return bTime - aTime
    })
    .slice(0, 8);
console.timeEnd('Optimized O(N+M)');
