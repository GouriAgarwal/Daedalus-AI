"""
artifacts/wireframe_gen.py
Person B — Generates a styled HTML wireframe from the UI Designer Agent JSON.

Strategy:
  1. If ANTHROPIC_API_KEY is set, calls Claude claude-sonnet-4-6 to produce
     a complete Tailwind HTML page from the UI spec.
  2. If the API call fails (or key is missing), falls back to a rich
     template-rendered HTML using the structured data directly.

Usage:
    await generate_wireframe(ui_spec, idea, session_dir)
    # Writes: session_dir/wireframe.html
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

# ── Claude client (optional) ──────────────────────────────────────────────────
try:
    import anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

async def generate_wireframe(
    ui_spec: dict[str, Any],
    idea: str,
    session_dir: Path,
) -> Path:
    """
    Generate an HTML wireframe and write it to session_dir/wireframe.html.

    Args:
        ui_spec:     UI Designer Agent JSON (screens, design_system, flows).
        idea:        Original startup idea string (for page title).
        session_dir: Directory to write the output file into.

    Returns:
        Path to the generated wireframe.html file.
    """
    out_path = session_dir / "wireframe.html"

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if _ANTHROPIC_AVAILABLE and api_key:
        try:
            html = await _generate_via_claude(ui_spec, idea, api_key)
            out_path.write_text(html, encoding="utf-8")
            return out_path
        except Exception as e:
            print(f"[wireframe_gen] Claude generation failed ({e}), using template fallback")

    # Template fallback — always works, no API required
    html = _generate_from_template(ui_spec, idea)
    out_path.write_text(html, encoding="utf-8")
    return out_path


# ─────────────────────────────────────────────────────────────────────────────
# Claude-powered generation
# ─────────────────────────────────────────────────────────────────────────────

async def _generate_via_claude(ui_spec: dict, idea: str, api_key: str) -> str:
    """Call Claude to produce a full Tailwind HTML page from the UI spec."""
    client = anthropic.AsyncAnthropic(api_key=api_key)

    system_prompt = (
        "You are an expert frontend developer. "
        "Given a UI specification JSON, generate a single complete HTML file "
        "that uses Tailwind CSS (via CDN) to build a realistic, pixel-perfect wireframe. "
        "Include a sidebar navigation, a main content area, and at least one modal. "
        "Use realistic placeholder data, not lorem ipsum. "
        "Return ONLY the raw HTML — no explanation, no markdown fences."
    )

    user_prompt = (
        f"Startup idea: {idea}\n\n"
        f"UI Specification:\n{json.dumps(ui_spec, indent=2)}\n\n"
        "Generate a complete, self-contained HTML wireframe that shows the dashboard "
        "and at least 2 other screens via tab/nav switching (use JS to toggle visibility). "
        "Make it look like a real SaaS product, not a sketch. "
        "Include the Tailwind CDN script tag. "
        "Use the design_system colors from the spec if provided."
    )

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        messages=[{"role": "user", "content": user_prompt}],
        system=system_prompt,
    )

    html = response.content[0].text.strip()

    # Strip accidental markdown fences if Claude wraps output
    if html.startswith("```"):
        lines = html.splitlines()
        html = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    return html


# ─────────────────────────────────────────────────────────────────────────────
# Template fallback (no API required)
# ─────────────────────────────────────────────────────────────────────────────

def _generate_from_template(ui_spec: dict, idea: str) -> str:
    """
    Render a rich, realistic HTML wireframe from the structured ui_spec
    without calling any external API. Uses Tailwind CSS CDN.
    """
    ds = ui_spec.get("design_system", {})
    primary = ds.get("primary_color", "#6366F1")
    accent  = ds.get("accent_color",  "#10B981")
    font    = ds.get("font",           "Inter")
    screens = ui_spec.get("screens", [])
    flows   = ui_spec.get("key_user_flows", [])

    # Build nav items from screens
    nav_items_html = "\n".join(
        f"""
        <button
          onclick="showScreen('{_safe_id(s.get('name','screen'))}', this)"
          class="nav-btn w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium
                 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
          data-screen="{_safe_id(s.get('name','screen'))}">
          {_screen_icon(s.get('name',''))} {s.get('name','')}
        </button>"""
        for s in screens
    )

    # Build screen panels
    screen_panels_html = ""
    for idx, s in enumerate(screens):
        s_id = _safe_id(s.get("name", f"screen_{idx}"))
        components = s.get("components", [])
        is_first = "block" if idx == 0 else "none"
        screen_panels_html += _render_screen_panel(s_id, s.get("name", ""), components, primary, accent, is_first)

    # User flows section
    flows_html = "\n".join(
        f'<li class="flex items-start gap-2 text-sm text-slate-400">'
        f'<span class="text-emerald-400 mt-0.5">→</span>{flow}</li>'
        for flow in flows
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{idea} — Wireframe</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family={font.replace(' ', '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --primary: {primary};
      --accent:  {accent};
    }}
    * {{ font-family: '{font}', sans-serif; }}
    body {{ background: #0f172a; }}
    .nav-btn.active {{
      background: color-mix(in srgb, var(--primary) 20%, transparent);
      color: white;
      border-left: 3px solid var(--primary);
    }}
    .screen-panel {{ display: none; }}
    .screen-panel.active {{ display: block; }}
    .badge-green {{ background: rgba(16,185,129,0.15); color: #10b981; }}
    .badge-red   {{ background: rgba(239,68,68,0.15);  color: #ef4444; }}
    .badge-blue  {{ background: rgba(99,102,241,0.15); color: #818cf8; }}
    .card {{
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
    }}
    ::-webkit-scrollbar {{ width: 6px; }}
    ::-webkit-scrollbar-track {{ background: #1e293b; }}
    ::-webkit-scrollbar-thumb {{ background: #475569; border-radius: 3px; }}
  </style>
</head>
<body class="min-h-screen flex flex-col">

  <!-- Top bar -->
  <header class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                 px-6 py-3 bg-slate-900 border-b border-slate-700">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
           style="background: var(--primary);">AI</div>
      <span class="text-white font-semibold text-sm">{idea[:40]}</span>
      <span class="text-xs px-2 py-0.5 rounded-full badge-blue">Wireframe Preview</span>
    </div>
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">HR</div>
    </div>
  </header>

  <div class="flex pt-14 min-h-screen">

    <!-- Sidebar -->
    <aside class="fixed left-0 top-14 bottom-0 w-56 bg-slate-900 border-r border-slate-700
                  flex flex-col p-4 gap-1 overflow-y-auto">
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-2">Navigation</p>
      {nav_items_html}

      <!-- User flows section -->
      <div class="mt-auto pt-4 border-t border-slate-700">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">Key Flows</p>
        <ul class="space-y-2 px-1">
          {flows_html}
        </ul>
      </div>
    </aside>

    <!-- Main content -->
    <main class="ml-56 flex-1 p-6 min-h-screen overflow-y-auto">
      {screen_panels_html}
    </main>

  </div>

  <script>
    // Initialise nav
    const navBtns = document.querySelectorAll('.nav-btn');
    const panels  = document.querySelectorAll('.screen-panel');

    function showScreen(screenId, btn) {{
      panels.forEach(p => p.classList.remove('active'));
      navBtns.forEach(b => b.classList.remove('active'));
      const target = document.getElementById(screenId);
      if (target) target.classList.add('active');
      if (btn)    btn.classList.add('active');
    }}

    // Activate first screen + first nav button on load
    if (navBtns.length) navBtns[0].classList.add('active');
    if (panels.length)  panels[0].classList.add('active');
  </script>
</body>
</html>
"""


