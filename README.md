<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/planesdb-logo-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="assets/planesdb-logo-light.png">
    <img alt="PlanesDB" src="assets/planesdb-logo-light.png" width="460">
  </picture>
</p>

<p align="center">
  <b>Aircraft specifications, history and operators - all in one place, and open for anyone to improve.</b>
</p>

<p align="center">
  <a href="https://planesdb.com">Website</a> &nbsp;·&nbsp;
  <a href="CONTRIBUTING.md">Contributing</a> &nbsp;·&nbsp;
  <a href="LICENSE.md">Licence</a> &nbsp;·&nbsp;
  <a href="mailto:hello@planesdb.com">Get in touch</a>
</p>

---

## What is PlanesDB?

PlanesDB is a passion project - built by an aviation fan, for aviation fans. The idea is to bring the specifications, history, operators and incident record for each aircraft together on a single page, with the sources listed alongside so you can check the numbers for yourself rather than simply taking my word for it.

It covers fighters, bombers, airliners, helicopters, spy planes, cargo aircraft, drones and plenty more besides, and it is designed to keep growing well beyond what is here today.


---

## What this repository does

This repository holds the data behind [planesdb.com](https://planesdb.com). Every aircraft is a single plain JSON file and so is every operator, which means there is no database to install and no account to set up - just files that anyone can read, fix and add to.

| Folder / file | What is in it |
| --- | --- |
| [`aircraft/`](aircraft/) | One JSON file per aircraft. The filename is the entry's id, so `aircraft/boeing-747.json` becomes `planesdb.com/aircraft/boeing-747/` |
| [`operators/`](operators/) | One JSON file per operator - the air forces and airlines that fly the aircraft |
| [`templates/`](templates/) | Starting points for new entries (civilian, military, helicopter and operator) along with a stats style guide |
| [`categories.json`](categories.json) | The categories used for browsing the site |
| [`scripts/`](scripts/) | The entry validator and the changelog bot - ensures new entries are formatted correctly and won't break the site |
| [`.github/workflows/`](.github/workflows/) | The automation that checks pull requests and rebuilds the site |



### How a change reaches the site

1. You open a pull request with your fix or new entry.
2. An automatic check runs within a minute or so and makes sure the JSON is valid, that no leftover template notes remain, and that the required fields and dates are in place. If anything is wrong the log names the file and the line.
3. Once the pull request is approved and merged into `main`, the site is rebuilt and your change goes live.
4. A bot adds a line to the entry's Changelog tab crediting your GitHub username, so your work is recognised on the page itself.

---

## Would you like to add or fix an entry?

Please do - that is exactly what this repository is for. A fork and a pull request is all it takes, and there are three ways to help:

- **Fix or improve an existing entry** - a wrong spec, a missing source or a thin history section
- **Add a new aircraft** that is not covered yet
- **Add or improve an operator**

Everything you need, including which template to pick, how to fill it in, the sourcing and tone to aim for and a pull request checklist, is in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Licence

The entries are published under the [Creative Commons Attribution-ShareAlike 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/), so you are welcome to use and build on them as long as you credit PlanesDB and keep whatever you make just as open. Photographs are a separate matter - none are stored here and each is licensed individually by its creator. The full detail is in [LICENSE.md](LICENSE.md).

---

## Get in touch

If you spot a mistake or have a question, please open an issue on this repository or email [hello@planesdb.com](mailto:hello@planesdb.com). And if there is an aircraft you want to see that isn't already covered - please feel free to contribute it or simply let me know and I will look at getting it added :) 

Thanks for taking the time to visit PlanesDB.
