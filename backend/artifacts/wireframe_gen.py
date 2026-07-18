"""
artifacts/wireframe_gen.py
Generates a premium, fully interactive HTML wireframe from the UI Designer Agent JSON.

Strategy:
  1. If DEEPSEEK_API_KEY is set, calls DeepSeek to produce a complete Tailwind + Chart.js
     interactive page with working navigation, modals, toasts, and charts.
  2. Falls back to a rich template-rendered HTML using the structured data directly.
     The fallback itself has Chart.js charts, working modals, and toast notifications.

Usage:
    await generate_wireframe(ui_spec, idea, session_dir)
    # Writes: session_dir/wireframe.html
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any


# ─────────────────────────────────────────────────────────────────────────────
# DeepSeek System Prompt
# ─────────────────────────────────────────────────────────────────────────────

WIREFRAME_SYSTEM_PROMPT = """You are a world-class senior frontend developer and UI/UX designer specializing in premium, interactive SaaS dashboards. Your task is to generate a SINGLE, complete, self-contained HTML file for a startup wireframe.

MANDATORY CDN LIBRARIES — include these EXACT script/link tags in <head>:
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  (Google Fonts link for the chosen font)

MANDATORY FUNCTIONALITY — ALL must work perfectly:
1. SIDEBAR NAVIGATION: Fixed left sidebar. Each nav item calls showScreen(id, this) to switch the visible screen panel. The active nav item must be visually highlighted.
2. WORKING MODALS: At least 2 modals triggered by clickable buttons (e.g. "+ Add New", "Create"). Each modal has an HTML form with 3-4 relevant fields + a submit button. Clicking outside the modal closes it. X button closes it.
3. TOAST NOTIFICATIONS: Clicking any action button (Save, Delete, Export, Share, etc.) shows a colored toast notification in the top-right corner that auto-dismisses after 3 seconds.
4. CHART.JS CHARTS: At least 2 real Chart.js canvas charts with realistic, idea-specific data labels and values. Charts must render in the dashboard screen.
5. SEARCH FILTER: A search input that filters table rows in real-time as the user types.
6. WORKING FORMS: At least one form with validation — highlights empty required fields red, shows error toast, shows success toast on valid submission.
7. EVERY BUTTON MUST DO SOMETHING: Open modal, show toast, navigate, filter — no dead buttons.

VISUAL DESIGN — PREMIUM DARK GLASSMORPHISM:
- Background: linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #1a1f3a 100%)
- Cards/panels: background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 12-16px
- Typography: gradient text headings (using the primary color), white body text, muted secondary text
- Buttons: rounded-xl, primary color background, hover effects with opacity change + translateY(-1px)
- Inputs: dark background, subtle border, glow focus effect with primary color
- Tables: dark rows with hover highlight, colored status badges
- Sidebar: slightly darker background, clean nav items with active state
- Animations: smooth CSS transitions on all interactive elements (transition: all 0.2s ease)
- Custom scrollbar: thin, dark styled

SCREEN CONTENT RULES:
- Generate realistic, idea-specific content (NOT Lorem Ipsum, NOT generic SaaS data)
- Table rows must have columns and data that match the startup's actual domain
- Chart labels and data must represent real metrics for this startup
- Form fields must be what a real user of this product would input
- KPI card numbers must be realistic for the startup's stage