def _safe_id(name: str) -> str:
    """Convert a screen name to a safe HTML id."""
    import re
    return re.sub(r"[^\w]", "_", name.lower().strip())


def _screen_icon(name: str) -> str:
    icons = {
        "dashboard": "📊", "employee": "👥", "leave": "🗓", "payroll": "💰",
        "onboard": "🚀", "settings": "⚙️", "report": "📈", "analytics": "📉",
        "profile": "👤", "chat": "💬", "inbox": "📥",
    }
    name_lower = name.lower()
    for key, icon in icons.items():
        if key in name_lower:
            return icon
    return "📋"


def _render_screen_panel(
    screen_id: str,
    screen_name: str,
    components: list[str],
    primary: str,
    accent: str,
    display: str,
) -> str:
    """Render a single screen panel with its components as realistic UI blocks."""
    comp_blocks = ""
    for comp in components:
        comp_lower = comp.lower()

        if "kpi" in comp_lower or "card" in comp_lower or "metric" in comp_lower:
            comp_blocks += _kpi_cards(accent)
        elif "table" in comp_lower or "list" in comp_lower or "directory" in comp_lower:
            comp_blocks += _data_table(comp)
        elif "calendar" in comp_lower:
            comp_blocks += _calendar_placeholder()
        elif "chart" in comp_lower or "heatmap" in comp_lower:
            comp_blocks += _chart_placeholder(primary)
        elif "modal" in comp_lower or "panel" in comp_lower:
            comp_blocks += _panel_block(comp)
        elif "search" in comp_lower or "filter" in comp_lower:
            comp_blocks += _search_bar()
        else:
            comp_blocks += _generic_block(comp, primary)

    return f"""
<div id="{screen_id}" class="screen-panel">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-white">{screen_name}</h1>
    <button class="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style="background: {primary};">+ New</button>
  </div>
  <div class="space-y-5">
    {comp_blocks}
  </div>
</div>
"""


