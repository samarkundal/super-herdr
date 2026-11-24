// Project rail (Super Herdr): a Slack-style column of project avatars on the far left.
// Click one to switch to it (or start it in its main folder); a dot shows when an
// agent in it waits on you. Spaces no project owns sit below a divider, smaller,
// so nothing disappears. + creates a project from a folder.
//
// Projects live in shared "super-herdr.projects" (see the `projects` mod).
import { View, div, svg } from "gpui-kit";
import { v_flex } from "gpui-base";
import { spaces, agents, shared, setShared, run, theme, pickFolder, home, window, checking } from "herdr";

const PROJECTS = "super-herdr.projects";

// Super Herdr was called Herdr Code: carry the projects list over from its old key once.
function migrateName() {
  if (!Array.isArray(shared(PROJECTS)) && Array.isArray(shared("herdr-code.projects"))) setShared(PROJECTS, shared("herdr-code.projects"));
}

const COLORS = ["ansi6", "ansi3", "ansi4", "ansi5", "ansi2", "ansi1"]; // same order as the projects mod
const WAITING = new Set(["blocked", "done"]);

const list = () => (Array.isArray(shared(PROJECTS)) ? shared(PROJECTS) : []);
const save = next => setShared(PROJECTS, next);
const update = (id, change) => save(list().map(p => (p.id === id ? { ...p, ...change } : p)));
const newId = () => `pr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const base = path => String(path).split("/").filter(Boolean).pop() ?? path;
const spaceOf = p => (p.spaceId ? spaces().find(s => s.id === p.spaceId) ?? null : null);
const initial = name => [...String(name)][0]?.toUpperCase() ?? "?";

export default class ProjectRail extends View {
  init() {
    this.opening = null;
    if (!checking()) migrateName();
  }

  // Same rules as the projects mod: switch to its space, adopt a same-named one, or start one.
  open(project, cx) {
    const running = spaceOf(project);
    if (running) { run("space.select", { id: running.id }); return; }
    const owned = new Set(list().map(p => p.spaceId).filter(Boolean));
    const twin = spaces().find(s => !s.machine && s.name === project.name && !owned.has(s.id));
    if (twin) { update(project.id, { spaceId: twin.id }); run("space.select", { id: twin.id }); return; }
    const before = new Set(spaces().map(s => s.id));
    this.opening = project.id;
    run("space.new", { name: project.name, folder: project.folders[0], machine: "" });
    cx.spawn(async cx => {
      for (let i = 0; i < 50; i++) {
        await cx.sleep(100);
        const created = spaces().find(s => !before.has(s.id));
        if (created) { update(project.id, { spaceId: created.id }); break; }
      }
      this.opening = null;
      cx.notify();
    });
  }

  create(cx) {
    cx.spawn(async cx => {
      const folder = await pickFolder({ prompt: "Create project" });
      if (!folder) return;
      const existing = list().find(p => p.folders[0] === folder);
      if (existing) { this.open(existing, cx); return; }
      const project = { id: newId(), name: base(folder), folders: [folder], spaceId: null };
      save([...list(), project]);
      this.open(project, cx);
    });
  }

  // A rounded tile with a ring when active and a dot when something waits on you.
  tile({ id, label, color, active, dim, waiting, working, size, tip, onClick }, t) {
    return div().id(id).relative().flex_none().size(size + 6).flex().items_center().justify_center().rounded(Math.round(size * 0.36))
      .border_2().border_color(active ? t.foreground : "#00000000")
      .cursor_pointer().tooltip(tip)
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()) // the rail drags the window; tiles don't
      .on_click(onClick)
      .child(div().size(size).flex().items_center().justify_center().rounded(Math.round(size * 0.3)).bg(color)
        .text_size(Math.round(size * 0.42)).font_bold().text_color("#ffffff")
        .when(dim, el => el.opacity(0.4))
        .hover(s => s.opacity(dim ? 0.7 : 0.88))
        .child(label))
      .when(waiting, el => el.child(div().absolute().top(-1).right(-1).size(9).rounded_full().bg(t.blocked).border_2().border_color(t.chrome)))
      .when(!waiting && working, el => el.child(div().absolute().bottom(-1).right(-1).size(8).rounded_full().bg(t.working ?? t.accent).border_2().border_color(t.chrome)));
  }

  render() {
    const t = theme();
    const all = agents();
    const projects = list();
    const owned = new Set(projects.map(p => p.spaceId).filter(Boolean));
    const others = spaces().filter(s => !owned.has(s.id));
    const mac = window()?.platform === "macos" && !window()?.fullscreen;
    const status = spaceId => {
      const mine = all.filter(a => a.space === spaceId);
      return { waiting: mine.some(a => WAITING.has(a.status)), working: mine.some(a => a.status === "working") };
    };
    return v_flex().id("project-rail").size_full().min_h(0).items_center().bg(t.chrome).border_r(1).border_color(t.border)
      .pt(mac ? 44 : 10).pb(10)
      .child(v_flex().id("rail-scroll").flex_1().min_h(0).w_full().items_center().gap(5).overflow_y_scrollbar()
        .children(projects.map((p, i) => {
          const space = spaceOf(p);
          const s = space ? status(space.id) : { waiting: false, working: false };
          const state = this.opening === p.id ? "starting…" : space ? (s.waiting ? "waiting on you" : s.working ? "working" : "running") : "not running";
          return this.tile({
            id: `rail-${p.id}`, label: initial(p.name), color: t[COLORS[i % COLORS.length]], active: Boolean(space?.active), dim: !space,
            waiting: s.waiting, working: s.working, size: 28,
            tip: `${p.name} · ${state}\n${p.folders[0].replace(home(), "~")}`,
            onClick: (_e, cx) => this.open(p, cx),
          }, t);
        }))
        .when(others.length > 0, el => el
          .child(div().w(22).h(1).my(2).flex_none().bg(t.border))
          .children(others.map(sp => {
            const s = status(sp.id);
            return this.tile({
              id: `rail-space-${sp.id}`, label: initial(sp.name), color: t.raised, active: sp.active, dim: false,
              waiting: s.waiting, working: s.working, size: 22,
              tip: `${sp.name}${sp.machine ? " · " + sp.machine : ""} · space, not a project`,
              onClick: () => run("space.select", { id: sp.id }),
            }, t);
          }))))
      .child(div().id("rail-new").flex_none().mt(6).size(28).flex().items_center().justify_center().rounded(9)
        .border_1().border_color(t.border).text_color(t.dim).cursor_pointer()
        .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
        .hover(s => s.bg(t.hover).text_color(t.foreground)).tooltip("New project from a folder")
        .on_click((_e, cx) => this.create(cx))
        .child(svg("mods/super-rail/plus.svg").size(13)));
  }
}
