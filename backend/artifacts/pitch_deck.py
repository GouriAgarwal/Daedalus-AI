"""
artifacts/pitch_deck.py
Person B — Generates a .pptx pitch deck from the pipeline result JSON.

Usage:
    pptx_bytes = generate_pitch_deck(pipeline_result)
    Path("deck.pptx").write_bytes(pptx_bytes)
"""

from __future__ import annotations

import io
from typing import Any

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

# ── Brand colours ─────────────────────────────────────────────────────────────
PRIMARY   = RGBColor(0x63, 0x66, 0xF1)   # Indigo  #6366F1
ACCENT    = RGBColor(0x10, 0xB9, 0x81)   # Emerald #10B981
DARK_BG   = RGBColor(0x0F, 0x17, 0x2A)   # Dark navy
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_GRAY = RGBColor(0xF1, 0xF5, 0xF9)
TEXT_DARK  = RGBColor(0x1E, 0x29, 0x3B)

# ── Slide dimensions (widescreen 16:9) ────────────────────────────────────────
SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def generate_pitch_deck(pipeline_result: dict[str, Any]) -> bytes:
    """
    Build a polished .pptx from the pipeline JSON and return raw bytes.

    Args:
        pipeline_result: Full JSON from the LangGraph orchestrator.

    Returns:
        bytes: The .pptx file content, ready to write to disk or stream.
    """
    prs = Presentation()
    prs.slide_width  = SLIDE_W
    prs.slide_height = SLIDE_H

    idea   = pipeline_result.get("idea", "Your Startup")
    domain = pipeline_result.get("domain", "")
    r1     = pipeline_result.get("round1", {})
    pm     = r1.get("pm", {})
    ui     = r1.get("ui", {})
    backend = r1.get("backend", {})
    mktg   = r1.get("marketing", {})
    r2     = pipeline_result.get("round2_critique", {})
    score  = pipeline_result.get("startup_score", {})

    # ── Slide 1: Cover ────────────────────────────────────────────────────────
    _slide_cover(prs, idea, pm.get("tagline", ""), domain)

    # ── Slide 2: Problem ──────────────────────────────────────────────────────
    _slide_section(
        prs,
        title="The Problem",
        icon="🚨",
        content=pm.get("problem", ""),
        accent=PRIMARY,
    )

    # ── Slide 3: Solution ─────────────────────────────────────────────────────
    _slide_section(
        prs,
        title="Our Solution",
        icon="💡",
        content=pm.get("solution", ""),
        accent=ACCENT,
    )

    # ── Slide 4: MVP Features ─────────────────────────────────────────────────
    features = pm.get("mvp_features", [])
    _slide_bullets(
        prs,
        title="MVP Features",
        icon="🛠",
        bullets=features,
        accent=PRIMARY,
    )

    # ── Slide 5: Target User ──────────────────────────────────────────────────
    _slide_two_col(
        prs,
        title="Who We Serve",
        left_header="Target User",
        left_body=(
            lambda t: "\n".join(t) if isinstance(t, list) else (t or "")
        )(pm.get("target_users") or pm.get("target_user", "")),
        right_header="ICP (Marketing)",
        right_body=mktg.get("icp", ""),
    )

    # ── Slide 6: Product / UI Vision ──────────────────────────────────────────
    screens = ui.get("screens", [])
    screen_names = [s.get("name", "") for s in screens]
    _slide_bullets(
        prs,
        title="Product Screens",
        icon="🖥",
        bullets=screen_names,
        accent=ACCENT,
        subtitle="Key user-facing surfaces",
    )

    # ── Slide 7: Technology Stack ─────────────────────────────────────────────
    tech = backend.get("tech_choices", {})
    tech_lines = [f"{k.capitalize()}: {v}" for k, v in tech.items()]
    arch = backend.get("architecture", "")
    _slide_bullets(
        prs,
        title="Technology",
        icon="⚙️",
        bullets=tech_lines,
        accent=PRIMARY,
        subtitle=arch,
    )

    # ── Slide 8: Market Opportunity ───────────────────────────────────────────
    tam_sam_som = mktg.get("tam_sam_som", {})
    market_lines = [f"{k}: {v}" for k, v in tam_sam_som.items()]
    _slide_bullets(
        prs,
        title="Market Opportunity",
        icon="📈",
        bullets=market_lines,
        accent=ACCENT,
        subtitle=mktg.get("positioning", ""),
    )

    # ── Slide 9: Go-To-Market ─────────────────────────────────────────────────
    channels = mktg.get("channels", [])
    pricing = mktg.get("pricing", {})
    pricing_lines = [f"{tier.capitalize()}: {price}" for tier, price in pricing.items()]
    _slide_two_col(
        prs,
        title="Go-To-Market",
        left_header="Channels",
        left_body="\n".join(f"• {c}" for c in channels),
        right_header="Pricing",
        right_body="\n".join(pricing_lines),
    )

    # ── Slide 10: Investor Concerns & Revisions ───────────────────────────────
    concerns = r2.get("investor_concerns", []) + r2.get("skeptic_flags", [])
    revisions_pm = r2.get("revisions", {}).get("pm", {})
    revision_lines = [f"{k}: {v}" for k, v in revisions_pm.items()]
    _slide_two_col(
        prs,
        title="Validation — Risks & Mitigations",
        left_header="Key Concerns Raised",
        left_body="\n".join(f"⚠ {c}" for c in concerns[:4]),
        right_header="Revised Plan",
        right_body="\n".join(f"✓ {r}" for r in revision_lines),
    )

    # ── Slide 11: Startup Score ───────────────────────────────────────────────
    _slide_score(prs, score)

    # ── Slide 12: Ask / CTA ───────────────────────────────────────────────────
    _slide_cover(
        prs,
        title="Ready to build the right thing?",
        subtitle="Validated by a team of 6 AI co-founders.",
        domain="",
        is_end_card=True,
    )

    buf = io.BytesIO()
    prs.save(buf)
    return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