def _kpi_cards(accent: str) -> str:
    cards = [
        ("Total Employees", "247", "+12 this month", "👥"),
        ("Attrition Risk", "8 High Risk", "↑ 3 from last month", "⚠️"),
        ("Pending Approvals", "14", "5 urgent", "📋"),
        ("Payroll Status", "₹12.4L", "Due in 3 days", "💰"),
    ]
    cards_html = "".join(
        f"""
        <div class="card p-5 flex items-start gap-4">
          <div class="text-2xl">{icon}</div>
          <div>
            <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <p class="text-2xl font-bold text-white mt-1">{val}</p>
            <p class="text-xs text-slate-500 mt-1">{sub}</p>
          </div>
        </div>"""
        for label, val, sub, icon in cards
    )
    return f'<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">{cards_html}</div>'


def _data_table(label: str) -> str:
    rows = [
        ("Priya Sharma",   "Engineering",    "Senior SDE",    "Low",    "badge-green"),
        ("Rahul Gupta",    "Sales",           "AE",            "High",   "badge-red"),
        ("Ananya Iyer",    "HR",              "HR Manager",    "Medium", "badge-blue"),
        ("Kiran Patel",    "Product",         "PM",            "Low",    "badge-green"),
        ("Suresh Kumar",   "Engineering",     "SDE-2",         "High",   "badge-red"),
    ]
    rows_html = "".join(
        f"""
        <tr class="border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
          <td class="px-4 py-3 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-semibold">
              {row[0][0]}
            </div>
            <span class="text-sm text-white">{row[0]}</span>
          </td>
          <td class="px-4 py-3 text-sm text-slate-400">{row[1]}</td>
          <td class="px-4 py-3 text-sm text-slate-400">{row[2]}</td>
          <td class="px-4 py-3">
            <span class="text-xs px-2.5 py-1 rounded-full font-medium {row[4]}">{row[3]}</span>
          </td>
          <td class="px-4 py-3">
            <button class="text-xs text-slate-400 hover:text-white transition-colors">View →</button>
          </td>
        </tr>"""
        for row in rows
    )
    return f"""
<div class="card overflow-hidden">
  <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
    <p class="text-sm font-semibold text-white">{label}</p>
    <span class="text-xs text-slate-500">5 of 247</span>
  </div>
  <table class="w-full">
    <thead>
      <tr class="text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
        <th class="px-4 py-2 text-left">Name</th>
        <th class="px-4 py-2 text-left">Dept</th>
        <th class="px-4 py-2 text-left">Role</th>
        <th class="px-4 py-2 text-left">Risk</th>
        <th class="px-4 py-2 text-left">Action</th>
      </tr>
    </thead>
    <tbody>{rows_html}</tbody>
  </table>
</div>"""


