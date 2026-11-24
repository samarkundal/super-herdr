// Projects (Super Herdr): permanent projects that outlive Herdr spaces, with their
// agents nested under them and a "Waiting on you" section for every agent that
// needs you, in any project.
//
// A project is { id, name, folders: [main, ...], spaceId }, saved in shared
// "super-herdr.projects". A Herdr space disappears when its last tab closes; a
// project stays listed ("not running") and clicking it starts a fresh space in
// its main folder. `spaceId` links the project to its running space.
import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { spaces, agents, shared, setShared, run, theme, pickFolder, home, checking, openOverlay } from "herdr";

const PROJECTS = "super-herdr.projects";

// Super Herdr was called Herdr Code: carry the projects list over from its old key once.
function migrateName() {
  if (!Array.isArray(shared(PROJECTS)) && Array.isArray(shared("herdr-code.projects"))) setShared(PROJECTS, shared("herdr-code.projects"));
}

const OLD_PINS = "herdr-code.workspaces"; // step 1's per-space pins, migrated once
const COLORS = ["ansi6", "ansi3", "ansi4", "ansi5", "ansi2", "ansi1"];
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const WAITING = { blocked: 0, done: 1 };

const list = () => (Array.isArray(shared(PROJECTS)) ? shared(PROJECTS) : []);
const save = next => setShared(PROJECTS, next);
const update = (id, change) => save(list().map(p => (p.id === id ? { ...p, ...change } : p)));
const newId = () => `pr-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const base = path => String(path).split("/").filter(Boolean).pop() ?? path;
const spaceOf = p => (p.spaceId ? spaces().find(s => s.id === p.spaceId) ?? null : null);

// Same cleanup as Herdr's agents list: drop a leading status glyph or spinner from the title.
const clean = s => (s ?? "").replace(/^(?:\[ [!.] \] |[✋⏳]️?(?=\s)|(?!(?:\p{Emoji}️|[#*]⃣))[^\p{L}\p{N}\p{Ps}\p{Pi}\p{Emoji_Presentation}])+/u, "").trim();
const agentLabel = a => a.pane_name || clean(a.title) || a.tab_name || a.program?.name || a.address;
const icon = (p, size, color) => (!p?.icon ? null : p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none());

function migratePins() {
  const pins = shared(OLD_PINS);
  if (!pins || typeof pins !== "object") return;
  const next = list().slice();
  for (const [spaceId, pin] of Object.entries(pins)) {
    const folder = pin?.folders?.[0];
    if (!folder || next.some(p => p.spaceId === spaceId)) continue;
    const space = spaces().find(s => s.id === spaceId);
    next.push({ id: newId(), name: space?.name ?? base(folder), folders: [folder], spaceId });
  }
  save(next);
  setShared(OLD_PINS, null);
}

export default class Projects extends View {
  init() {
    this.opening = null;
    if (!checking()) { migrateName(); migratePins(); }
  }

  // ---------- actions ----------

  // Switch to the project's space, or start one in its main folder.
  open(project, cx) {
    const running = spaceOf(project);
    if (running) { run("space.select", { id: running.id }); return; }
    // A same-named space on this computer that no project owns yet becomes this project's.
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

  remove(project) {
    // Only forgets the project: its files and any running tabs stay as they are.
    save(list().filter(p => p.id !== project.id));
  }

  // ---------- pieces ----------

  statusMark(a, t) {
    if (a.status === "working") return div().w(14).flex_none().text_color(t.working ?? t.accent).frames(SPINNER, 80);
    const color = a.status === "blocked" ? t.blocked : a.status === "done" ? t.done : t.dim;
    return div().w(14).flex_none().text_color(color).child(a.status === "idle" ? "○" : "●");
  }

  agentRow(a, t, { indent = 30, where = null } = {}) {
    const note = a.status === "blocked" ? "needs you" : a.status === "done" ? "finished" : "";
    return h_flex().id(`agent-${a.address}`).h(28).flex_none().pl(indent).pr(8).gap(7).items_center().rounded(7).cursor_pointer()
      .when(a.focused, el => el.bg(t.selected))
      .when(!a.focused, el => el.hover(s => s.bg(t.hover)))
      .tooltip(`${a.space_name} · ${a.tab_name}`)
      .on_click(() => run("pane.focus", { pane: a.pane }))
      .child(this.statusMark(a, t))
      .child(icon(a.program, 14, t.foreground) ?? div().w(14).flex_none())
      .when(Boolean(where), el => el.child(div().flex_none().max_w(90).truncate().text_size(12).text_color(t.dim).child(where)))
      .child(div().flex_1().min_w(0).truncate().text_size(12.5).text_color(a.focused ? t.foreground : t.muted).child(agentLabel(a)))
      .when(Boolean(note), el => el.child(div().flex_none().text_size(11).text_color(a.status === "blocked" ? t.blocked : t.done).child(note)));
  }

  waitingSection(all, t) {
    const waiting = all.filter(a => a.status in WAITING).sort((a, b) => WAITING[a.status] - WAITING[b.status] || b.seq - a.seq);
    if (!waiting.length) return null;
    const projectName = a => list().find(p => p.spaceId === a.space)?.name ?? a.space_name;
    return v_flex().flex_none().mb(6).p(4).gap(1).rounded(10).border_1().border_color(t.border).bg(t.surface ?? t.chrome)
      .child(h_flex().h(26).px(6).items_center().gap(6).text_size(11.5)
        .child(div().text_color(t.blocked).child("●"))
        .child(div().text_color(t.foreground).font_medium().child("Waiting on you"))
        .child(div().text_color(t.dim).child(String(waiting.length))))
      .children(waiting.map(a => this.agentRow(a, t, { indent: 6, where: projectName(a) })));
  }

  // The project (or plain space) you're in: its agents and a way to start a new session.
  currentSection(all, t) {
    const space = spaces().find(s => s.active);
    if (!space) return div().px(16).py(12).text_size(12).text_color(t.dim).child("Pick a project on the left.");
    const projects = list();
    const index = projects.findIndex(p => p.spaceId === space.id);
    const project = index >= 0 ? projects[index] : null;
    const mine = all.filter(a => a.space === space.id);
    const color = project ? t[COLORS[index % COLORS.length]] : t.raised;
    const head = v_flex().px(12).pt(4).pb(8).gap(2)
      .child(h_flex().gap(9).items_center()
        .child(h_flex().size(22).flex_none().rounded(6).bg(color).items_center().justify_center()
          .text_size(11.5).font_bold().text_color("#ffffff").child([...(project?.name ?? space.name)][0]?.toUpperCase() ?? "?"))
        .child(div().flex_1().min_w(0).truncate().text_size(14).font_semibold().text_color(t.foreground).child(project?.name ?? space.name))
        .when(Boolean(project), el => el.child(div().id("project-remove").flex_none().px(5).rounded(4).text_size(12).text_color(t.dim)
          .hover(s => s.bg(t.hover).text_color(t.foreground)).tooltip("Remove from Projects (files and tabs stay)")
          .on_click(() => this.remove(project)).child("×"))))
      .child(div().pl(31).text_size(11).text_color(t.dim).truncate()
        .child(project ? project.folders[0].replace(home(), "~") : `Space${space.machine ? " on " + space.machine : ""} · not a project`))
      .when(!project && !space.machine, el => el.child(div().id("make-project").ml(31).mt(6).self_start().h(26).px(10).flex().items_center().rounded(7)
        .text_size(12).bg(t.solid).text_color(t.solid_foreground).cursor_pointer()
        .on_click((_e, cx) => this.makeProject(space, cx)).child("Make it a project…")));
    return v_flex().flex_none().gap(1)
      .child(head)
      .child(h_flex().h(24).px(12).items_center().text_size(11.5).text_color(t.dim).child(`Agents · ${mine.length}`))
      .children(mine.map(a => this.agentRow(a, t, { indent: 12 })))
      .when(mine.length === 0, el => el.child(div().px(14).py(4).text_size(12).text_color(t.dim).child("No agents running here yet.")))
      .child(h_flex().id("project-session").h(28).flex_none().mx(0).pl(12).gap(7).items_center().rounded(7)
        .text_size(12).text_color(t.dim).cursor_pointer().hover(s => s.bg(t.hover).text_color(t.foreground))
        .on_click(() => openOverlay({ mod: "super-new-menu", kind: "popup", width: 250, height: 512 }))
        .child(div().w(14).flex_none().child("+")).child("New session"));
  }

  makeProject(space, cx) {
    cx.spawn(async () => {
      const folder = await pickFolder({ prompt: "Make it a project" });
      if (!folder) return;
      save([...list(), { id: newId(), name: space.name, folders: [folder], spaceId: space.id }]);
    });
  }

  render() {
    const t = theme();
    const all = agents();
    return v_flex().id("projects").size_full().min_h(0).bg(t.chrome).text_size(13)
      .child(v_flex().id("projects-scroll").flex_1().min_h(0).pt(6).pb(10).px(8).gap(4).overflow_y_scrollbar()
        .child(this.waitingSection(all, t) ?? div())
        .child(this.currentSection(all, t)));
  }
}
