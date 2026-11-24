// File viewer (Super Herdr): shows the file picked in the sidebar Explorer.
// The Explorer publishes { root, on, path } as shared "super-herdr.file".
// Markdown files get a Source | Preview toggle, like Cursor and VS Code.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, Editor, EditorState, TextView } from "gpui-base";
import { readTextFile, shared, setShared, theme, settings, run } from "herdr";

const LANG = { ts: "js", tsx: "js", mts: "js", cts: "js", jsx: "js", mjs: "js", toml: "yaml", jsonc: "json", svelte: "html", vue: "html", markdown: "md", mdx: "md" };
const MARKDOWN = new Set(["md", "markdown", "mdx"]);
const MAX = 400000;

const extOf = path => {
  const name = path.split("/").pop();
  return name.includes(".") ? name.split(".").pop().toLowerCase() : "txt";
};

function loadMode() {
  try { return localStorage.getItem("markdownMode") === "source" ? "source" : "preview"; } catch { return "preview"; }
}
function saveMode(mode) {
  try { localStorage.setItem("markdownMode", mode); } catch {}
}

export default class FileViewer extends View {
  init() {
    this.loaded = null; // JSON key of the file currently shown or loading
    this.code = null;
    this.text = null;
    this.error = null;
    this.mode = loadMode(); // "preview" | "source", remembered for Markdown files
  }

  load(open, cx) {
    const key = open ? JSON.stringify([open.on ?? null, open.root, open.path]) : null;
    if (key === this.loaded) return;
    this.loaded = key;
    this.code?.release(); this.code = null; this.text = null; this.error = null;
    if (!open) return;
    cx.spawn(async cx => {
      try {
        const text = await readTextFile(`${open.root}/${open.path}`, { on: open.on ?? null });
        if (this.loaded !== key) return;
        if (text === null) { this.error = "This file is no longer available"; return; }
        if (text.includes("\0")) { this.error = "Binary file · no text preview"; return; }
        const t = theme(), ext = extOf(open.path);
        this.text = text.length > MAX ? text.slice(0, MAX) + "\n… (file truncated)" : text;
        this.code = EditorState.new({ language: LANG[ext] ?? ext, readonly: true, value: this.text,
          syntax: { keyword: t.ansi5, string: t.ansi2, comment: t.dim, function: t.ansi4, type: t.ansi3, number: t.ansi1, constant: t.ansi6 } });
      } catch {
        if (this.loaded === key) this.error = "Cannot preview this file (binary, too large, or unreadable)";
      } finally { cx.notify(); }
    });
  }

  toggle(t) {
    const option = (mode, label) => {
      const on = this.mode === mode;
      return div().id(`md-${mode}`).px(8).h(22).flex().items_center().rounded(5).cursor_pointer().text_size(12)
        .text_color(on ? t.foreground : t.dim)
        .when(on, el => el.bg(t.selected))
        .hover(s => s.text_color(t.foreground))
        .on_click((_e, cx) => { this.mode = mode; saveMode(mode); cx.notify(); })
        .child(label);
    };
    return h_flex().flex_none().p(2).gap(2).rounded(7).border_1().border_color(t.border)
      .child(option("source", "Source"))
      .child(option("preview", "Preview"));
  }

  render(cx) {
    const open = shared("super-herdr.file") ?? null;
    this.load(open, cx);
    const t = theme();
    const markdown = Boolean(open) && MARKDOWN.has(extOf(open.path));
    let body;
    if (!open) body = div().flex_1().flex().items_center().justify_center().text_color(t.dim).child("Pick a file in the Explorer");
    else if (!this.code) body = div().p(12).text_color(t.dim).child(this.error || "Loading file…");
    else if (markdown && this.mode === "preview") {
      body = div().id("md-preview-scroll").flex_1().min_h(0).overflow_y_scrollbar()
        .child(div().px(24).py(16).text_size(14).text_color(t.foreground)
          .child(TextView.markdown(`md-preview-${this.loaded}`, this.text).selectable(true)));
    } else body = Editor.new(this.code).font_family(settings().font_family).text_size(settings().font_size).flex_1().min_h(0);

    return v_flex().id("file-viewer").size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border).text_color(t.foreground).text_size(13)
      .child(h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
        .child(div().font_semibold().flex_none().child(open ? open.path.split("/").pop() : "File"))
        .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.dim).child(open?.path ?? ""))
        .when(markdown && Boolean(this.code), el => el.child(this.toggle(t)))
        .when(Boolean(open), el => el.child(div().id("file-viewer-close").w(20).flex_none().cursor_pointer().text_color(t.muted)
          .on_click(() => { setShared("super-herdr.file", null); run("layout.hide", { id: "panel" }); }).child("×"))))
      .child(body);
  }
}
