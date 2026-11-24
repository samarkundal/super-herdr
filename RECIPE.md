# Super Herdr

Herdr organised by project: a Slack-style rail of permanent projects on the far left, a sidebar that shows only the current project (its agents, plus every agent waiting on you anywhere), a project file explorer, and a side panel that reads files with Markdown preview. New tabs open in the project's folder.

![Super Herdr](preview.png)

## What you see

Left to right:

1. **Rail** (52px, theme `chrome`, 1px `border` on the right). Under the macOS window buttons (44px top padding on macOS, 10px elsewhere). One 28px rounded tile per project (radius 10, white bold initial, colors cycle `ansi6, ansi3, ansi4, ansi5, ansi2, ansi1` by position), inside a 34px frame that gets a 2px `foreground` ring when active. Not-running projects at 40% opacity. A 9px `blocked` dot top-right when an agent in it waits; else an 8px `working` dot bottom-right while one works. Below a 22×1px divider: spaces no project owns, as 22px `raised` tiles. A 28px bordered **+** at the bottom.
2. **Sidebar** (320px, `chrome`):
   - **Header** (46px): a 20px purple bolt logo, "Super Herdr" (semibold), search and collapse buttons on the right. 20px left padding on macOS.
   - **Tab strip** (40px): three 30px icon tabs (layers icon, files icon, "⋯"); the selected one on `selected`. The first gets a 7px `blocked` dot when an agent waits and another tab is open.
   - **View** (a stack): *Agents*, *Explorer*, or *⋯* (Herdr's Spaces and Agents lists).
   - **Footer** (69px): Settings, Add machine.
3. **Main area**: Herdr's tab bar (with project-aware **+**), the active tab's panes as cards with headers, a hidden right panel (stack: file viewer, Herdr's Changes), and the status bar.

**Agents view:** a bordered "Waiting on you · N" card (only when N > 0) listing blocked agents, then done ones, each with its project name; then the current project: a 22px avatar, its name (14px semibold), its folder (11px `dim`), "Agents · N", one 28px row per agent (status mark, program icon, title, "needs you"/"finished"), and "+ New session". A space that isn't a project shows "Space · not a project" and a **Make it a project…** button.

**Explorer view:** "EXPLORER" with the project name and a **Change** button, the folder path, then a lazy tree (folders first, 28px rows, chevrons, git marks M/A/D/U). A space without a project shows a prompt with **Choose folder…** and **Use <terminal folder>**.

**File viewer:** the file name, its path, a **Source | Preview** switch for `.md/.markdown/.mdx`, and **×**. Source is a read-only code editor with syntax colors; Preview renders Markdown.

## How it behaves

- Agent status: **working**: braille spinner (80ms) in `working`; **blocked**: ● in `blocked` + "needs you"; **done**: ● in `done` + "finished"; **idle**: ○ in `dim`.
- Click a rail tile: switch to the project's space. If it isn't running, adopt an unowned same-named space on this computer, else `space.new {name, folder: main folder, machine: ""}` and link the new space id.
- **+** (rail): system folder picker → project named after the folder → open it.
- Click an agent row: `pane.focus {pane}`. Click a lower-rail space: `space.select`.
- **+** in the tab bar, **Cmd+T**, and right-click tab → New tab: `tab.new` with `folder` = the active project's main folder (unchanged behavior for non-project spaces). Splits keep Herdr's behavior.
- Explorer root = active project's main folder; it changes only when the project changes. Clicking a file sets shared `super-herdr.file` = `{root, on, path}`, selects the right panel's file viewer and shows the panel. **×** clears it and hides the panel.
- Markdown mode (source/preview) is remembered in the viewer's `localStorage`.
- Closing a project's last tab closes its space; the project stays, faded.

## Built from

- Layout `super-herdr`: root row `[rail block (super-rail, 52px, window_drag), sidebar column (320px, not resizable), work column]`. Sidebar: `brand (super-chrome, 46px)`, `sidebar-body` column `[activity (super-views, 40px), sidebar-views stack: projects (super-projects) | explorer (super-explorer, props {mode: "sidebar"}) | classic column (spaces, agents)]`, `sidebar-footer (super-chrome, props {footer: true})`. Work: `tabs (super-tabbar)`, `work-body` row `[main (tab: active), panel column (hidden, 820px, stack panel-body: files → super-file-viewer, changes → changes)]`, `status (workspace-status)`. Root `titlebar: none`, `traffic_lights: [12, 16]`.
- Data: shared `super-herdr.projects` = `[{id, name, folders: [main, ...], spaceId}]`.
- `keys.json`: `"layout:super-herdr": {"cmd-t": "super-tabbar.new_tab"}`, handled with `nextCommand()` in super-tabbar.
- Modified copies of Herdr mods: super-chrome (workspace-chrome), super-explorer (files), super-tabbar (tabs), super-new-menu (new-menu), super-menu (menu). Shipped mods used as-is: spaces, agents, changes, workspace-status, pane.
- herdr API: `spaces, agents, panes, focused, shared, setShared, run, theme, settings, pickFolder, readTextFile, watchFolder, exec, openOverlay, nextCommand, setWindowTitle, layout, props`. gpui-base: `Editor`, `EditorState`, `TextView.markdown`.
- Commands: `space.select, space.new, tab.new, pane.focus, layout.select, layout.show, layout.hide`.
- Programs: `git`, `sh` (PowerShell on Windows) in the Explorer. No network.
- Art: `mods/super-chrome/logo.svg` (original bolt on a #8B6CFF→#5B3DF0 gradient); Lucide icons.

## Watch out

- Create each mod's `mod.json` (`{"place": "none"}`) **before** its `main.js`, or Herdr docks a stray copy into the layout the first time it sees the folder.
- A Herdr space is temporary: link projects by space id and expect the id to disappear.
- `space.new` doesn't return the new id to a mod: diff `spaces()` before and after.
- Rail tiles sit in a `window_drag` block: stop `mouse_down` propagation on each tile or clicks can become window drags.
- A multi-line textarea in gpui-kit inserts the newline before emitting submit (not used here, but bit the chat prototype).
- The collapsed Herdr sidebar (76px) has no compact mode for these views.
- Projects are this computer only; spaces on other machines appear under the divider. Multi-folder projects store extra folders but only the first is used.

## Done when

- `herdr-app check` passes for all nine `super-*` mods and `herdr-app status` shows no errors with the layout shown.
- Creating a project from **+** opens a space named after the folder, and its tile gets the active ring.
- In a project, Cmd+T and **+ → Terminal** open a shell whose `pwd` is the project's main folder.
- Closing every tab of a project leaves its tile faded; clicking it starts a space in the same folder.
- An agent that blocks appears under **Waiting on you** with its project name, and its project's tile shows the red dot.
- The Explorer shows the project folder and doesn't change when switching tabs; clicking a `.md` file opens the panel with a working Source/Preview switch.