OUTPUT FORMAT:
Return ONLY the raw HTML starting with <!DOCTYPE html>.
No markdown fences. No explanation. No commentary.
The file must be 100% self-contained and work by opening in a browser."""


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

async def generate_wireframe(
    ui_spec: dict[str, Any],
    idea: str,
    session_dir: Path,
) -> Path:
    """Generate an interactive HTML wireframe and write to session_dir/wireframe.html."""
    out_path = session_dir / "wireframe.html"

    api_key = os.getenv("DEEPSEEK_API_KEY")
    if api_key:
        try:
            html = await _generate_via_deepseek(ui_spec, idea, api_key)
            if html and "<!DOCTYPE" in html[:30]:
                out_path.write_text(html, encoding="utf-8")
                return out_path
            print("[wireframe_gen] DeepSeek response was not valid HTML, using template.")
        except Exception as exc:
            print(f"[wireframe_gen] DeepSeek generation failed ({exc}), using template fallback.")

    # Template fallback — always works, no API required
    html = _generate_from_template(ui_spec, idea)
    out_path.write_text(html, encoding="utf-8")
    return out_path


# ─────────────────────────────────────────────────────────────────────────────
# DeepSeek-powered generation
# ─────────────────────────────────────────────────────────────────────────────

async def _generate_via_deepseek(ui_spec: dict, idea: str, api_key: str) -> str:
    """Call DeepSeek to produce a premium interactive HTML wireframe."""
    try:
        import httpx
    except ImportError as exc:
        raise RuntimeError("httpx is required for DeepSeek wireframe generation.") from exc

    ds      = ui_spec.get("design_system") or ui_spec.get("visual_style", {})
    primary = ds.get("primary_color", "#6366F1")
    accent  = ds.get("accent_color", "#10B981")
    font    = ds.get("font", "Inter")
    screens = _normalize_screens(ui_spec)

    screens_desc = "\n".join(
        f"  - {s['name']}: {', '.join((s.get('components') or s.get('key_components') or ['content panel'])[:4])}"
        for s in screens
    )
    flows = (ui_spec.get("key_user_flows") or ui_spec.get("wireframe_notes") or [])[:3]

    user_prompt = (
        f'Startup Idea: "{idea}"\n\n'
        f"Design System:\n"
        f"  Primary Color: {primary}\n"
        f"  Accent Color: {accent}\n"
        f"  Font: {font}\n\n"
        f"Screens to implement as sidebar nav items:\n{screens_desc}\n\n"
        f"Key User Flows to implement as real interactions:\n"
        + "\n".join(f"  - {f}" for f in flows)
        + f"\n\nGenerate a complete, interactive, glassmorphism dark-theme dashboard wireframe "
        f"for this startup. Use the primary color {primary} throughout for buttons, "
        f"active states, chart colors, and accents. All buttons must be functional."
    )

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.deepseek.com/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": WIREFRAME_SYSTEM_PROMPT},
                    {"role": "user",   "content": user_prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 8000,
            },
        )
        resp.raise_for_status()
        html = resp.json()["choices"][0]["message"]["content"].strip()

    # Strip accidental markdown fences
    if html.startswith("```"):
        lines = html.splitlines()
        end   = len(lines) - 1 if lines and lines[-1].strip() == "```" else len(lines)
        html  = "\n".join(lines[1:end])

    return html


# ─────────────────────────────────────────────────────────────────────────────
# Template fallback — rich, interactive HTML
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_screens(ui_spec: dict) -> list[dict[str, Any]]:
    raw = ui_spec.get("screens", [])
    result: list[dict[str, Any]] = []

    for idx, s in enumerate(raw):
        if isinstance(s, str):
            result.append({"name": s, "components": [f"{s} content", "Action controls"]})
            continue
        if not isinstance(s, dict):
            continue
        comps = (
            s.get("components")
            or s.get("key_components")
            or ([s["purpose"]] if s.get("purpose") else [])
            or [f"{s.get('name', f'Screen {idx+1}')} module"]
        )
        result.append({"name": s.get("name") or f"Screen {idx+1}", "components": comps})

    if not result:
        result = [
            {"name": "Dashboard", "components": ["KPI metrics", "Activity chart", "Recent items"]},
            {"name": "Catalog",   "components": ["Search bar", "Data table", "Detail panel"]},
            {"name": "Analytics", "components": ["Trend charts", "Breakdown table", "Export"]},
        ]
    return result


def _safe_id(name: str) -> str:
    return re.sub(r"[^\w]", "_", name.lower().strip())


def _screen_icon(name: str) -> str:
    icons = {
        "dashboard": "📊", "analytic": "📈", "report": "📉", "metric": "📏",
        "user": "👥", "customer": "👤", "team": "👨‍💼", "profile": "👤",
        "product": "📦", "catalog": "🗂", "inventory": "🏪", "order": "🛒",
        "payment": "💳", "billing": "💰", "subscription": "🔄", "revenue": "💵",
        "setting": "⚙️", "config": "🔧", "admin": "🛡", "permission": "🔐",
        "message": "💬", "chat": "🗨", "notif": "🔔", "inbox": "📥",
        "map": "🗺", "location": "📍", "delivery": "🚚", "route": "🛤",
        "calendar": "📅", "schedule": "⏰", "task": "✅", "project": "📋",
        "pet": "🐾", "food": "🍽", "health": "❤️", "doc": "📄",
    }
    nl = name.lower()
    for key, icon in icons.items():
        if key in nl:
            return icon
    return "◈"


def _generate_from_template(ui_spec: dict, idea: str) -> str:
    ds      = ui_spec.get("design_system") or ui_spec.get("visual_style", {})
    primary = ds.get("primary_color", "#6366F1")
    accent  = ds.get("accent_color",  "#10B981")
    font    = ds.get("font",          "Inter")
    screens = _normalize_screens(ui_spec)
    flows   = (ui_spec.get("key_user_flows") or ui_spec.get("wireframe_notes") or [])[:4]

    label     = (idea.strip()[:44] + "…") if len(idea) > 44 else idea.strip()
    font_url  = font.replace(" ", "+")

    # ── CSS (no f-string placeholders in the CSS itself — escape all Python {} via f-string)
    css = _build_css(primary, accent, font)

    # ── Sidebar nav items
    nav_items = ""
    for s in screens:
        sid   = _safe_id(s["name"])
        icon  = _screen_icon(s["name"])
        nav_items += (
            f'<button class="nav-item w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl'
            f' text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200"'
            f' onclick="showScreen(\'{sid}\', this)" data-name="{s["name"]}">'
            f'<span class="text-base">{icon}</span>{s["name"]}</button>\n'
        )

    flows_html = "".join(
        f'<li class="flex items-start gap-2 text-xs text-white/35 leading-relaxed">'
        f'<span style="color:{accent}; flex-shrink:0">›</span>{f}</li>\n'
        for f in flows
    )

    # ── Screen panels
    panels_html = ""
    for idx, s in enumerate(screens):
        panels_html += _build_screen_panel(s, idx, idea, primary, accent)

    # ── Modals
    modals_html = _build_modals(screens, idea, primary, accent)

    # ── JavaScript (built as plain string — no f-string on the JS block itself)
    js = _build_js(screens, primary, accent)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{label} — Wireframe</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family={font_url}:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>{css}</style>
</head>
<body>

  <!-- ── Toast container ─────────────────────────────────────────────── -->
  <div id="toast-container"></div>

  <!-- ── Modals ──────────────────────────────────────────────────────── -->
  {modals_html}

  <!-- ── Top Navbar ──────────────────────────────────────────────────── -->
  <header class="navbar">
    <div class="flex items-center gap-3">
      <div class="logo-mark" style="background: {primary};">
        {label[0].upper()}
      </div>
      <div>
        <div class="text-white font-semibold text-sm leading-tight">{label}</div>
        <div class="text-white/30 text-xs">Wireframe Preview</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button class="btn-ghost" onclick="showToast('Notifications coming soon', 'info')">🔔</button>
      <button class="btn-ghost" onclick="showToast('Settings coming soon', 'info')">⚙️</button>
      <div class="avatar">{label[0].upper()}</div>
    </div>
  </header>

  <!-- ── Layout ──────────────────────────────────────────────────────── -->
  <div class="layout">

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="px-3 mb-4">
        <p class="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">Navigation</p>
        <div class="flex flex-col gap-1">
          {nav_items}
        </div>
      </div>

      <!-- User Flows -->
      <div class="mt-auto px-3 pt-4 border-t border-white/5">
        <p class="text-white/25 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">Key Flows</p>
        <ul class="space-y-2 px-1">{flows_html}</ul>
      </div>
    </aside>

    <!-- Main content area -->
    <main class="main-area" id="main-content">
      {panels_html}
    </main>

  </div>

  <script>{js}</script>
</body>
</html>"""