# Slide builder helpers
# ─────────────────────────────────────────────────────────────────────────────

def _blank_slide(prs: Presentation) -> Any:
    """Add a fully blank slide (no layout placeholders)."""
    blank_layout = prs.slide_layouts[6]  # index 6 = blank
    return prs.slides.add_slide(blank_layout)


def _fill_bg(slide: Any, color: RGBColor) -> None:
    """Fill the slide background with a solid colour."""
    from pptx.oxml.ns import qn

    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def _add_textbox(
    slide: Any,
    text: str,
    left: float,
    top: float,
    width: float,
    height: float,
    font_size: int = 18,
    bold: bool = False,
    color: RGBColor = WHITE,
    align: PP_ALIGN = PP_ALIGN.LEFT,
    word_wrap: bool = True,
) -> None:
    """Add a simple textbox to the slide."""
    txBox = slide.shapes.add_textbox(
        Inches(left), Inches(top), Inches(width), Inches(height)
    )
    tf = txBox.text_frame
    tf.word_wrap = word_wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color


def _add_colored_rect(
    slide: Any,
    left: float,
    top: float,
    width: float,
    height: float,
    color: RGBColor,
) -> None:
    """Add a filled rectangle shape."""
    from pptx.util import Inches as I
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        I(left), I(top), I(width), I(height)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()  # no border


def _slide_cover(
    prs: Presentation,
    title: str,
    subtitle: str,
    domain: str,
    is_end_card: bool = False,
) -> None:
    slide = _blank_slide(prs)
    _fill_bg(slide, DARK_BG)

    # Left accent bar
    _add_colored_rect(slide, 0, 0, 0.12, 7.5, PRIMARY)

    # Domain badge
    if domain:
        _add_textbox(slide, f"  {domain.upper()}  ", 0.4, 0.4, 3, 0.5,
                     font_size=11, bold=True, color=ACCENT)

    # Main title
    _add_textbox(slide, title, 0.5, 2.2, 9, 2,
                 font_size=40, bold=True, color=WHITE, align=PP_ALIGN.LEFT)

    # Subtitle / tagline
    if subtitle:
        _add_textbox(slide, subtitle, 0.5, 4.4, 8, 1,
                     font_size=20, color=RGBColor(0xCB, 0xD5, 0xE1), align=PP_ALIGN.LEFT)

    # Decorative right accent circle (purely visual)
    _add_colored_rect(slide, 10.5, 5.5, 2.5, 2.5, RGBColor(0x1E, 0x3A, 0x5F))
    _add_colored_rect(slide, 11.2, 6.2, 1.5, 1.5, PRIMARY)

    if is_end_card:
        _add_textbox(slide, "AI Co-Founder Team", 0.5, 6.8, 6, 0.5,
                     font_size=12, color=RGBColor(0x94, 0xA3, 0xB8))


def _slide_section(
    prs: Presentation,
    title: str,
    icon: str,
    content: str,
    accent: RGBColor,
) -> None:
    slide = _blank_slide(prs)
    _fill_bg(slide, DARK_BG)
    _add_colored_rect(slide, 0, 0, 0.08, 7.5, accent)

    _add_textbox(slide, f"{icon}  {title}", 0.3, 0.3, 10, 0.8,
                 font_size=28, bold=True, color=WHITE)
    _add_colored_rect(slide, 0.3, 1.25, 12.7, 0.04, accent)

    _add_textbox(slide, content, 0.3, 1.6, 12.5, 5.5,
                 font_size=17, color=RGBColor(0xCB, 0xD5, 0xE1))


