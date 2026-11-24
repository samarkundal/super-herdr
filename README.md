# Super Herdr

**Herdr, organised by project.** A layout for the [Herdr](https://herdr.dev) desktop app that turns its spaces into permanent projects, puts every agent that needs you in one place, and adds a file explorer with Markdown preview.

> Super Herdr is a community layout for Herdr. It is not made by or affiliated with the Herdr team.

![Super Herdr](preview.png)

## What you get

- **Project rail.** A Slack-style column of your projects on the far left. A ring marks the one you're in, a red dot means an agent in it is waiting on you, a green dot means something is working. Click to switch; click a faded one to start it again.
- **Permanent projects.** A Herdr space disappears when you close its last tab. A project stays, remembers its folder, and reopens there. New tabs (**+**, **Cmd+T**, right-click → New tab) start in the project's folder, not wherever your last terminal was.
- **Waiting on you.** Every agent that's blocked on your input or finished while you looked away, across all projects, at the top of the sidebar.
- **This project's agents.** The sidebar shows only the agents of the project you're in, plus **+ New session**.
- **Explorer.** The project's file tree in the sidebar, with git status marks. It never jumps when you switch tabs.
- **File viewer.** Click a file to read it in a side panel, with syntax highlighting and a **Source | Preview** switch for Markdown.
- **Sidebar tabs.** Agents, Explorer, and **⋯** for Herdr's original Spaces and Agents lists.

## Install

Requires the Herdr desktop app 0.1.18 or newer (built and tested on macOS; Linux and Windows should work but are untested).

**Ask your Herdr agent** to add `herdr.dev/layouts/samarkundal/super-herdr` (or `github.com/samarkundal/super-herdr`). Herdr's own guide teaches agents to install a shared layout safely.

**Or run the installer:**

```sh
git clone --depth 1 https://github.com/samarkundal/super-herdr && super-herdr/scripts/install.sh
```

It copies the layout and its `super-*` mods into `~/.config/herdr-app/`, merges [`keys.json`](keys.json) into yours (only the `layout:super-herdr` section, so **Cmd+T** opens new tabs in the project's folder while this layout is showing), and checks every mod loads. It needs `jq` and `rsync`, which macOS includes.

Then switch to it: **Ctrl+Shift+L**, Settings → Look, or `herdr-app do layout.switch '{"name":"super-herdr"}'`.

**By hand:** copy `layouts/super-herdr.json`, `layouts/super-herdr.svg` and every `mods/super-*` into `~/.config/herdr-app/`, and merge `keys.json` into yours.

## Update

Run the installer again from a fresh clone (or `git pull` in your clone first):

```sh
git clone --depth 1 https://github.com/samarkundal/super-herdr && super-herdr/scripts/install.sh
```

Your projects, theme, sizes and other keys stay. If you edited the layout file, your copy is kept beside it. See [CHANGELOG.md](CHANGELOG.md) for what changed.

## Uninstall

Switch to the **Herdr** layout, then delete `layouts/super-herdr.json`, `layouts/super-herdr.svg`, the `mods/super-*` folders and the `"layout:super-herdr"` section of `keys.json`.

## Getting started

1. Click **+** at the bottom of the rail and pick a folder. That's your first project.
2. Start agents with **+ New session** or **Cmd+T**. They open in the project's folder.
3. Already have a space for a repo? Open it (it's below the divider in the rail) and click **Make it a project…**.

## What the mods do on your machine

Mods are trusted code with your permissions (see Herdr's [security notes](https://github.com/herdrdev/herdr-app/blob/master/docs/security.md)). Super Herdr:

- runs `git status` and a small `sh` (PowerShell on Windows) folder listing in the Explorer
- reads the files you click in the file viewer
- opens the system folder picker when you create a project
- stores your projects list in Herdr's shared state (`~/.config/herdr-app/shared.json`)
- makes **no network requests**

## Credits and license

Apache-2.0. Several mods are modified copies of Herdr's own mods (Copyright Herdr contributors, Apache-2.0); see [NOTICE](NOTICE). Icons are from [Lucide](https://lucide.dev) (ISC, see [licenses/](licenses/)).

How it was built, for anyone (or any agent) rebuilding it: [RECIPE.md](RECIPE.md).