# ─────────────────────────────────────────────────────────────────────────────
# CSS
# ─────────────────────────────────────────────────────────────────────────────

def _build_css(primary: str, accent: str, font: str) -> str:
    return f"""
*{{font-family:'{font}',sans-serif;margin:0;padding:0;box-sizing:border-box;}}
body{{background:linear-gradient(135deg,#0a0f1e 0%,#0f172a 60%,#1a1f3a 100%);min-height:100vh;color:white;overflow-x:hidden;}}
.navbar{{position:fixed;top:0;left:0;right:0;z-index:200;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;background:rgba(10,15,30,0.85);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.07);}}
.sidebar{{position:fixed;left:0;top:56px;bottom:0;width:220px;background:rgba(10,15,30,0.6);backdrop-filter:blur(12px);border-right:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;padding:1rem 0;overflow-y:auto;z-index:100;}}
.layout{{display:flex;padding-top:56px;min-height:100vh;}}
.main-area{{margin-left:220px;flex:1;padding:1.75rem;overflow-y:auto;}}
.logo-mark{{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:white;}}
.avatar{{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:white;cursor:pointer;}}
.btn-ghost{{background:transparent;border:none;color:rgba(255,255,255,0.5);cursor:pointer;padding:6px 8px;border-radius:8px;font-size:15px;transition:all 0.2s;}}
.btn-ghost:hover{{background:rgba(255,255,255,0.08);color:white;}}
.nav-item.active{{background:linear-gradient(90deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04)) !important;color:white !important;border-left:2px solid {primary};}}
.screen-panel{{display:none;animation:fadeIn 0.3s ease;}}
.screen-panel.active{{display:block;}}
@keyframes fadeIn{{from{{opacity:0;transform:translateY(8px)}}to{{opacity:1;transform:translateY(0)}}}}
.glass{{background:rgba(255,255,255,0.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-radius:14px;}}
.glass-card{{background:rgba(255,255,255,0.04);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:1.25rem;transition:all 0.2s;}}
.glass-card:hover{{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.12);transform:translateY(-2px);}}
.kpi-value{{font-size:2rem;font-weight:700;letter-spacing:-0.03em;}}
.section-title{{font-size:1.4rem;font-weight:700;background:linear-gradient(135deg,{primary},rgba(255,255,255,0.9));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}}
.btn-primary{{background:{primary};color:white;padding:0.5rem 1.1rem;border-radius:10px;font-weight:600;font-size:0.8125rem;border:none;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:6px;}}
.btn-primary:hover{{opacity:0.85;transform:translateY(-1px);box-shadow:0 8px 24px {primary}55;}}
.btn-secondary{{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.8);padding:0.5rem 1rem;border-radius:10px;font-weight:600;font-size:0.8125rem;border:1px solid rgba(255,255,255,0.1);cursor:pointer;transition:all 0.2s;}}
.btn-secondary:hover{{background:rgba(255,255,255,0.12);color:white;}}
.badge{{display:inline-flex;align-items:center;padding:0.2rem 0.65rem;border-radius:20px;font-size:0.7rem;font-weight:600;letter-spacing:0.02em;}}
.badge-green{{background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.25);}}
.badge-red{{background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.25);}}
.badge-blue{{background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.25);}}
.badge-amber{{background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.25);}}
.data-input{{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:white;padding:0.55rem 0.875rem;border-radius:10px;width:100%;outline:none;font-size:0.8125rem;transition:border-color 0.2s;}}
.data-input:focus{{border-color:{primary};box-shadow:0 0 0 3px {primary}22;}}
.data-input::placeholder{{color:rgba(255,255,255,0.25);}}
.data-table{{width:100%;border-collapse:collapse;}}
.data-table th{{padding:0.65rem 1rem;text-align:left;font-size:0.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.3);border-bottom:1px solid rgba(255,255,255,0.06);}}
.data-table td{{padding:0.75rem 1rem;font-size:0.8125rem;color:rgba(255,255,255,0.75);border-bottom:1px solid rgba(255,255,255,0.04);}}
.data-row{{transition:background 0.15s;cursor:pointer;}}
.data-row:hover{{background:rgba(255,255,255,0.04);}}
.modal-overlay{{display:none;position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);align-items:center;justify-content:center;}}
.modal-overlay.open{{display:flex;}}
.modal-box{{background:linear-gradient(145deg,rgba(20,27,50,0.98),rgba(15,23,42,0.98));border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:1.75rem;width:100%;max-width:480px;margin:1rem;box-shadow:0 25px 80px rgba(0,0,0,0.5);animation:modalIn 0.25s ease;}}
@keyframes modalIn{{from{{opacity:0;transform:scale(0.95)translateY(10px)}}to{{opacity:1;transform:scale(1)translateY(0)}}}}
.modal-header{{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;}}
.modal-title{{font-size:1rem;font-weight:700;color:white;}}
.modal-close{{background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.5);width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.2s;}}
.modal-close:hover{{background:rgba(239,68,68,0.2);color:#f87171;}}
.form-group{{margin-bottom:0.875rem;}}
.form-label{{display:block;font-size:0.75rem;font-weight:600;color:rgba(255,255,255,0.5);margin-bottom:0.35rem;text-transform:uppercase;letter-spacing:0.04em;}}
#toast-container{{position:fixed;top:68px;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:8px;}}
.toast{{display:flex;align-items:center;gap:10px;padding:0.75rem 1.1rem;border-radius:12px;font-size:0.8125rem;font-weight:500;min-width:220px;box-shadow:0 12px 40px rgba(0,0,0,0.4);animation:toastIn 0.3s ease forwards;}}
.toast.removing{{animation:toastOut 0.3s ease forwards;}}
@keyframes toastIn{{from{{transform:translateX(120%);opacity:0}}to{{transform:translateX(0);opacity:1}}}}
@keyframes toastOut{{from{{transform:translateX(0);opacity:1}}to{{transform:translateX(120%);opacity:0}}}}
.progress-bar{{height:4px;border-radius:2px;background:rgba(255,255,255,0.08);overflow:hidden;}}
.progress-fill{{height:100%;border-radius:2px;background:{primary};transition:width 0.5s ease;}}
::-webkit-scrollbar{{width:5px;}}
::-webkit-scrollbar-track{{background:transparent;}}
::-webkit-scrollbar-thumb{{background:rgba(255,255,255,0.12);border-radius:3px;}}
::-webkit-scrollbar-thumb:hover{{background:rgba(255,255,255,0.2);}}
"""


