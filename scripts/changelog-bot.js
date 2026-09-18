"use strict";
/*
 * changelog-bot.js
 *
 * Runs from .github/workflows/changelog-bot.yml whenever a pull request
 * merges into this repo. For every aircraft/<id>.json file the PR
 * touched, it prepends one new entry to that aircraft's "changelog" array
 * crediting the PR author and summarizing the change - so contributors get
 * automatic, visible credit on the aircraft's "Changelog" tab without
 * having to hand-edit the changelog themselves.
 *
 * Zero dependencies, matching the rest of this project - just Node's
 * built-in fs/child_process. Uses careful text-splicing rather than
 * JSON.parse + JSON.stringify so the rest of each file's formatting
 * (indentation, key order, everything) is left completely untouched;
 * only the "changelog" array gets a new entry spliced in.
 *
 * Required env vars (set by the workflow from the pull_request event):
 *   PR_AUTHOR   - github.event.pull_request.user.login
 *   PR_TITLE    - github.event.pull_request.title
 *   PR_NUMBER   - github.event.pull_request.number
 *   BASE_SHA    - github.event.pull_request.base.sha (pre-merge tip of the
 *                 base branch, diffed against current HEAD to find the
 *                 files this PR actually changed)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PR_AUTHOR = process.env.PR_AUTHOR;
const PR_TITLE = process.env.PR_TITLE;
const PR_NUMBER = process.env.PR_NUMBER;
const BASE_SHA = process.env.BASE_SHA;

if (!PR_AUTHOR || !PR_TITLE || !PR_NUMBER || !BASE_SHA) {
  console.error("changelog-bot: missing one of PR_AUTHOR/PR_TITLE/PR_NUMBER/BASE_SHA - skipping.");
  process.exit(0); // don't fail the whole workflow over a missing env var
}

function escapeJsonString(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");
}

function changedAircraftFiles() {
  let out;
  try {
    out = execFileSync(
      "git",
      ["diff", "--name-status", BASE_SHA, "HEAD", "--", "aircraft/*.json"],
      { encoding: "utf8" }
    );
  } catch (err) {
    console.error("changelog-bot: git diff failed:", err.message);
    return [];
  }
  return out
    .split("\n")
    .map(function (line) { return line.trim(); })
    .filter(Boolean)
    .map(function (line) {
      const parts = line.split(/\s+/);
      return { status: parts[0], file: parts[parts.length - 1] };
    })
    // Skip deleted files - nothing to append a changelog entry to.
    .filter(function (e) { return e.status !== "D"; })
    .map(function (e) { return e.file; });
}

// Finds the "changelog": [ ... ] array in a file's raw text and returns
// { start, end } character indices of the '[' and matching ']', respecting
// JSON string literals so brackets inside a "change" description don't
// throw off the depth count.
function findChangelogArray(text) {
  const keyMatch = /"changelog"\s*:\s*\[/.exec(text);
  if (!keyMatch) return null;
  const start = keyMatch.index + keyMatch[0].length - 1; // index of '['
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) { escaped = false; }
      else if (ch === "\\") { escaped = true; }
      else if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return { start: start, end: i };
    }
  }
  return null;
}

function alreadyCredited(arrayText) {
  // Idempotency guard: if this exact PR number is already referenced in the
  // changelog (e.g. the workflow re-ran), don't add a second entry.
  return arrayText.indexOf("(#" + PR_NUMBER + ")") !== -1;
}

function appendEntry(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const range = findChangelogArray(text);
  if (!range) {
    console.warn("changelog-bot: no \"changelog\" array found in " + filePath + " - skipping.");
    return false;
  }
  const arrayFull = text.slice(range.start, range.end + 1);
  if (alreadyCredited(arrayFull)) {
    console.log("changelog-bot: " + filePath + " already credits PR #" + PR_NUMBER + " - skipping.");
    return false;
  }

  const date = new Date().toISOString().slice(0, 10);
  const change = escapeJsonString(PR_TITLE.trim()) + " (#" + PR_NUMBER + ")";
  const author = escapeJsonString(PR_AUTHOR);
  const entryBlock =
    "    {\n" +
    '      "date": "' + date + '",\n' +
    '      "change": "' + change + '",\n' +
    '      "author": "' + author + '"\n' +
    "    }";

  let newArrayFull;
  if (/^\[\s*\]$/.test(arrayFull)) {
    // Empty changelog array - shouldn't happen given the templates always
    // ship one example entry, but handle it defensively anyway.
    newArrayFull = "[\n" + entryBlock + "\n  ]";
  } else if (/^\[\n/.test(arrayFull)) {
    newArrayFull = arrayFull.replace(/^\[\n/, "[\n" + entryBlock + ",\n");
  } else {
    console.warn("changelog-bot: unexpected changelog formatting in " + filePath + " - skipping rather than risk corrupting the file.");
    return false;
  }

  const newText = text.slice(0, range.start) + newArrayFull + text.slice(range.end + 1);

  // Sanity check: the result must still be valid JSON before we write it.
  try {
    JSON.parse(newText);
  } catch (err) {
    console.error("changelog-bot: edit would have produced invalid JSON for " + filePath + " - aborting for this file:", err.message);
    return false;
  }

  fs.writeFileSync(filePath, newText, "utf8");
  console.log("changelog-bot: credited @" + PR_AUTHOR + " in " + filePath);
  return true;
}

const files = changedAircraftFiles();
if (!files.length) {
  console.log("changelog-bot: no aircraft/*.json files changed by this PR - nothing to do.");
  process.exit(0);
}

let touched = 0;
files.forEach(function (relPath) {
  const filePath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) return; // e.g. renamed/moved, already filtered deletes above
  if (appendEntry(filePath)) touched++;
});

console.log("changelog-bot: done, updated " + touched + " file(s).");
