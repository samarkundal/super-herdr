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

Super Herdr needs the Herdr desktop app (built and tested on **0.1.18, macOS**). Linux and Windows should work but are untested.

**Easiest: ask your agent.** In any agent running inside Herdr:

> Install the Herdr layout from https://github.com/samarkundal/super-herdr

Herdr's own guide teaches agents how to install a shared layout safely (copy, rename on clashes, merge keys, check each mod).

**By hand:**

1. Quit the Herdr window (your terminals and agents keep running).
2. Copy the files:
   ```sh
   git clone https://github.com/samarkundal/super-herdr
   cp super-herdr/layouts/super-herdr.json ~/.config/herdr-app/layouts/
   cp -R super-herdr/mods/super-* ~/.config/herdr-app/mods/
   ```
3. Add the `"layout:super-herdr"` section from [`keys.json`](keys.json) to `~/.config/herdr-app/keys.json`. It makes **Cmd+T** open new tabs in the project's folder, only while this layout is showing.
4. Open Herdr and switch: **Ctrl+Shift+L**, or Settings → Look, or
   ```sh
   herdr-app do layout.switch '{"name":"super-herdr"}'
   ```

To go back, switch to the **Herdr** layout. To remove it, delete `layouts/super-herdr.json`, the `mods/super-*` folders and the keys section.

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
