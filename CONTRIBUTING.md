# Contributing to PlanesDB

Thanks for wanting to help grow the database :)

Everything that makes up an aircraft entry lives here as plain JSON - one file per
aircraft, one file per operator - so contributing does not need an account, a review
queue, or any special access. A fork and a pull request is all it takes.

There are three kinds of contribution:

1. **Fixing or improving an existing entry** - a wrong spec, a missing source, a thin
   history section.
2. **Adding a brand-new aircraft** that isn't covered yet.
3. **Adding or improving an operator** - the air forces and airlines that fly them.

---

## How the repository is laid out

```
aircraft/     one .json file per aircraft - the filename IS the entry's id
operators/    one .json file per operator
templates/    copy one of these to start a new entry
```

The filename matters: `aircraft/boeing-747.json` becomes `planesdb.com/aircraft/boeing-747/`.
Lowercase, words separated by hyphens, no spaces or accents.

---

## 1. Fixing or improving an existing entry

Open the file you want to change under `aircraft/` and edit it directly. The most
useful improvements tend to be:

- Correcting or updating a spec value.
- Adding or expanding a `quickFacts` entry - one short, verifiable sentence works best.
- Adding a `source` link or a missing date to an `accidentsAndIncidents` entry.
- Fixing an operator's `name` so it reads as one real operator - that name is what
  picks its badge and links the aircraft through to the operator's own page.

## 2. Adding a brand-new aircraft

1. Copy the template that fits from `templates/` into `aircraft/`, and rename it to the
   aircraft's id - so `aircraft/boeing-747.json`:

   - `AIRCRAFT-TEMPLATE-HELICOPTER.json` - any rotorcraft, military or civilian. It
     replaces `wingspan` with rotor-specific fields.
   - `AIRCRAFT-TEMPLATE-MILITARY.json` - fixed-wing fighters, bombers, military
     transports, spy planes and drones. Anything fixed-wing that has served an air
     force or carried weapons.
   - `AIRCRAFT-TEMPLATE-CIVILIAN.json` - fixed-wing airliners, business jets and
     general aviation.

   The helicopter and military templates each carry two extra fields (`survivors` and
   `specifications.combatLosses`) that the civilian one leaves out, since they do not
   apply to unarmed civil aircraft.

2. Fill in every field. Each has a matching `_fieldName` comment directly above it
   explaining what is expected - and **every line starting with an underscore needs
   deleting** before you save, including `_INSTRUCTIONS`. Those lines are
   documentation rather than part of the real schema, and an entry that still has them
   will not validate.

3. Include a `quickFacts` array of four to six short facts, and sourced
   `accidentsAndIncidents` where they are relevant. Have a look at
   `aircraft/supermarine-spitfire.json` or `aircraft/lockheed-sr71-blackbird.json` for
   the level of detail and the sourcing style this database aims for.

4. Please don't worry about photos - there is no photo field in the template and none
   is expected. Photographs are held separately from this repository for licensing
   reasons, and your entry will show its silhouette until one is added. If you have a
   photo you would like to see used, please open an issue with a link to it and its
   licence and I will look at getting it added.

## 3. Adding or improving an operator

Operators work the same way - copy `templates/OPERATOR-TEMPLATE.json` into
`operators/` and name it after the operator, so `operators/royal-air-force.json`.

An operator entry is worth adding when the operator already appears on several
aircraft and deserves a page of its own rather than just a badge.

---

## Checking your work

This repository holds the data; the code that builds planesdb.com lives elsewhere, so
there is no local preview to run from here. Instead, every pull request is checked
automatically as soon as you open it, and you will see a green tick or a red cross
within a minute or so. The check covers:

- the JSON parsing at all - a stray comma or bracket is far and away the most common
  problem
- no leftover `_fieldName` or `_INSTRUCTIONS` documentation lines
- required fields being present, and dates looking like dates

If it comes back red, click through to the log and it will name the file and the line.
Please feel free to push a fix to the same branch and it will re-run by itself.

---

## Sourcing and tone

- Please cite sources for anything factual, and particularly for incidents and
  history. Wikipedia, manufacturer and official military pages, and named aviation
  outlets - The War Zone, The Aviationist, Flight Global, Defense News, AeroTime -
  are all welcome.
- Specific, verifiable facts - real numbers, dates, named events - are much more
  useful than general claims.
- Please try to match the tone of the entries already here, which is factual and
  detail-rich rather than promotional.
- Where published figures genuinely disagree, say so in the entry rather than quietly
  picking one.

---

## Pull request checklist

- [ ] One aircraft, or one focused fix, per pull request - it keeps review quick and
      the history readable.
- [ ] The JSON is valid - no trailing commas, brackets and quotes all matched.
- [ ] Every `_fieldName` and `_INSTRUCTIONS` line is removed from any new entry.
- [ ] Sources are included for factual claims, especially incidents.
- [ ] Nobody else's sourced content has been removed or overwritten without a word
      about why in the description.

---

## Credit for your work

Every aircraft entry has a "Changelog" tab on the site that lists how the entry has
changed and who changed it. You do not need to touch this yourself - once your pull
request merges, a bot adds an entry crediting your GitHub username and summarising the
change from your pull request title, so it ends up reading like:

> **2026-07-16** · Fix A380 cruise speed unit conversion (#42) · **@your-username**

Your username links straight to your GitHub profile. If your pull request title does
not quite describe the change well enough to stand on its own in that list, please
feel free to add your own `changelog` entry by hand as well - see the `changelog`
array and its `_changelog` comment in the templates - and just include an `"author"`
field with your GitHub username so you are still credited the same way.

---

## Licensing - what you are agreeing to

The entries here are published under the
[Creative Commons Attribution-ShareAlike 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/),
so anyone may use and build on them as long as they credit PlanesDB and keep
whatever they make just as open. See [LICENSE.md](LICENSE.md) for the detail.

By opening a pull request you are confirming two things:

- **it is yours to give** - you wrote it, or it comes from a source you are
  entitled to draw on
- **you are licensing it under those same terms**, so the database stays usable
  by everyone

You keep the copyright in what you wrote. You are granting everyone else the
right to use it.

Please don't paste in text lifted from a manufacturer's brochure, an aviation
magazine or a website that isn't yours to give away. Facts are free for anyone
to state - somebody else's paragraphs are not. Read the source, then write the
entry in your own words with the source cited, which is what the rest of the
database does.

Photographs are a separate matter and are not covered by that licence - see
LICENSE.md.

---

## Questions

Please open an issue on this repository, or email
[hello@planesdb.com](mailto:hello@planesdb.com) - and if there is an aircraft you want
to see that isn't already covered, please feel free to contribute it or simply let me
know and I will look at getting it added :)