def _slide_bullets(
    prs: Presentation,
    title: str,
    icon: str,
    bullets: list[str],
    accent: RGBColor,
    subtitle: str = "",
) -> None:
    slide = _blank_slide(prs)
    _fill_bg(slide, DARK_BG)
    _add_colored_rect(slide, 0, 0, 0.08, 7.5, accent)

    _add_textbox(slide, f"{icon}  {title}", 0.3, 0.3, 10, 0.8,
                 font_size=28, bold=True, color=WHITE)
    _add_colored_rect(slide, 0.3, 1.25, 12.7, 0.04, accent)

    if subtitle:
        _add_textbox(slide, subtitle, 0.3, 1.4, 12, 0.55,
                     font_size=14, color=RGBColor(0x94, 0xA3, 0xB8))

    y_start = 2.1 if subtitle else 1.7
    for i, bullet in enumerate(bullets[:7]):
        y = y_start + i * 0.7
        _add_colored_rect(slide, 0.3, y + 0.15, 0.1, 0.35, accent)
        _add_textbox(slide, bullet, 0.55, y, 12, 0.65,
                     font_size=16, color=RGBColor(0xE2, 0xE8, 0xF0))


def _slide_two_col(
    prs: Presentation,
    title: str,
    left_header: str,
    left_body: str,
    right_header: str,
    right_body: str,
) -> None:
    slide = _blank_slide(prs)
    _fill_bg(slide, DARK_BG)
    _add_colored_rect(slide, 0, 0, 0.08, 7.5, PRIMARY)

    _add_textbox(slide, title, 0.3, 0.3, 12, 0.8,
                 font_size=28, bold=True, color=WHITE)
    _add_colored_rect(slide, 0.3, 1.25, 12.7, 0.04, PRIMARY)

    # Left column
    _add_colored_rect(slide, 0.3, 1.45, 6.0, 5.8, RGBColor(0x1E, 0x29, 0x3B))
    _add_textbox(slide, left_header, 0.5, 1.55, 5.6, 0.55,
                 font_size=15, bold=True, color=ACCENT)
    _add_textbox(slide, left_body, 0.5, 2.2, 5.6, 4.8,
                 font_size=14, color=RGBColor(0xCB, 0xD5, 0xE1))

    # Right column
    _add_colored_rect(slide, 6.6, 1.45, 6.5, 5.8, RGBColor(0x1E, 0x29, 0x3B))
    _add_textbox(slide, right_header, 6.8, 1.55, 6.0, 0.55,
                 font_size=15, bold=True, color=PRIMARY)
    _add_textbox(slide, right_body, 6.8, 2.2, 6.0, 4.8,
                 font_size=14, color=RGBColor(0xCB, 0xD5, 0xE1))


def _slide_score(prs: Presentation, score: dict[str, int | float]) -> None:
    slide = _blank_slide(prs)
    _fill_bg(slide, DARK_BG)
    _add_colored_rect(slide, 0, 0, 0.08, 7.5, ACCENT)

    _add_textbox(slide, "📊  Startup Score", 0.3, 0.3, 10, 0.8,
                 font_size=28, bold=True, color=WHITE)
    _add_colored_rect(slide, 0.3, 1.25, 12.7, 0.04, ACCENT)

    metrics = list(score.items())
    cols = 3
    card_w = 3.8
    card_h = 1.8
    x_start = 0.4
    y_start = 1.7

    for i, (metric, val) in enumerate(metrics):
        col = i % cols
        row = i // cols
        x = x_start + col * (card_w + 0.2)
        y = y_start + row * (card_h + 0.25)

        _add_colored_rect(slide, x, y, card_w, card_h, RGBColor(0x1E, 0x29, 0x3B))

        label = metric.replace("_", " ").title()
        score_val = float(val)
        score_color = ACCENT if score_val >= 7 else (PRIMARY if score_val >= 5 else RGBColor(0xEF, 0x44, 0x44))

        _add_textbox(slide, label, x + 0.15, y + 0.15, card_w - 0.3, 0.5,
                     font_size=13, color=RGBColor(0x94, 0xA3, 0xB8))
        _add_textbox(slide, f"{score_val:.0f}/10", x + 0.15, y + 0.65, card_w - 0.3, 0.9,
                     font_size=30, bold=True, color=score_color)