def _calendar_placeholder() -> str:
    return """
<div class="card p-5">
  <p class="text-sm font-semibold text-white mb-4">📅 Leave Calendar — July 2025</p>
  <div class="grid grid-cols-7 gap-1 text-center">
    """ + "".join(
        f'<div class="text-xs text-slate-500 font-medium py-1">{d}</div>'
        for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    ) + "".join(
        f"""<div class="text-xs py-2 rounded-lg
            {"bg-indigo-500/20 text-indigo-300" if i in [3,4,10,11,17] else
             "bg-emerald-500/20 text-emerald-300" if i in [5,6,12] else
             "text-slate-400 hover:bg-slate-700 cursor-pointer"}">{i+1}</div>"""
        for i in range(31)
    ) + """
  </div>
  <div class="flex gap-4 mt-4 text-xs text-slate-400">
    <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-indigo-500/20"></span>Approved</span>
    <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-emerald-500/20"></span>Holiday</span>
  </div>
</div>"""


def _chart_placeholder(primary: str) -> str:
    bars = [65, 80, 45, 90, 72, 55, 88, 60, 75, 50, 95, 70]
    bars_html = "".join(
        f'<div class="flex-1 rounded-t-sm" style="height:{h}%; background: {primary}; opacity: {0.4 + i*0.05:.2f};"></div>'
        for i, h in enumerate(bars)
    )
    return f"""
<div class="card p-5">
  <p class="text-sm font-semibold text-white mb-4">📈 Attrition Risk by Department</p>
  <div class="flex items-end gap-1 h-32">
    {bars_html}
  </div>
  <div class="flex justify-between text-xs text-slate-500 mt-2">
    <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
    <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
    <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
  </div>
</div>"""


def _panel_block(label: str) -> str:
    return f"""
<div class="card p-5">
  <p class="text-sm font-semibold text-white mb-3">{label}</p>
  <div class="space-y-3">
    <div class="flex justify-between items-center text-sm">
      <span class="text-slate-400">Component A</span>
      <span class="text-white font-medium">Value 1</span>
    </div>
    <div class="flex justify-between items-center text-sm">
      <span class="text-slate-400">Component B</span>
      <span class="text-white font-medium">Value 2</span>
    </div>
    <div class="h-px bg-slate-700"></div>
    <button class="w-full py-2 rounded-lg text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors">
      Confirm Action
    </button>
  </div>
</div>"""


def _search_bar() -> str:
    return """
<div class="flex gap-3">
  <div class="flex-1 relative">
    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
    <input type="text" placeholder="Search employees, roles, departments..."
           class="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg
                  text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"/>
  </div>
  <button class="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600 transition-colors">
    Filters ⌄
  </button>
</div>"""


def _generic_block(label: str, primary: str) -> str:
    return f"""
<div class="card p-5 border-l-4" style="border-left-color: {primary};">
  <p class="text-sm font-semibold text-white mb-1">{label}</p>
  <p class="text-xs text-slate-500">Component rendered from UI spec</p>
  <div class="mt-3 h-16 rounded-lg bg-slate-700/50 flex items-center justify-center">
    <span class="text-xs text-slate-500">Interactive component area</span>
  </div>
</div>"""