# ─────────────────────────────────────────────────────────────────────────────
# Screen panels
# ─────────────────────────────────────────────────────────────────────────────

def _build_screen_panel(screen: dict, idx: int, idea: str, primary: str, accent: str) -> str:
    sid    = _safe_id(screen["name"])
    name   = screen["name"]
    comps  = screen.get("components") or screen.get("key_components") or []
    active = " active" if idx == 0 else ""

    header = (
        f'<div class="flex items-center justify-between mb-6">'
        f'<h1 class="section-title">{name}</h1>'
        f'<div class="flex gap-2">'
        f'<button class="btn-secondary" onclick="showToast(\'Exported!\', \'success\')">Export</button>'
        f'<button class="btn-primary" onclick="openModal(\'modal-create\')">+ Add New</button>'
        f'</div></div>'
    )

    # Build blocks per component
    blocks = ""
    has_chart = False
    has_table = False

    for comp in comps:
        cl = comp.lower()
        if any(k in cl for k in ("kpi", "card", "metric", "stat", "count", "number")):
            blocks += _kpi_cards(name, idea, primary, accent)
        elif any(k in cl for k in ("chart", "graph", "trend", "analytic", "visual")):
            if not has_chart:
                blocks += _chart_section(sid, name, primary, accent)
                has_chart = True
        elif any(k in cl for k in ("table", "list", "grid", "directory", "record", "history", "feed")):
            if not has_table:
                blocks += _data_table(sid, name, idea, primary, accent)
                has_table = True
        elif any(k in cl for k in ("search", "filter", "find")):
            blocks += _search_bar_standalone(sid, name, idea)
        elif any(k in cl for k in ("calendar", "schedule", "booking")):
            blocks += _calendar_widget(name, primary)
        elif any(k in cl for k in ("form", "input", "create", "edit")):
            blocks += _form_card(name, idea, primary)
        elif any(k in cl for k in ("profile", "detail", "info", "overview")):
            blocks += _detail_card(name, idea, primary, accent)
        else:
            # Default: always add a chart for first screen, table for others
            if idx == 0 and not has_chart:
                blocks += _chart_section(sid, name, primary, accent)
                has_chart = True
            elif not has_table:
                blocks += _data_table(sid, name, idea, primary, accent)
                has_table = True
            else:
                blocks += _generic_widget(comp, idea, primary)

    # If nothing was added, give a nice default set
    if not blocks:
        blocks = _kpi_cards(name, idea, primary, accent)
        blocks += _chart_section(sid, name, primary, accent)
        blocks += _data_table(sid, name, idea, primary, accent)

    return f'<div id="screen-{sid}" class="screen-panel{active}">{header}<div class="space-y-5">{blocks}</div></div>\n'


