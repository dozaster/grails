const fs = require('fs');

// ─── Env ────────────────────────────────────────────────────────────────────
const ISSUE_TITLE  = process.env.ISSUE_TITLE  || '';
const ISSUE_BODY   = process.env.ISSUE_BODY   || '';
const ISSUE_NUMBER = process.env.ISSUE_NUMBER || '0';
const ISSUE_LABELS = process.env.ISSUE_LABELS || '';
const API_KEY      = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

// ─── Files ──────────────────────────────────────────────────────────────────
const FILES = ['index.html', 'about.html', 'features.html'];

function readFile(name) {
  try { return fs.readFileSync(name, 'utf8'); }
  catch (e) { return null; }
}

// ─── Tool definitions — Claude calls these to write files ───────────────────
const tools = [
  {
    name: 'write_file',
    description: 'Write updated content to an HTML file. Only call this for files that actually need changes.',
    input_schema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          enum: ['index.html', 'about.html', 'features.html'],
          description: 'The file to write'
        },
        content: {
          type: 'string',
          description: 'The complete updated file content'
        }
      },
      required: ['filename', 'content']
    }
  },
  {
    name: 'set_summary',
    description: 'Set a one-sentence summary of what was changed and confidence level. Always call this.',
    input_schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'One concise sentence describing what was changed'
        },
        confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'How confident you are the changes match the request'
        }
      },
      required: ['summary', 'confidence']
    }
  }
];

// ─── System prompt ───────────────────────────────────────────────────────────
function buildSystemPrompt(labels) {
  const isDesign  = labels.includes('design');
  const isContent = labels.includes('content');
  const isBug     = labels.includes('bug');
  const isFeature = labels.includes('enhancement');

  let focus = 'Make the changes described in the feedback.';
  if (isDesign)  focus = 'Focus on CSS and layout changes. Preserve all JavaScript and HTML structure unless the design requires changes.';
  if (isContent) focus = 'Focus only on changing text/copy. Do not touch CSS or JavaScript.';
  if (isBug)     focus = 'Identify and fix the bug described. Be surgical — only change what is broken.';
  if (isFeature) focus = 'Implement the requested feature. Keep existing design language consistent — Poppins font, dark #060606 homepage, white about/features pages, blue #4461f2 CTAs.';

  return `You are an expert web developer maintaining the Grails art marketplace site.
Three pages: index.html (dark hero, background #060606), about.html (white), features.html (white, snap scroll).
Design: Poppins font, blue CTA #4461f2, purple accent #7c5cbf.

${focus}

RULES:
- Only call write_file for files that actually changed
- Always call set_summary at the end
- Preserve all existing functionality: menu, modal, form steps, canvas animations
- Make minimum changes needed to satisfy the request`;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📋 Processing issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}`);
  console.log(`🏷  Labels: ${ISSUE_LABELS || 'none'}\n`);

  // Read files
  const fileContents = {};
  for (const name of FILES) {
    const content = readFile(name);
    if (content) {
      fileContents[name] = content;
      console.log(`📄 Read ${name} (${content.length} chars)`);
    }
  }

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

Use the write_file tool for each file that needs changes, then call set_summary.`;

  // Call API with tool use
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
      tools,
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('❌ API error:', err);
    process.exit(1);
  }

  const data = await response.json();
  console.log(`\n📥 Response received — ${data.content?.length} content blocks`);

  // Process tool calls
  let changedCount = 0;
  let summary = 'Changes applied.';
  let confidence = 'medium';

  for (const block of data.content || []) {
    if (block.type !== 'tool_use') continue;

    const { name, input } = block;

    if (name === 'write_file') {
      const { filename, content } = input;
      if (!FILES.includes(filename)) {
        console.warn(`⚠️  Skipping unknown file: ${filename}`);
        continue;
      }
      fs.writeFileSync(filename, content, 'utf8');
      console.log(`✅ Wrote ${filename} (${content.length} chars)`);
      changedCount++;
    }

    if (name === 'set_summary') {
      summary = (input && input.summary) ? String(input.summary) : summary;
      confidence = (input && input.confidence) ? String(input.confidence) : confidence;
    }
  }

  const fullSummary = `${summary} _(Confidence: ${confidence})_`;
  fs.writeFileSync('.github/claude-summary.txt', String(fullSummary), 'utf8');

  console.log(`\n📝 Summary: ${fullSummary}`);
  console.log(`📊 Files changed: ${changedCount}`);

  if (changedCount === 0) {
    console.log('\n⚠️  No files were modified — issue may need more detail.');
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  fs.writeFileSync('.github/claude-summary.txt',
    'An error occurred while processing this feedback. Check the Actions log for details.');
  process.exit(0);
});
