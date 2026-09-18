#!/usr/bin/env node
/* =====================================================================
   PLANESDB DATABASE — ENTRY VALIDATOR
   ---------------------------------------------------------------------
   Runs on every pull request. Contributors cannot preview their change
   (the site generator lives in a separate repository), so this is the
   feedback they get instead - and it therefore has to check the things
   that would otherwise break the build AFTER a merge, and say clearly
   what to do about each one.

   Every rule here mirrors one in the site's build.js. If a rule changes
   there, change it here too, or a contributor gets a green tick on
   something that then fails to build.

   Usage:
     node scripts/validate-entries.js
   Exits non-zero if anything is wrong.
   ===================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const AIRCRAFT = path.join(ROOT, "aircraft");
const OPERATORS = path.join(ROOT, "operators");

const DOMAIN_CATEGORIES = ["military", "civilian"];
const VALID_STATUSES = ["In Service", "In Development", "Cancelled", "Retired"];

/* Field names that no longer render anything. An entry copied from an old
   example still carries them and the content quietly goes nowhere - so these
   are worth saying out loud, but they do NOT break a build, and failing a
   contributor's pull request over one would be wrong.

   Note what is NOT in this list: "seedNews" is still live. It is the News
   tab's per-aircraft fallback when there are no fresh stories, it is read by
   build.js, and 56 entries rely on it. It was dropped from the TEMPLATES,
   which is a different thing from being dropped from the schema. */
const STALE_FIELDS = {
  notableIncidentsAndHistory: 'renamed - "accidentsAndIncidents" is the field that renders',
  id: "no longer used - an entry's id is its filename",
  slug: "no longer used - the slug is derived from the filename",
};

let errors = [];
let warnings = [];

function err(file, msg) { errors.push({ file, msg }); }
function warn(file, msg) { warnings.push({ file, msg }); }

function validCategorySlugs() {
  const f = path.join(ROOT, "categories.json");
  if (!fs.existsSync(f)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(f, "utf8"));
    const list = Array.isArray(raw) ? raw : (raw.categories || []);
    return list.map((c) => (typeof c === "string" ? c : c.slug)).filter(Boolean);
  } catch (e) { return null; }
}

/* Any key beginning with "_" is documentation from the template and must be
   stripped before an entry is real. Checked at every depth, because the
   per-field comments sit inside nested objects too. */
function findUnderscoreKeys(node, trail) {
  let found = [];
  if (Array.isArray(node)) {
    node.forEach((v, i) => { found = found.concat(findUnderscoreKeys(v, trail + "[" + i + "]")); });
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      if (k.startsWith("_")) found.push(trail ? trail + "." + k : k);
      else found = found.concat(findUnderscoreKeys(node[k], trail ? trail + "." + k : k));
    }
  }
  return found;
}