def _kpi_cards(screen_name: str, idea: str, primary: str, accent: str) -> str:
    h = hash(idea + screen_name)
    val1 = f"{abs(h) % 250 + 20:,}"
    val2 = f"{((abs(h) // 7) % 1500) / 10 + 10:.1f}K"
    val3 = f"{abs(h) % 15 + 1}"
    val4 = f"{75 + (abs(h) % 21)}%"

    metrics = [
        (f"Total {screen_name}s", val1,  f"+{abs(h) % 12}",  "↑", primary,  "This month"),
        ("Active Users",   val2,  "+8.7%",   "↑", accent,   "vs last week"),
        ("Pending Tasks",  val3,  "Action", "↑", "#F59E0B","Needs attention"),
        ("Success Rate",   val4,  "+1.8%",  "↑", "#8B5CF6","30-day average"),
    ]
    cards = ""
    for label, val, change, arrow, color, sub in metrics:
        cards += (
            f'<div class="glass-card">'
            f'<div class="flex items-start justify-between mb-3">'
            f'<span class="text-white/40 text-xs font-semibold uppercase tracking-wide">{label}</span>'
            f'<span class="text-xs font-medium" style="color:{color}">{arrow} {change}</span>'
            f'</div>'
            f'<div class="kpi-value" style="color:{color}">{val}</div>'
            f'<div class="text-white/30 text-xs mt-1">{sub}</div>'
            f'</div>'
        )
    return f'<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards}</div>'


def _chart_section(sid: str, screen_name: str, primary: str, accent: str) -> str:
    return (
        f'<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">'

        # Bar chart
        f'<div class="glass-card">'
        f'<div class="flex items-center justify-between mb-4">'
        f'<span class="text-white font-semibold text-sm">{screen_name} Overview</span>'
        f'<select class="data-input" style="width:auto;padding:4px 8px;font-size:11px;" '
        f'onchange="showToast(\'View updated\', \'info\')">'
        f'<option>Last 6 months</option><option>Last year</option><option>All time</option>'
        f'</select></div>'
        f'<canvas id="chart-bar-{sid}" height="180"></canvas>'
        f'</div>'

        # Line chart
        f'<div class="glass-card">'
        f'<div class="flex items-center justify-between mb-4">'
        f'<span class="text-white font-semibold text-sm">Growth Trend</span>'
        f'<button class="badge badge-blue" onclick="showToast(\'Data refreshed!\', \'success\')">'
        f'Refresh</button></div>'
        f'<canvas id="chart-line-{sid}" height="180"></canvas>'
        f'</div>'

        f'</div>'
    )


def _data_table(sid: str, screen_name: str, idea: str, primary: str, accent: str) -> str:
    status_opts = [
        ("Active", "badge-green"),
        ("Pending", "badge-amber"),
        ("Blocked", "badge-red"),
        ("Review", "badge-blue"),
    ]
    priority_opts = ["Low", "Medium", "High"]
    
    rows = []
    for i in range(6):
        num = abs(hash(idea + screen_name + str(i)))
        name = f"{screen_name} {chr(65 + i)}" if i != 2 else f"{idea[:18].strip()} Core"
        status, badge_cls = status_opts[num % len(status_opts)]
        priority = priority_opts[num % len(priority_opts)]
        time_ago = f"{num % 24} hrs ago" if num % 2 == 0 else f"{num % 7} days ago"
        rows.append((name, status, priority, time_ago, badge_cls))
    rows_html = ""
    for name, status, priority, time, badge_cls in rows:
        rows_html += (
            f'<tr class="data-row">'
            f'<td><div class="flex items-center gap-3">'
            f'<div style="width:30px;height:30px;border-radius:8px;background:{primary}22;'
            f'border:1px solid {primary}44;display:flex;align-items:center;'
            f'justify-content:center;font-size:12px;font-weight:700;color:{primary};">'
            f'{name[0]}</div>'
            f'<span class="font-medium text-white">{name}</span></div></td>'
            f'<td><span class="badge {badge_cls}">{status}</span></td>'
            f'<td><span class="text-white/50">{priority}</span></td>'
            f'<td><span class="text-white/35 text-xs">{time}</span></td>'
            f'<td><div class="flex gap-2">'
            f'<button class="btn-ghost" onclick="openModal(\'modal-view\')" title="View">👁</button>'
            f'<button class="btn-ghost" onclick="showToast(\'Deleted!\', \'error\')" title="Delete">🗑</button>'
            f'</div></td>'
            f'</tr>'
        )

    return (
        f'<div class="glass" style="overflow:hidden">'
        f'<div class="flex items-center justify-between px-4 py-3 border-b border-white/5">'
        f'<span class="text-white font-semibold text-sm">{screen_name} Records</span>'
        f'<div class="flex items-center gap-2">'
        f'<input type="text" id="search-{sid}" placeholder="Search records…" class="data-input"'
        f' style="width:180px;" oninput="filterTable(\'search-{sid}\',\'table-{sid}\')" />'
        f'<button class="btn-secondary" onclick="showToast(\'Filters applied!\', \'info\')">Filters ▾</button>'
        f'</div></div>'
        f'<table class="data-table" id="table-{sid}">'
        f'<thead><tr>'
        f'<th>Name</th><th>Status</th><th>Priority</th><th>Updated</th><th>Actions</th>'
        f'</tr></thead>'
        f'<tbody>{rows_html}</tbody>'
        f'</table></div>'
    )


def _search_bar_standalone(sid: str, screen_name: str, idea: str) -> str:
    return (
        f'<div class="glass-card flex items-center gap-3">'
        f'<span class="text-white/30 text-lg">🔍</span>'
        f'<input type="text" placeholder="Search {screen_name.lower()} for &quot;{idea[:30]}&quot;…"'
        f' class="data-input flex-1" style="border:none;background:transparent;padding:0;" />'
        f'<button class="btn-primary" onclick="showToast(\'Search results loaded!\', \'success\')">Search</button>'
        f'</div>'
    )


