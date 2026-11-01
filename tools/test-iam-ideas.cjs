const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const ts = require(path.join(root, 'node_modules/typescript'))
const loaded = new Map()
const prompts = []
const NextResponse = class extends Response { static json(value, init) { return Response.json(value, init) } }
const mockAI = {
  DEFAULT_MODEL: 'fixture', QuotaExceededError: class extends Error {},
  async callModel(messages) {
    prompts.push(messages)
    return JSON.stringify(Array.from({ length: 5 }, (_, i) => ({ id: `fixture-${i}`, title: `Delegation receipt ${i}`, category: 'Unnormalized IAM', problem: 'Untraceable identity delegation', solution: 'Verify access receipts deterministically', features: ['Tenant isolation', 'Approved revocation'], whyNow: 'A controlled pilot measures delegation scope errors' })))
  },
}
function load(relative) {
  const filename = path.resolve(root, relative)
  if (loaded.has(filename)) return loaded.get(filename).exports
  const module = { exports: {} }; loaded.set(filename, module)
  const javascript = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const requireLocal = name => {
    if (name === 'next/server') return { NextResponse }
    if (name === '@/lib/ai/client') return mockAI
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts')
    if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), name + '.ts')))
    return require(require.resolve(name, { paths: [root] }))
  }
  new Function('require', 'module', 'exports', javascript)(requireLocal, module, module.exports)
  return module.exports
}
async function main() {
  const { IDEAS, CATEGORY_META, CATEGORIES } = load('src/app/(app)/million-ideas/ideas-data.ts')
  const category = 'Identity & Access Management'
  const iam = IDEAS.filter(idea => idea.category === category)
  assert.equal(iam.length, 20)
  assert.equal(new Set(iam.map(idea => idea.id)).size, 20)
  assert.ok(CATEGORY_META[category] && CATEGORIES.includes(category))
  for (const idea of iam) {
    for (const field of ['id', 'title', 'tagline', 'problem', 'solution', 'revenueModel', 'revenuePotential', 'difficulty', 'timeToMVP', 'whyNow']) assert.ok(idea[field], `${idea.id}: ${field}`)
    assert.ok(idea.features.length >= 4 && idea.techStack.length >= 4)
    assert.match(idea.whyNow, /Validation:/)
    assert.match(idea.whyNow, /hypothesis/)
  }
  const daily = load('src/app/api/daily-ideas/route.ts')
  const req = batch => ({ nextUrl: new URL(`https://fixture.invalid/api/daily-ideas?date=2026-11-01&batch=${batch}`) })
  let response = await daily.GET(req(5)), body = await response.json()
  assert.equal(response.status, 200)
  assert.equal(body.ideas.length, 5)
  assert.ok(body.ideas.every(idea => idea.category === category))
  assert.match(prompts[0][0].content, /deterministic policy engines/)
  assert.match(prompts[0][0].content, /differentiation hypothesis/)
  response = await daily.GET(req(5)); body = await response.json()
  assert.equal(body.cached, true); assert.equal(prompts.length, 1)
  assert.equal((await daily.GET(req(6))).status, 400)
  const { POST } = load('src/app/api/download-idea/route.ts')
  const archive = await POST({ json: async () => ({ idea: iam[0] }) })
  assert.equal(archive.status, 200)
  const JSZip = require(path.join(root, 'node_modules/jszip'))
  const zip = await JSZip.loadAsync(await archive.arrayBuffer())
  const prefix = `${iam[0].id}/`
  const blueprint = await zip.file(prefix + 'IAM-SECURITY-BLUEPRINT.md').async('string')
  assert.match(blueprint, /No model may grant privileges/)
  assert.match(blueprint, /cross-tenant access/)
  assert.match(await zip.file(prefix + 'CLAUDE.md').async('string'), /IAM product implementation requirements/)
  assert.doesNotMatch(await zip.file(prefix + 'supabase/schema.sql').async('string'), /for all using \(true\)/)
  const page = fs.readFileSync(path.join(root, 'src/app/(app)/million-ideas/page.tsx'), 'utf8')
  assert.match(page, /const BATCHES = \[5, 0, 1, 2, 3, 4\]/)
  assert.match(page, /parsed.length >= 30/)
  assert.match(page, /aihub_daily_ideas_iam_v1_/)
  console.log('PASS: 20 IAM ideas, category registration, daily generation and cache, invalid-batch rejection, safe starter-kit ZIP, and IAM-first client batching.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
