# PlanesDB — Statistics Formatting Style Guide

Every aircraft's `specifications` block groups stats into "raw number + unit" plus
"text" pairs — e.g. `maxSpeed: { mph, text }`, `range: { miles, text }`,
`unitCost: { usd, text, inflationText }`. The raw number (`mph`, `miles`, `usd`, `ft`...)
is what the site sorts/filters/compares by; `text` is the human-readable string shown
on the page. This guide is only about the **text** strings — the raw numbers just need
to be correct and in the stated unit.

The point of standardizing these is comparability: someone flipping between the F-22
and the MiG-21 should see speed, range, cost etc. presented the same way on both pages,
not have to mentally reorder units first. **Exception: `maxSpeed.text` is knots-first
— see the Speed section below.** `data/AIRCRAFT-TEMPLATE-HELICOPTER.json`,
`data/AIRCRAFT-TEMPLATE-MILITARY.json` and `data/AIRCRAFT-TEMPLATE-CIVILIAN.json` each
have a short `_fieldname` reminder next to every field for when you're mid-edit; this
file has the full reasoning and worked examples.

## The one rule that covers most of it

**Imperial unit first, metric in parentheses, every time.** mph before km/h, miles
before km, feet before metres, pounds before kilograms, dollars before any foreign
currency. Never lead a display string with Mach, knots, or a metric unit.

## Speed (`maxSpeed.text`)

This is the one deliberate exception to the imperial-first rule above. Knots lead,
mph and km/h follow in brackets, nothing else:

```
<kn> kn (<mph> mph / <km/h> km/h)
```

```
565 kn (650 mph / 1,046 km/h)
1,434 kn (1,650 mph / 2,655 km/h)
```

No Mach number, no altitude/flight-regime clause, no variant note, no "at sea level" /
"in a dive" asides — keep it to just the three figures, full stop. If the aircraft's
speed is an estimate, put a single `~` in front of all three numbers:

```
~1,147 kn (~1,320 mph / 2,130 km/h)
```

Compute knots from the mph figure (`kn = mph × 0.868976`, rounded to the nearest
whole number); don't re-derive it from km/h. `maxSpeed.mph` (the raw numeric field)
still stores the mph number and must match the mph figure used in the `text` string,
or sorting by speed will silently disagree with what the page shows.

`cruiseSpeed` is unaffected by this — it keeps the normal imperial-first
`<mph> mph (<km/h> km/h)` format, Mach numbers and context clauses included, per
the rules above.

Wrong: `386 mph (621 km/h) at 22,970 ft (Bf 109G-6)` · `Mach 2.25 (~1,500 mph)` ·
`925 km/h (575 mph)` — any of the old prose-heavy formats.

## Range (`range.text`)

```
<mi> mi (<km> km)
```

If nautical miles are the number an operator would actually quote (common for
airliners and military transports), add it as a third value in the same parentheses
rather than leading with it:

```
9,206 mi (14,800 km, 8,000 nmi)
```

Wrong: `8,000 nmi (9,206 mi / 14,800 km)` · `15,000 km (9,320 mi)`

## Service ceiling, wingspan, length, height

Same rule, imperial first:

```
65,000 ft (19,812 m)
46 ft 3 in (14.1 m)
```

Wrong: `20,000 m (65,600 ft)`

**Helicopters** (`data/AIRCRAFT-TEMPLATE-HELICOPTER.json`) don't have a wingspan, so
this field is replaced entirely by `mainRotorDiameter: { ft, text }` - don't repurpose
the wingspan field to hold a rotor diameter, and don't add a wingspan field to a
helicopter entry. `length.text` should state both the fuselage-only length and the
rotors-turning length when a source publishes both (they can differ by 20+ feet on a
tandem-rotor design); if a source only publishes one figure, state that one but label
which it is rather than presenting a bare unqualified "length". `hoverCeiling`
(IGE/OGE) is a separate, genuinely different figure from `serviceCeiling.text` - don't
conflate the two.

## Weight (`weight`)

```
empty: <lb> lb (<kg> kg); MTOW: <lb> lb (<kg> kg)
```

Wrong: `empty: 11,000 kg (24,250 lb)`

## Unit cost (`unitCost.text`)

Always lead with the `$` USD figure:

- Under $1,000,000: full number with commas — `$51,000`
- $1,000,000 and up: abbreviated — `$8.5M`, `$79M`, `$350M`

Never spell out "million" and never append a redundant "USD" suffix (the `$` already
means USD everywhere on the site). Historical or foreign-currency figures, and
date/basis context, go in a trailing parenthetical *after* the `$` figure:

```
$154,000 wartime unit cost (roughly £53,000 at contemporary exchange rates)
$29M (Tejas Mk1A production standard, 2023-2026 dollars; roughly ₹160-241 crore)
```

If a unit cost was never publicly disclosed, don't just describe why — start the
string with the same lead-in every time so it reads consistently in a list of specs:

```
Not publicly disclosed - production ended in 1993, so the airframe cannot be
repurchased, only modernised
```

Wrong: `~£53,000 wartime unit cost (roughly $154,000 USD...)` (foreign currency
leading) · `Unknown (...)` · a bare explanatory sentence with no `$`/lead-in at all.

### Historical costs: say what year the dollars are in

If `unitCost.text` names a past year (a Cold War flyaway price, a wartime unit
cost, etc.), the raw `unitCost.usd` number is nominal for that year, not today's
dollars - and read on its own, a bare "$9.28M" reads as a suspiciously cheap
modern price. Say so directly in the text string, and add the CPI-adjusted
figure so a reader doesn't have to do the math themselves:

```
$9.28M (1962 flyaway, B-52H) - roughly $103M in 2026 dollars, adjusted for CPI inflation
```

Also add the optional `unitCost.inflationText` field (short form, e.g.
`"≈$103M in 2026 dollars"`) - this renders as a small note under the Cost tile
in the quick-glance spec strip, so the caveat is visible at a glance and not
just on hover / in the full Specifications tab. Use the Bureau of Labor
Statistics CPI (e.g. via https://www.bls.gov/data/inflation_calculator.htm or
https://www.in2013dollars.com/) rather than guessing a multiplier, and refresh
the figure occasionally - "in 2026 dollars" quietly goes stale every year.
Aircraft priced in already-current dollars don't need this field at all.

## Why not just enforce this at build time?

`build.js` doesn't parse or reject these strings — they're free text, and a hard
validator would be more trouble than it's worth (there's always a legitimate edge case,
like the Wright Flyer's speed being asterisked to "airspeed vs. groundspeed into a
headwind"). Consistency here is a writing convention, not a build constraint: follow
the pattern above when you add or edit an aircraft and the database stays comparable.