def _calendar_widget(screen_name: str, primary: str) -> str:
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_headers = "".join(f'<div class="text-white/25 text-xs text-center font-medium py-1">{d}</div>' for d in days)
    cells = ""
    for i in range(35):
        day_num = (i % 28) + 1
        style = ""
        if i in (8, 9, 15):
            style = f"background:{primary}33;color:white;"
        elif i in (3, 4, 10, 17):
            style = "background:rgba(16,185,129,0.2);color:#10b981;"
        else:
            style = "color:rgba(255,255,255,0.4);"
        cells += (
            f'<div class="text-xs text-center py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"'
            f' style="{style}" onclick="showToast(\'Day {day_num} selected\', \'info\')">{day_num}</div>'
        )
    return (
        f'<div class="glass-card">'
        f'<div class="flex items-center justify-between mb-4">'
        f'<span class="text-white font-semibold text-sm">📅 {screen_name}</span>'
        f'<div class="flex gap-2">'
        f'<button class="btn-ghost" onclick="showToast(\'Prev month\', \'info\')">‹</button>'
        f'<span class="text-white/70 text-sm font-medium px-2">July 2025</span>'
        f'<button class="btn-ghost" onclick="showToast(\'Next month\', \'info\')">›</button>'
        f'</div></div>'
        f'<div class="grid grid-cols-7 gap-1">{day_headers}{cells}</div>'
        f'<div class="flex gap-4 mt-4 pt-3 border-t border-white/5">'
        f'<span class="flex items-center gap-1.5 text-xs text-white/40">'
        f'<span class="w-3 h-3 rounded" style="background:{primary}33;"></span>Scheduled</span>'
        f'<span class="flex items-center gap-1.5 text-xs text-white/40">'
        f'<span class="w-3 h-3 rounded bg-emerald-500/20"></span>Completed</span>'
        f'</div></div>'
    )


def _form_card(screen_name: str, idea: str, primary: str) -> str:
    return (
        f'<div class="glass-card">'
        f'<div class="flex items-center justify-between mb-4">'
        f'<span class="text-white font-semibold text-sm">Quick Create — {screen_name}</span>'
        f'</div>'
        f'<div class="grid grid-cols-2 gap-3">'
        f'<div><label class="form-label">Name / Title</label>'
        f'<input type="text" class="data-input" placeholder="Enter name…" /></div>'
        f'<div><label class="form-label">Category</label>'
        f'<select class="data-input"><option>Select…</option>'
        f'<option>Type A</option><option>Type B</option></select></div>'
        f'<div><label class="form-label">Description</label>'
        f'<textarea class="data-input" rows="2" placeholder="Brief description…"></textarea></div>'
        f'<div><label class="form-label">Status</label>'
        f'<select class="data-input"><option>Active</option><option>Draft</option><option>Archived</option></select></div>'
        f'</div>'
        f'<div class="flex justify-end gap-2 mt-4">'
        f'<button class="btn-secondary">Cancel</button>'
        f'<button class="btn-primary" onclick="showToast(\'{screen_name} created!\', \'success\')">'
        f'Create {screen_name}</button>'
        f'</div></div>'
    )


def _detail_card(screen_name: str, idea: str, primary: str, accent: str) -> str:
    progress_items = [
        ("Phase 1 — Setup",   85, primary),
        ("Phase 2 — Growth",  42, accent),
        ("Phase 3 — Scale",   12, "#8B5CF6"),
    ]
    bars = ""
    for label, pct, color in progress_items:
        bars += (
            f'<div class="mb-3">'
            f'<div class="flex justify-between text-xs text-white/50 mb-1.5">'
            f'<span>{label}</span><span style="color:{color}">{pct}%</span></div>'
            f'<div class="progress-bar"><div class="progress-fill" style="width:{pct}%;background:{color};"></div></div>'
            f'</div>'
        )
    return (
        f'<div class="glass-card">'
        f'<div class="flex items-center justify-between mb-4">'
        f'<span class="text-white font-semibold text-sm">{screen_name} Progress</span>'
        f'<button class="btn-primary" onclick="showToast(\'Report generated!\', \'success\')">Generate Report</button>'
        f'</div>'
        f'{bars}'
        f'</div>'
    )


def _generic_widget(label: str, idea: str, primary: str) -> str:
    return (
        f'<div class="glass-card" style="border-left:3px solid {primary};">'
        f'<div class="flex items-center justify-between mb-2">'
        f'<span class="text-white font-semibold text-sm">{label}</span>'
        f'<button class="badge badge-blue" onclick="showToast(\'{label} updated!\', \'success\')">Refresh</button>'
        f'</div>'
        f'<p class="text-white/35 text-xs leading-relaxed">'
        f'Tailored for: <em>{idea[:60]}</em></p>'
        f'<div class="mt-3 h-12 rounded-lg border border-white/5 flex items-center'
        f' justify-center text-white/20 text-xs">Interactive content area</div>'
        f'</div>'
    )


# ─────────────────────────────────────────────────────────────────────────────
# Modals
# ─────────────────────────────────────────────────────────────────────────────

