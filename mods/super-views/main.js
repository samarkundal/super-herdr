// Sidebar tabs (Super Herdr): a Cursor-style tab strip at the top of the sidebar that
// switches the view below it (the `sidebar-views` stack). Tabs use height, not width.
// The Projects tab shows a dot when an agent is waiting on you and another tab is open,
// so stuck agents are never hidden.
import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { layout, theme, run, agents } from "herdr";

const STACK = "sidebar-views";
const TABS = [
  { id: "projects", label: "This project: agents", icon: "mods/super-views/workspace.svg" },
  { id: "explorer", label: "Explorer", icon: "mods/super-views/explorer.svg" },
  { id: "classic", label: "More: Herdr's Spaces and Agents lists", glyph: "⋯" },
];

function find(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

export default class SidebarTabs extends View {
  render() {
    const t = theme();
    const active = find(layout(), STACK)?.active ?? TABS[0].id;
    const waiting = agents().some(a => a.status === "blocked" || a.status === "done");
    return h_flex().id("sidebar-tabs").size_full().px(10).gap(4).items_center().bg(t.chrome)
      .children(TABS.map(tab => {
        const on = tab.id === active;
        return div().id(`sidebar-tab-${tab.id}`).relative().size(30).flex().items_center().justify_center().rounded(7).cursor_pointer()
          .text_color(on ? t.foreground : t.dim)
          .when(on, el => el.bg(t.selected))
          .hover(s => s.bg(t.hover).text_color(t.foreground))
          .tooltip(tab.label)
          .on_click(() => run("layout.select", { stack: STACK, child: tab.id }))
          .child(tab.icon ? svg(tab.icon).size(16) : div().text_size(15).child(tab.glyph))
          .when(tab.id === "projects" && waiting && !on, el => el.child(div().absolute().top(4).right(4).size(7).rounded_full().bg(t.blocked)));
      }));
  }
}
