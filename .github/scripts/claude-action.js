const fs = require('fs');
const path = require('path');

// ─── Read issue context from env ───────────────────────────────────────────
const ISSUE_TITLE  = process.env.ISSUE_TITLE  || '';
const ISSUE_BODY   = process.env.ISSUE_BODY   || '';
const ISSUE_NUMBER = process.env.ISSUE_NUMBER || '0';
const ISSUE_LABELS = process.env.ISSUE_LABELS || '';
const API_KEY      = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

// ─── Files Claude can read and edit ────────────────────────────────────────
const FILES = ['index.html', 'about.html', 'features.html'];

function readFile(name) {
  try { return fs.readFileSync(name, 'utf8'); }
  catch (e) { return null; }
}

// ─── Build system prompt based on issue label ───────────────────────────────
function buildSystemPrompt(labels) {
  const isDesign   = labels.includes('design');
  const isContent  = labels.includes('content');
  const isBug      = labels.includes('bug');
  const isFeature  = labels.includes('enhancement');

  let focus = '';
  if (isDesign)  focus = 'Focus on CSS and layout changes. Preserve all JavaScript and HTML structure unless the design requires changes.';
  if (isContent) focus = 'Focus only on changing text content. Do not touch CSS or JavaScript.';
  if (isBug)     focus = 'Identify and fix the bug described. Be surgical — change only what is broken.';
  if (isFeature) focus = 'Implement the requested feature. Keep the existing design language consistent — Poppins font, dark #060606 homepage, white about/features pages, blue #4461f2 CTAs.';

  return `You are an expert web developer maintaining the Grails art marketplace site.
The site uses Poppins font, has three pages (index.html — dark hero, about.html — white, features.html — white with snap scroll).
Design language: dark background #060606 on homepage, white #fff on about/features, blue CTA #4461f2, purple accent #7c5cbf for Grails fee.

${focus}

RULES:
- Return ONLY valid JSON, no markdown, no backticks, no explanation outside the JSON
- Only include files that actually changed — set unchanged files to null
- Preserve all existing functionality (menu, modal, form steps, canvas animations)
- Do not change file names or add new files
- Make the minimum changes needed to satisfy the request`;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📋 Processing issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}`);
  console.log(`🏷  Labels: ${ISSUE_LABELS || 'none'}\n`);

  // Read current file contents
  const fileContents = {};
  for (const name of FILES) {
    const content = readFile(name);
    if (content) {
      fileContents[name] = content;
      console.log(`📄 Read ${name} (${content.length} chars)`);
    }
  }

  // Build the prompt
  const filesSection = Object.entries(fileContents)
    .map(([name, content]) => `=== ${name} ===\n${content}`)
    .join('\n\n');

  const userPrompt = `Issue #${ISSUE_NUMBER}
Title: ${ISSUE_TITLE}
Labels: ${ISSUE_LABELS}

Feedback:
${ISSUE_BODY}

Current files:
${filesSection}

Return a JSON object in exactly this format:
{
  "files": {
    "index.html": "<complete updated file content, or null if not changed>",
    "about.html": "<complete updated file content, or null if not changed>",
    "features.html": "<complete updated file content, or null if not changed>"
  },
  "summary": "<one concise sentence describing what was changed and why>",
  "confidence": "<high|medium|low — how confident you are the change matches the request>"
}`;

  // Call Claude API
  console.log('🤖 Calling Claude API...');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 16000,
      system: buildSystemPrompt(ISSUE_LABELS),
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('❌ API error:', err);
    process.exit(1);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text || '';

  console.log(`\n📥 Claude response received (${rawText.length} chars)`);

  // Parse the JSON response
  let result;
  try {
    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    result = JSON.parse(cleaned);
  } catch (e) {
    console.error('❌ Failed to parse Claude response as JSON');
    console.error('Raw response:', rawText.slice(0, 500));
    // Write a summary so the workflow can still comment
    fs.writeFileSync('.github/claude-summary.txt',
      'Claude was unable to parse the request into actionable changes. Please clarify the feedback.');
    process.exit(0); // exit 0 so the workflow continues to comment
  }

  // Write changed files
  let changedCount = 0;
  for (const [filename, content] of Object.entries(result.files || {})) {
    if (content && content !== fileContents[filename]) {
      fs.writeFileSync(filename, content, 'utf8');
      console.log(`✅ Updated ${filename}`);
      changedCount++;
    } else if (!content) {
      console.log(`⏭  ${filename} — no changes`);
    }
  }

  // Write summary for the workflow to use
  const summary = result.summary || 'Changes applied.';
  const confidence = result.confidence || 'medium';
  const fullSummary = `${summary} _(Confidence: ${confidence})_`;

  fs.writeFileSync('.github/claude-summary.txt', fullSummary, 'utf8');
  console.log(`\n📝 Summary: ${fullSummary}`);
  console.log(`📊 Files changed: ${changedCount}`);

  if (changedCount === 0) {
    console.log('\n⚠️  No files were modified. The issue may need clarification.');
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  fs.writeFileSync('.github/claude-summary.txt',
    'An error occurred while processing this feedback. Check the Actions log for details.');
  process.exit(0);
});