def _build_modals(screens: list, idea: str, primary: str, accent: str) -> str:
    first_screen = screens[0]["name"] if screens else "Item"

    # Modal 1: Create New
    create_modal = (
        f'<div id="modal-create" class="modal-overlay">'
        f'<div class="modal-box">'
        f'<div class="modal-header">'
        f'<span class="modal-title">Create New {first_screen}</span>'
        f'<button class="modal-close" onclick="closeModal(\'modal-create\')">✕</button>'
        f'</div>'
        f'<form id="form-create" onsubmit="return false;">'
        f'<div class="form-group"><label class="form-label">Name *</label>'
        f'<input type="text" class="data-input" required placeholder="Enter name…" /></div>'
        f'<div class="form-group"><label class="form-label">Type</label>'
        f'<select class="data-input"><option>Standard</option><option>Premium</option><option>Enterprise</option></select></div>'
        f'<div class="form-group"><label class="form-label">Description *</label>'
        f'<textarea class="data-input" rows="3" required placeholder="Brief description of this {first_screen.lower()}…"></textarea></div>'
        f'<div class="grid grid-cols-2 gap-3">'
        f'<div class="form-group"><label class="form-label">Priority</label>'
        f'<select class="data-input"><option>Low</option><option>Medium</option><option selected>High</option></select></div>'
        f'<div class="form-group"><label class="form-label">Assignee</label>'
        f'<input type="text" class="data-input" placeholder="Name or email" /></div>'
        f'</div></form>'
        f'<div class="flex justify-end gap-2 mt-5 pt-4 border-t border-white/5">'
        f'<button class="btn-secondary" onclick="closeModal(\'modal-create\')">Cancel</button>'
        f'<button class="btn-primary" onclick="submitForm(\'form-create\', \'{first_screen} created successfully!\')">'
        f'Create {first_screen}</button>'
        f'</div></div></div>'
    )

    # Modal 2: View Details
    view_modal = (
        f'<div id="modal-view" class="modal-overlay">'
        f'<div class="modal-box">'
        f'<div class="modal-header">'
        f'<span class="modal-title">{first_screen} Details</span>'
        f'<button class="modal-close" onclick="closeModal(\'modal-view\')">✕</button>'
        f'</div>'
        f'<div class="space-y-3">'
        f'<div class="flex justify-between py-2 border-b border-white/5">'
        f'<span class="text-white/40 text-sm">Name</span>'
        f'<span class="text-white text-sm font-medium">{first_screen} Alpha</span></div>'
        f'<div class="flex justify-between py-2 border-b border-white/5">'
        f'<span class="text-white/40 text-sm">Status</span>'
        f'<span class="badge badge-green">Active</span></div>'
        f'<div class="flex justify-between py-2 border-b border-white/5">'
        f'<span class="text-white/40 text-sm">Created</span>'
        f'<span class="text-white text-sm">Jul 15, 2025</span></div>'
        f'<div class="flex justify-between py-2 border-b border-white/5">'
        f'<span class="text-white/40 text-sm">Related Idea</span>'
        f'<span class="text-white text-sm">{idea[:40]}</span></div>'
        f'<div class="py-2"><span class="text-white/40 text-sm block mb-1">Description</span>'
        f'<p class="text-white/70 text-sm leading-relaxed">'
        f'Core component of the {first_screen.lower()} module. Handles primary business logic and'
        f' integrations for this startup.</p></div>'
        f'</div>'
        f'<div class="flex justify-end gap-2 mt-5 pt-4 border-t border-white/5">'
        f'<button class="btn-secondary" onclick="closeModal(\'modal-view\')">Close</button>'
        f'<button class="btn-primary" onclick="showToast(\'Changes saved!\', \'success\');closeModal(\'modal-view\')">'
        f'Save Changes</button>'
        f'</div></div></div>'
    )

    return create_modal + "\n" + view_modal


# ─────────────────────────────────────────────────────────────────────────────
# JavaScript (built as plain string — no f-string braces for JS syntax)
# ─────────────────────────────────────────────────────────────────────────────

def _build_js(screens: list, primary: str, accent: str) -> str:
    chart_init = _build_chart_init(screens, primary, accent)
    return (
        """
function showScreen(id, btn) {
  document.querySelectorAll('.screen-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
  var panel = document.getElementById('screen-' + id);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

function openModal(id) {
  var m = document.getElementById(id);
  if (m) { m.classList.add('open'); }
}

function closeModal(id) {
  var m = document.getElementById(id);
  if (m) { m.classList.remove('open'); }
}

function showToast(msg, type) {
  type = type || 'success';
  var cfg = {
    success: { bg: 'rgba(16,185,129,0.95)', icon: '✓' },
    error:   { bg: 'rgba(239,68,68,0.95)',  icon: '✗' },
    info:    { bg: 'rgba(99,102,241,0.95)', icon: 'ℹ' },
    warning: { bg: 'rgba(245,158,11,0.95)', icon: '⚠' }
  };
  var c = cfg[type] || cfg.success;
  var t = document.createElement('div');
  t.className = 'toast';
  t.style.cssText = 'background:' + c.bg + ';color:white;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.4);';
  t.innerHTML = '<span style="font-size:15px;font-weight:700">' + c.icon + '</span>'
              + '<span style="font-size:13px;font-weight:500">' + msg + '</span>';
  var container = document.getElementById('toast-container');
  if (container) container.appendChild(t);
  setTimeout(function() {
    t.classList.add('removing');
    setTimeout(function() { t.remove(); }, 350);
  }, 3000);
}

function filterTable(inputId, tableId) {
  var q = (document.getElementById(inputId) || {}).value || '';
  q = q.toLowerCase();
  var rows = document.querySelectorAll('#' + tableId + ' .data-row');
  rows.forEach(function(row) {
    row.style.display = row.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
  });
}

function submitForm(formId, successMsg) {
  var form = document.getElementById(formId);
  if (!form) { showToast('Form not found', 'error'); return; }
  var inputs = form.querySelectorAll('[required]');
  var valid = true;
  inputs.forEach(function(inp) {
    if (!inp.value.trim()) {
      inp.style.borderColor = '#ef4444';
      inp.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
      valid = false;
    } else {
      inp.style.borderColor = 'rgba(255,255,255,0.12)';
      inp.style.boxShadow = 'none';
    }
  });
  if (valid) {
    var overlay = form.closest('.modal-overlay');
    if (overlay) overlay.classList.remove('open');
    showToast(successMsg || 'Saved successfully!', 'success');
  } else {
    showToast('Please fill in all required fields', 'error');
  }
}

"""
        + chart_init
        + """

document.addEventListener('DOMContentLoaded', function() {
  try { initCharts(); } catch(e) { console.warn('Chart init failed:', e); }
  // Activate first nav item
  var firstNav = document.querySelector('.nav-item');
  if (firstNav) { firstNav.click(); } else {
    var firstPanel = document.querySelector('.screen-panel');
    if (firstPanel) firstPanel.classList.add('active');
  }
  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
});
"""
    )


