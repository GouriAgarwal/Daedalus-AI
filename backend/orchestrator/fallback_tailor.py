"""Tailor static fallback data to a specific startup idea."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any


def _fallback_path() -> Path:
    return Path(__file__).with_name("fallback_data.json")


def load_fallback_data() -> dict[str, Any]:
    with _fallback_path().open("r", encoding="utf-8") as file:
        return json.load(file)


def _infer_domain(idea: str) -> str:
    idea_lower = idea.lower()
    domain_keywords = {
        "HRMS": ["hrms", "hr ", "human resource", "payroll", "employee", "attendance", "onboarding"],
        "Healthcare": ["health", "medical", "telemedicine", "clinic", "patient", "doctor"],
        "E-commerce": ["shop", "ecommerce", "e-commerce", "retail", "fashion", "marketplace"],
        "EdTech": ["education", "learning", "course", "student", "tutor", "skill"],
        "FinTech": ["finance", "invest", "payment", "banking", "wallet", "micro-investment"],
        "Mobility": ["fleet", "ev ", "vehicle", "transport", "logistics", "delivery"],
        "FoodTech": ["food", "kitchen", "restaurant", "recipe", "meal"],
        "Climate": ["carbon", "climate", "sustainability", "green", "energy"],
    }
    for domain, keywords in domain_keywords.items():
        if any(keyword in idea_lower for keyword in keywords):
            return domain
    words = re.findall(r"[A-Za-z]{3,}", idea)
    return words[0].title() if words else "Startup"


def _short_label(idea: str, max_len: int = 36) -> str:
    cleaned = re.sub(r"\s+", " ", idea.strip())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 1].rstrip() + "…"


def tailor_fallback_for_idea(idea: str, base: dict[str, Any] | None = None) -> dict[str, Any]:
    """Return fallback pipeline output customized for the user's idea."""

    idea = idea.strip() or "A new startup idea"
    domain = _infer_domain(idea)
    label = _short_label(idea)

    sample = copy.deepcopy(base or load_fallback_data())
    if isinstance(sample.get("samples"), list) and sample["samples"]:
        sample = copy.deepcopy(sample["samples"][0])

    sample["idea"] = idea
    sample["domain"] = domain
    sample.setdefault("idea_context", {})
    sample["idea_context"].update(
        {
            "domain": domain,
            "audience": f"Primary users interested in {domain.lower()} solutions",
            "problem": f"Existing tools do not solve the core need behind: {idea}",
            "constraints": ["MVP-first delivery", "Founder-led GTM"],
            "keywords": re.findall(r"[A-Za-z]{4,}", idea.lower())[:6],
        }
    )

    round1 = sample.setdefault("round1", {})

    pm = round1.setdefault("pm", {})
    pm.update(
        {
            "problem": (
                f"Teams working on {domain.lower()} problems still rely on fragmented tools "
                f"and manual workflows when trying to deliver: {idea}"
            ),
            "solution": (
                f"A focused {domain} product that turns the idea into a usable MVP: {idea}"
            ),
            "target_users": [
                f"Early adopters in {domain}",
                "Founders validating product-market fit",
                "Operators who need a faster workflow",
            ],
            "target_user": f"Primary users for {label}",
            "core_features": [
                f"Guided onboarding for {domain.lower()} workflows",
                "Dashboard with actionable KPIs",
                "Core transaction/workflow module",
                "Notifications and activity history",
                "Admin settings and role management",
            ],
            "mvp_features": pm.get("mvp_features")
            or [
                f"Core workflow for {label}",
                "User dashboard",
                "Search and filtering",
                "Basic analytics",
                "Export/reporting",
            ],
            "mvp_scope": f"Ship the highest-value workflow for: {idea}",
            "roadmap": [
                "M1: Core workflow + dashboard",
                "M2: Collaboration + automation",
                "M3: Analytics + integrations",
                "M4: Scale + monetization",
            ],
            "tagline": f"The fastest way to launch {label}",
        }
    )

    ui = round1.setdefault("ui", {})

    _domain_colors = {
        "HRMS":       {"primary_color": "#6366F1", "accent_color": "#10B981"},
        "Healthcare": {"primary_color": "#06B6D4", "accent_color": "#10B981"},
        "E-commerce": {"primary_color": "#EC4899", "accent_color": "#F59E0B"},
        "EdTech":     {"primary_color": "#8B5CF6", "accent_color": "#10B981"},
        "FinTech":    {"primary_color": "#3B82F6", "accent_color": "#F59E0B"},
        "Mobility":   {"primary_color": "#14B8A6", "accent_color": "#F97316"},
        "FoodTech":   {"primary_color": "#F97316", "accent_color": "#EF4444"},
        "Climate":    {"primary_color": "#22C55E", "accent_color": "#84CC16"},
    }
    _colors = _domain_colors.get(domain, {"primary_color": "#7C3AED", "accent_color": "#10B981"})

    ui["design_system"] = ui.get("design_system") or {
        **_colors,
        "font": "Inter",
        "style": "Clean SaaS with dark mode support",
    }

    _domain_screens = {
        "Healthcare": [
            {"name": "Dashboard",       "components": [f"KPI cards for {domain}", "Appointment status chart", "Patient queue panel"]},
            {"name": "Appointments",    "components": ["Calendar view", "Search + filter bar", "Booking confirmation modal"]},
            {"name": "Patient Records", "components": [f"Primary data table for {label}", "Detail side panel", "Medical history list"]},
            {"name": "Video Consult",   "components": ["Video call panel", "Chat sidebar", "Prescription panel"]},
            {"name": "Settings",        "components": ["Profile settings", "Clinic permissions", "Integration toggles"]},
        ],
        "E-commerce": [
            {"name": "Dashboard", "components": [f"KPI cards for {domain}", "Revenue analytics chart", "Recent orders table"]},
            {"name": "Products",  "components": ["Search + filter bar", f"Primary data table for {label}", "Product detail panel"]},
            {"name": "Orders",    "components": ["Order list table", "Status filter bar", "Order detail modal"]},
            {"name": "Customers", "components": [f"KPI cards for {domain}", "Customer directory table", "Analytics chart"]},
            {"name": "Settings",  "components": ["Store settings", "Payment integrations", "Shipping rules panel"]},
        ],
        "EdTech": [
            {"name": "Dashboard", "components": [f"KPI cards for {domain}", "Progress analytics chart", "Upcoming lessons list"]},
            {"name": "Courses",   "components": ["Search + filter bar", f"Primary data table for {label}", "Course detail panel"]},
            {"name": "Students",  "components": ["Student directory table", "Analytics chart", "Detail side panel"]},
            {"name": "Lessons",   "components": ["Calendar view", "Lesson content panel", "Quiz modal"]},
            {"name": "Settings",  "components": ["Profile settings", "Certification panel", "Integration toggles"]},
        ],
        "FinTech": [
            {"name": "Dashboard",    "components": [f"KPI cards for {domain}", "Portfolio analytics chart", "Recent transactions table"]},
            {"name": "Portfolio",    "components": ["Search + filter bar", f"Primary data table for {label}", "Asset detail panel"]},
            {"name": "Transactions", "components": ["Transaction list table", "Search + filter bar", "Transaction detail modal"]},
            {"name": "Analytics",    "components": ["Analytics chart", "Performance metrics table", "Export panel"]},
            {"name": "Settings",     "components": ["Account settings", "Security panel", "Linked accounts panel"]},
        ],
        "HRMS": [
            {"name": "Dashboard",           "components": [f"KPI cards for {domain}", "Attrition risk chart", "Pending approvals table"]},
            {"name": "Employee Directory",  "components": ["Search + filter bar", f"Primary data table for {label}", "Detail side panel"]},
            {"name": "Leave Management",    "components": ["Calendar view", "Pending approvals list", "Policy configuration panel"]},
            {"name": "Payroll",             "components": ["Monthly payroll table", "Analytics chart", "Tax breakdown modal"]},
            {"name": "Settings",            "components": ["Profile settings", "Team permissions", "Integration toggles"]},
        ],
        "Mobility": [
            {"name": "Dashboard", "components": [f"KPI cards for {domain}", "Fleet map panel", "Active routes table"]},
            {"name": "Fleet",     "components": ["Search + filter bar", f"Primary data table for {label}", "Vehicle detail panel"]},
            {"name": "Routes",    "components": ["Route list table", "Calendar view", "Route detail modal"]},
            {"name": "Analytics", "components": ["Analytics chart", "Fuel & performance table", "Export panel"]},
            {"name": "Settings",  "components": ["Account settings", "Driver permissions", "Integration toggles"]},
        ],
        "FoodTech": [
            {"name": "Dashboard", "components": [f"KPI cards for {domain}", "Orders analytics chart", "Live orders table"]},
            {"name": "Menu",      "components": ["Search + filter bar", f"Primary data table for {label}", "Item detail panel"]},
            {"name": "Orders",    "components": ["Order list table", "Status filter bar", "Order detail modal"]},
            {"name": "Kitchen",   "components": ["Live order queue panel", "Status tracker", "Confirmation modal"]},
            {"name": "Settings",  "components": ["Restaurant settings", "Delivery integrations", "Tax panel"]},
        ],
        "Climate": [
            {"name": "Dashboard", "components": [f"KPI cards for {domain}", "Emissions analytics chart", "Recent transactions table"]},
            {"name": "Projects",  "components": ["Search + filter bar", f"Primary data table for {label}", "Project detail panel"]},
            {"name": "Credits",   "components": ["Credit portfolio table", "Analytics chart", "Transaction modal"]},
            {"name": "Reports",   "components": ["Analytics chart", "Compliance metrics table", "Export panel"]},
            {"name": "Settings",  "components": ["Account settings", "Partner integrations", "Audit panel"]},
        ],
    }
    ui["screens"] = _domain_screens.get(domain, [
        {"name": "Dashboard",          "components": [f"KPI cards for {domain}", f"Recent activity for {label}", "Quick-action panel"]},
        {"name": f"{domain} Workspace","components": ["Search + filter bar", f"Primary data table for {label}", "Detail side panel"]},
        {"name": "Workflow",           "components": [f"Step-by-step flow for {domain.lower()} tasks", "Status tracker", "Confirmation modal"]},
        {"name": "Analytics",          "components": ["Analytics chart", "Performance metrics table", "Export panel"]},
        {"name": "Settings",           "components": ["Profile settings", "Team permissions", "Integration toggles"]},
    ])
    ui["key_user_flows"] = [
        f"User signs up → completes onboarding for {label}",
        f"User performs the core {domain.lower()} action → sees result on dashboard",
        "Admin reviews activity → exports summary",
    ]
    ui["key_interactions"] = ui["key_user_flows"]
    ui["component_library"] = "Radix UI + Tailwind CSS"

    backend = round1.setdefault("backend", {})
    entity_name = re.sub(r"[^a-z0-9]+", "_", domain.lower()).strip("_") or "core_entity"
    backend.update(
        {
            "architecture": f"Modular FastAPI services for {label}",
            "services": [
                "auth-service",
                f"{entity_name}-service",
                "workflow-service",
                "notification-service",
            ],
            "database_schema": {
                "users": ["id", "email", "role", "created_at"],
                entity_name: ["id", "name", "status", "owner_id", "updated_at"],
                "events": ["id", "entity_id", "type", "payload", "created_at"],
            },
            "api_endpoints": [
                "POST /auth/login",
                f"GET /{entity_name}",
                f"POST /{entity_name}",
                "GET /dashboard/summary",
                "POST /workflows/run",
            ],
            "key_endpoints": backend.get("key_endpoints")
            or [
                "POST /auth/login",
                f"GET /{entity_name}",
                f"POST /{entity_name}",
            ],
            "tech_stack": ["FastAPI", "PostgreSQL", "Redis", "Celery"],
            "tech_choices": {
                "auth": "JWT + OAuth2",
                "queue": "Redis + Celery",
                "infra": "Docker Compose (dev), Render (prod)",
            },
        }
    )

    marketing = round1.setdefault("marketing", {})
    marketing.update(
        {
            "gtm_strategy": f"Product-led launch targeting early {domain.lower()} adopters validating {label}.",
            "positioning": f"A faster, more focused alternative for teams building around: {idea}",
            "competitive_positioning": f"More opinionated and faster to deploy than generic {domain.lower()} tools.",
            "channels": [
                f"Community outreach in {domain} forums",
                "Founder-led LinkedIn content",
                f"SEO around {domain.lower()} workflow keywords",
                "Pilot partnerships with 5 design partners",
            ],
            "target_cac": "$90–$150",
            "target_ltv": "$1,200+",
            "messaging": f"Launch {label} without rebuilding your entire stack.",
            "launch_hook": f"The team that turned '{label}' into a working MVP in weeks, not months",
        }
    )

    critique = sample.setdefault("round2_critique", {})
    critique["investor_concerns"] = [
        f"How defensible is this in the {domain} market against incumbents?",
        f"What proof do you have that users will pay for {label} instead of stitching together existing tools?",
        "What is the realistic CAC for this ICP in the first 12 months?",
    ]
    critique["skeptic_flags"] = [
        f"The idea may be too broad unless you narrow the first workflow for {domain.lower()} users.",
        "Integration and compliance requirements could slow MVP delivery.",
        "Differentiation needs to be sharper than 'AI-powered' positioning alone.",
    ]
    critique["revisions"] = {
        "pm": {
            "revised_mvp_scope": f"Narrow MVP to one killer workflow for {label}.",
            "differentiation": f"Own a single painful job-to-be-done in {domain.lower()} before expanding scope.",
            "updated_roadmap": [
                f"M1: Core workflow for {label}",
                "M2: Collaboration",
                "M3: Integrations",
                "M4: Advanced automation",
            ],
        }
    }

    sample["startup_score"] = sample.get("startup_score") or {
        "feasibility":      min(10, max(4, 6 + (len(cleaned_idea) % 4))),
        "market_size":      min(10, max(4, 5 + (len(domain) % 5))),
        "differentiation":  min(10, max(4, 4 + (len(cleaned_idea) % 6))),
        "team_fit":         min(10, max(4, 7 - (len(domain) % 3))),
        "innovation":       min(10, max(4, 5 + (len(cleaned_idea) % 5))),
        "execution":        min(10, max(4, 6 + (len(domain) % 4))),
    }

    return sample
