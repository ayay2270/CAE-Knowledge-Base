/**
 * Lightweight smoke checks for search/filter helpers (no browser).
 * Run: npx tsx scripts/smoke-utils.ts
 */
import { entryMatchesQuery, snippet, formatDate } from '../src/lib/utils.ts'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

const sample = {
  title: '小孔 Washer 網格外圈不規則',
  symptom: '外圈不規則三角',
  root_cause: 'washer 層數不足',
  solution: '提高 washer 層數',
  failed_attempts: '只開 quad-dominant',
  tags: ['washer', 'batchmesh'],
}

assert(entryMatchesQuery(sample, 'washer'), 'match washer')
assert(entryMatchesQuery(sample, 'batchmesh'), 'match tag')
assert(entryMatchesQuery(sample, '時間步長') === false, 'no false positive')
assert(entryMatchesQuery(sample, ''), 'empty query matches all')
assert(snippet('abcdefghij', 5) === 'abcde…', 'snippet truncates')
assert(formatDate('2026-09-20T12:00:00.000Z').includes('2026'), 'formatDate year')

console.log('smoke-utils: OK')