function checkAircraft(filename, validSlugs) {
  const rel = "aircraft/" + filename;
  const full = path.join(AIRCRAFT, filename);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*\.json$/.test(filename)) {
    err(rel, 'Not a valid filename. It becomes the page URL, so it must be lowercase ' +
      'letters, digits and single hyphens only - e.g. "general-dynamics-f16-fighting-falcon.json". ' +
      'Rename the file.');
    return;
  }

  let plane;
  try {
    plane = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (e) {
    err(rel, "Not valid JSON: " + e.message +
      "  (a trailing comma or an unmatched bracket is nearly always the cause)");
    return;
  }

  const stray = findUnderscoreKeys(plane, "");
  if (stray.length) {
    err(rel, "Still contains template documentation lines, which are not part of the " +
      "schema and must be deleted: " + stray.slice(0, 6).join(", ") +
      (stray.length > 6 ? " (and " + (stray.length - 6) + " more)" : ""));
  }

  for (const [field, why] of Object.entries(STALE_FIELDS)) {
    if (field in plane) warn(rel, 'Has "' + field + '", which ' + why + ". Nothing breaks, but that content is not being shown.");
  }

  if (!plane.name) err(rel, 'Missing "name".');

  if (!plane.category) {
    err(rel, 'Missing "category". It is the entry\'s domain and must be exactly one of: ' +
      DOMAIN_CATEGORIES.join(", ") + ".");
  } else if (DOMAIN_CATEGORIES.indexOf(plane.category) === -1) {
    err(rel, '"category" is ' + JSON.stringify(plane.category) + '. It is the entry\'s ' +
      'DOMAIN and must be exactly one of: ' + DOMAIN_CATEGORIES.join(", ") +
      '. A type like "helicopters" or "bombers" is not a domain - put it in the ' +
      '"categories" list instead, where it becomes an extra filter chip.');
  }

  if (validSlugs) {
    const listed = (plane.categories || [])
      .map((s) => String(s).trim())
      .filter((s) => s && !s.startsWith("//"));
    for (const slug of listed) {
      if (validSlugs.indexOf(slug) === -1) {
        err(rel, 'Uses the category "' + slug + '", which is not in categories.json, so it ' +
          'matches no filter chip and would render nowhere.');
      }
    }
  }

  if (plane.status && VALID_STATUSES.indexOf(plane.status) === -1) {
    err(rel, '"status" is ' + JSON.stringify(plane.status) + '. It must be exactly one of: ' +
      VALID_STATUSES.join(", ") + ' - capitalisation included. An unrecognised status ' +
      'renders the wrong pill on the live page.');
  }

  // variants are { code, desc } and nothing else
  if (Array.isArray(plane.variants)) {
    plane.variants.forEach((v, i) => {
      if (!v || typeof v !== "object") { err(rel, "variants[" + i + "] should be an object with code and desc."); return; }
      const extra = Object.keys(v).filter((k) => k !== "code" && k !== "desc" && !k.startsWith("_"));
      if (extra.length) {
        err(rel, "variants[" + i + "] has fields that no longer exist (" + extra.join(", ") +
          "). A variant is { code, desc } only - anything longer belongs in the article.");
      }
    });
  }

  // survivors must be the object form, not a bare list
  if (plane.survivors && Array.isArray(plane.survivors)) {
    err(rel, '"survivors" is a list, which renders nothing. It must be an object: ' +
      '{ "intro": "...", "airframes": [ ... ] }.');
  }

  // Unfilled placeholders. A strict date-format check was tried here first
  // and was pure noise: this database deliberately writes prose into date
  // fields when the truth needs it - "Never entered service", or "2016 (US,
  // as QF-4 drones); 1992 (RAF)" - and nagging about that would teach
  // contributors to flatten real nuance into a tidy-looking wrong answer.
  // What IS worth catching is a field nobody got round to filling in.
  // "N/A" is deliberately NOT treated as one: a Wright Flyer has no ICAO
  // type code, and "not applicable" is the right answer there, not a gap.
  const PLACEHOLDERS = /^(\?+|tbd|tba|todo|xxx+|\.\.\.|fill in|your text here)$/i;
  // "??" is a documented convention in this database, not an oversight: an
  // entry whose specificationsNote explains what "??" stands for is saying
  // the figure is genuinely unpublished, which for a special access
  // programme like the B-21 is the honest answer and better than repeating
  // an unconfirmed estimate from the aviation press. Warning about it would
  // be nagging an entry for getting it right, so check for that note first.
  const note = String((plane.specifications && plane.specifications.specificationsNote) || "");
  const explainsPlaceholders = /\?\?/.test(note);

  const unfilled = [];
  (function scan(node, trail) {
    if (Array.isArray(node)) node.forEach((v, i) => scan(v, trail + "[" + i + "]"));
    else if (node && typeof node === "object") {
      for (const k of Object.keys(node)) scan(node[k], trail ? trail + "." + k : k);
    } else if (typeof node === "string" && PLACEHOLDERS.test(node.trim())) {
      if (explainsPlaceholders && trail.startsWith("specifications.")) return;
      unfilled.push(trail + ' = "' + node.trim() + '"');
    }
  })(plane, "");
  if (unfilled.length) {
    warn(rel, "Looks unfinished - these fields still hold a placeholder: " +
      unfilled.slice(0, 5).join(", ") +
      (unfilled.length > 5 ? " (and " + (unfilled.length - 5) + " more)" : "") +
      ". Better to leave a field out than to publish a placeholder.");
  }

  if (!Array.isArray(plane.quickFacts) || plane.quickFacts.length < 3) {
    warn(rel, "Fewer than three quickFacts. Four to six short, verifiable facts is the " +
      "house standard.");
  }
}

function checkOperator(filename) {
  const rel = "operators/" + filename;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*\.json$/.test(filename)) {
    err(rel, "Not a valid filename - lowercase letters, digits and single hyphens only.");
    return;
  }
  let op;
  try {
    op = JSON.parse(fs.readFileSync(path.join(OPERATORS, filename), "utf8"));
  } catch (e) {
    err(rel, "Not valid JSON: " + e.message);
    return;
  }
  const stray = findUnderscoreKeys(op, "");
  if (stray.length) {
    err(rel, "Still contains template documentation lines that must be deleted: " +
      stray.slice(0, 6).join(", "));
  }
  if (!op.name) err(rel, 'Missing "name".');
}

/* ---- run ---- */
const validSlugs = validCategorySlugs();
if (!validSlugs) {
  warnings.push({ file: "categories.json", msg: "Not found or unreadable - category slugs were not checked." });
}

const aircraftFiles = fs.existsSync(AIRCRAFT) ? fs.readdirSync(AIRCRAFT).filter((f) => f.endsWith(".json")) : [];
const operatorFiles = fs.existsSync(OPERATORS) ? fs.readdirSync(OPERATORS).filter((f) => f.endsWith(".json")) : [];

aircraftFiles.forEach((f) => checkAircraft(f, validSlugs));
operatorFiles.forEach(checkOperator);

console.log("Checked " + aircraftFiles.length + " aircraft and " + operatorFiles.length + " operator entries.\n");

if (warnings.length) {
  console.log("Warnings (these do not fail the check):");
  warnings.forEach((w) => console.log("  " + w.file + "\n      " + w.msg));
  console.log("");
}

if (errors.length) {
  console.log("Problems that need fixing:\n");
  errors.forEach((e) => console.log("  " + e.file + "\n      " + e.msg + "\n"));
  console.log(errors.length + " problem(s) found.");
  process.exit(1);
}

console.log("All good - nothing here would break the site build.");