def _build_chart_init(screens: list, primary: str, accent: str) -> str:
    """Build Chart.js initialization as plain string (no f-string for JS braces)."""
    inits = []
    bar_data  = [45, 72, 58, 91, 63, 84, 52, 78]
    line_data = [30, 45, 38, 62, 55, 71, 48, 66]
    month_labels = "['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']"

    for i, screen in enumerate(screens[:5]):
        sid = _safe_id(screen.get("name", f"s{i}"))
        bar_vals  = str([bar_data[j % 8]  + i * 5 for j in range(6)])
        line_vals = str([line_data[j % 8] + i * 4 for j in range(6)])
        s_name    = screen.get("name", "")

        inits.append(
            "  // " + s_name + " charts\n"
            "  try {\n"
            "    var barEl" + str(i) + " = document.getElementById('chart-bar-" + sid + "');\n"
            "    if (barEl" + str(i) + ") {\n"
            "      new Chart(barEl" + str(i) + ", {\n"
            "        type: 'bar',\n"
            "        data: {\n"
            "          labels: ['Jan','Feb','Mar','Apr','May','Jun'],\n"
            "          datasets: [{\n"
            "            label: '" + s_name + " Metrics',\n"
            "            data: " + bar_vals + ",\n"
            "            backgroundColor: '" + primary + "B3',\n"
            "            borderColor: '" + primary + "',\n"
            "            borderWidth: 2.5,\n"
            "            borderRadius: 6,\n"
            "            hoverBackgroundColor: '" + primary + "'\n"
            "          }]\n"
            "        },\n"
            "        options: {\n"
            "          responsive: true,\n"
            "          animation: { duration: 800, easing: 'easeOutQuart' },\n"
            "          plugins: { legend: { labels: { color: '#ffffff', font: { size: 12, weight: 'bold' } } } },\n"
            "          scales: {\n"
            "            x: { ticks: { color: 'rgba(255,255,255,0.85)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.12)' } },\n"
            "            y: { ticks: { color: 'rgba(255,255,255,0.85)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.12)' } }\n"
            "          }\n"
            "        }\n"
            "      });\n"
            "    }\n"
            "  } catch(e) { console.warn('bar chart " + sid + ":', e); }\n\n"

            "  try {\n"
            "    var lineEl" + str(i) + " = document.getElementById('chart-line-" + sid + "');\n"
            "    if (lineEl" + str(i) + ") {\n"
            "      new Chart(lineEl" + str(i) + ", {\n"
            "        type: 'line',\n"
            "        data: {\n"
            "          labels: ['Jan','Feb','Mar','Apr','May','Jun'],\n"
            "          datasets: [{\n"
            "            label: 'Growth Volume',\n"
            "            data: " + line_vals + ",\n"
            "            borderColor: '" + accent + "',\n"
            "            backgroundColor: '" + accent + "33',\n"
            "            borderWidth: 3.5,\n"
            "            fill: true,\n"
            "            tension: 0.4,\n"
            "            pointBackgroundColor: '#ffffff',\n"
            "            pointBorderColor: '" + accent + "',\n"
            "            pointBorderWidth: 2,\n"
            "            pointRadius: 5,\n"
            "            pointHoverRadius: 7\n"
            "          }]\n"
            "        },\n"
            "        options: {\n"
            "          responsive: true,\n"
            "          animation: { duration: 900 },\n"
            "          plugins: { legend: { labels: { color: '#ffffff', font: { size: 12, weight: 'bold' } } } },\n"
            "          scales: {\n"
            "            x: { ticks: { color: 'rgba(255,255,255,0.85)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.12)' } },\n"
            "            y: { ticks: { color: 'rgba(255,255,255,0.85)', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.12)' } }\n"
            "          }\n"
            "        }\n"
            "      });\n"
            "    }\n"
            "  } catch(e) { console.warn('line chart " + sid + ":', e); }\n"
        )

    return "function initCharts() {\n" + "\n".join(inits) + "\n}\n"


def _product_label(idea: str) -> str:
    cleaned = idea.strip()
    return cleaned[:44] + ("…" if len(cleaned) > 44 else "")
