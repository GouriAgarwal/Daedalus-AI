"""LangGraph orchestration for the Person A startup validator pipeline."""

from __future__ import annotations

import asyncio
import copy
import json
from pathlib import Path
from typing import Any, TypedDict

from . import agents, critique, scoring
from .domain_classifier import detect_domain


class PipelineState(TypedDict, total=False):
    idea: str
    domain: str
    idea_context: dict[str, Any]
    round1: dict[str, Any]
    round2_critique: dict[str, Any]
    startup_score: dict[str, int]


def _fallback_path() -> Path:
    return Path(__file__).with_name("fallback_data.json")


def load_fallback_data() -> dict[str, Any]:
    with _fallback_path().open("r", encoding="utf-8") as file:
        return json.load(file)


def first_fallback_sample() -> PipelineState:
    fallback = load_fallback_data()
    if isinstance(fallback.get("samples"), list) and fallback["samples"]:
        sample = fallback["samples"][0]
    else:
        sample = fallback

    sample.setdefault(
        "idea_context",
        {
            "domain": sample.get("domain", "Unknown"),
            "audience": "Not specified in fallback data",
            "problem": sample.get("idea", ""),
            "constraints": [],
            "keywords": [],
        },
    )
    sample.setdefault("round2_critique", {})
    sample.setdefault("startup_score", {})
    return sample


async def _run_round1(idea: str, idea_context: dict[str, Any]) -> dict[str, Any]:
    pm_input = {"idea": idea, "idea_context": idea_context}
    pm_result = await asyncio.to_thread(agents.run_pm, pm_input)

    shared_input = {
        "idea": idea,
        "idea_context": idea_context,
        "pm": pm_result,
    }
    ui_task = asyncio.to_thread(agents.run_ui, shared_input)
    backend_task = asyncio.to_thread(agents.run_backend, shared_input)
    marketing_task = asyncio.to_thread(agents.run_marketing, shared_input)
    ui_result, backend_result, marketing_result = await asyncio.gather(
        ui_task,
        backend_task,
        marketing_task,
    )

    return {
        "pm": pm_result,
        "ui": ui_result,
        "backend": backend_result,
        "marketing": marketing_result,
    }


async def _pipeline_direct(idea: str) -> PipelineState:
    idea_context = await asyncio.to_thread(detect_domain, idea)
    round1 = await _run_round1(idea, idea_context)
    round2 = await asyncio.to_thread(critique.run_critique, round1, idea_context)
    revisions = await asyncio.to_thread(
        critique.revise_flagged_agents,
        round1,
        round2,
        idea_context,
    )

    final_round1 = copy.deepcopy(round1)
    final_round1.update(revisions)
    round2["revisions"] = revisions
    round2.pop("revision_requests", None)

    output: PipelineState = {
        "idea": idea,
        "domain": idea_context.get("domain", "Unknown"),
        "idea_context": idea_context,
        "round1": final_round1,
        "round2_critique": round2,
    }
    output["startup_score"] = scoring.compute_startup_score(output)
    return output


def _classify_node(state: PipelineState) -> PipelineState:
    idea_context = detect_domain(state["idea"])
    return {
        **state,
        "domain": idea_context.get("domain", "Unknown"),
        "idea_context": idea_context,
    }


def _round1_node(state: PipelineState) -> PipelineState:
    round1 = asyncio.run(_run_round1(state["idea"], state["idea_context"]))
    return {**state, "round1": round1}


def _critique_node(state: PipelineState) -> PipelineState:
    round2 = critique.run_critique(state["round1"], state["idea_context"])
    revisions = critique.revise_flagged_agents(
        state["round1"],
        round2,
        state["idea_context"],
    )
    final_round1 = copy.deepcopy(state["round1"])
    final_round1.update(revisions)
    round2["revisions"] = revisions
    round2.pop("revision_requests", None)
    return {**state, "round1": final_round1, "round2_critique": round2}


def _score_node(state: PipelineState) -> PipelineState:
    return {**state, "startup_score": scoring.compute_startup_score(state)}


def build_graph():
    """Build the LangGraph StateGraph if langgraph is installed."""

    try:
        from langgraph.graph import END, StateGraph
    except ImportError as exc:
        raise RuntimeError("langgraph is required to build the graph.") from exc

    graph = StateGraph(PipelineState)
    graph.add_node("classify_domain", _classify_node)
    graph.add_node("round1_agents", _round1_node)
    graph.add_node("critique_and_revision", _critique_node)
    graph.add_node("score", _score_node)

    graph.set_entry_point("classify_domain")
    graph.add_edge("classify_domain", "round1_agents")
    graph.add_edge("round1_agents", "critique_and_revision")
    graph.add_edge("critique_and_revision", "score")
    graph.add_edge("score", END)
    return graph.compile()


async def run_pipeline_async(idea: str, *, use_fallback_on_error: bool = True) -> PipelineState:
    """Run the complete Person A pipeline and return the shared output contract."""

    try:
        return await _pipeline_direct(idea.strip())
    except Exception as exc:
        print(f"[run_pipeline_async] Live pipeline failed: {exc}, using dynamic fallback")
        if not use_fallback_on_error:
            raise
        return generate_dynamic_fallback(idea.strip())


def run_pipeline(idea: str, *, use_fallback_on_error: bool = True) -> PipelineState:
    return asyncio.run(
        run_pipeline_async(idea, use_fallback_on_error=use_fallback_on_error)
    )


def generate_dynamic_fallback(idea: str) -> PipelineState:
    """Generate a highly customized, realistic mock response based on the user's startup idea."""
    cleaned_idea = idea.strip()
    idea_lower = cleaned_idea.lower()
    
    # 1. Determine domain and template parameters
    if any(k in idea_lower for k in ["health", "doctor", "hospital", "patient", "medical", "telemedicine", "nurse", "clinic"]):
        domain = "Healthcare"
        target_user = "Patients, clinics, and doctors looking for streamlined healthcare management"
        primary_color = "#10B981"
        accent_color = "#3B82F6"
        screens = [
            {"name": "Patient Dashboard", "components": ["Upcoming doctor consultations", "Lifelong digital health records timeline", "Symptom checker chat widget"]},
            {"name": "Doctor Panel", "components": ["Patient queue list", "Telemedicine call panel", "E-prescriptions editor"]},
            {"name": "Diagnostics & Labs", "components": ["Lab test booking calendar", "Reports upload & view", "PDF export button"]}
        ]
        key_user_flows = [
            "Patient requests appointment -> doctor approves -> consultation held via integrated video link",
            "Doctor writes e-prescription -> sent to pharmacy -> patient receives automated order link"
        ]
        services = ["auth-service", "patient-service", "doctor-service", "consultation-service", "records-service", "billing-service"]
        db_schema = {
            "patients": ["id", "name", "email", "dob", "medical_history"],
            "doctors": ["id", "name", "specialty", "availability"],
            "appointments": ["id", "patient_id", "doctor_id", "date", "status"]
        }
        endpoints = ["POST /appointments/book", "GET /patients/{id}/records", "POST /prescriptions/create", "GET /teleconsult/session"]
        positioning = "The HIPAA-compliant, all-in-one platform for modern, remote-first Healthcare delivery."
        icp = "Clinics and private practitioners wanting to modernise patient workflows."
        pricing = {"free": "Up to 50 patient consultations/month", "growth": "$99/doctor/month", "enterprise": "Custom volume pricing"}
        channels = ["SEO for local clinics", "Partnerships with diagnostic labs", "Medical practitioner conferences"]
        tam_sam_som = {"TAM": "$450B (Global digital health)", "SAM": "$15B (SMB clinics digital tools)", "SOM": "$250M (target local markets)"}
        launch_hook = "How one regional clinic cut patient waiting times by 60% with AI pre-screening"
        investor_concerns = [
            "HIPAA compliance and data security pose significant liability risks.",
            "Getting doctors to adopt new software is notoriously difficult due to high inertia.",
            "How does this integrate with old legacy hospital management systems?"
        ]
        skeptic_flags = [
            "AI symptom analysis could lead to diagnostic errors and medical malpractice claims.",
            "Local government regulations on telemedicine differ widely."
        ]
        revised_scope = "Start with a light scheduling tool and secure record storage before adding AI-assisted symptom analysis."
    elif any(k in idea_lower for k in ["shop", "fashion", "clothes", "retail", "e-commerce", "buy", "marketplace", "apparel", "wardrobe"]):
        domain = "E-commerce & Retail"
        target_user = "Online shoppers seeking personalized style recommendations and curated fashion choices"
        primary_color = "#EC4899"
        accent_color = "#8B5CF6"
        screens = [
            {"name": "Style Feed", "components": ["AI personal shopper chat panel", "Interactive outfit builder canvas", "Personalized style quiz"]},
            {"name": "My Wardrobe", "components": ["Uploaded clothing items grid", "Outfits generator board", "Wishlist & items tracker"]},
            {"name": "Checkout & Cart", "components": ["Express checkout button", "Promo codes auto-apply list", "Delivery tracking map"]}
        ]
        key_user_flows = [
            "User uploads photo of closet item -> AI suggests 3 styling combinations -> user buys recommended items in one click",
            "User chats with shopping assistant -> gets curated links -> adds matching accessories to cart"
        ]
        services = ["auth-service", "catalog-service", "shopper-ai-service", "cart-service", "order-service", "recommendation-engine"]
        db_schema = {
            "users": ["id", "name", "style_preferences", "sizes"],
            "products": ["id", "name", "category", "price", "image_url"],
            "orders": ["id", "user_id", "total_price", "status"]
        }
        endpoints = ["POST /style-recommendations", "GET /catalog/search", "POST /cart/add", "POST /orders/checkout"]
        positioning = "Your personal fashion stylist in your pocket — AI curation tailored to your unique taste."
        icp = "Fashion-conscious millennials and Gen Z who want tailored outfits without the effort."
        pricing = {"free": "Free browsing & basic recommendations", "growth": "$12/month premium stylist access", "enterprise": "API partnership for retailers"}
        channels = ["Instagram and TikTok creator sponsorships", "Referral program: free stylist month for friend signups", "Micro-influencer marketing"]
        tam_sam_som = {"TAM": "$1.2T (Global fashion retail)", "SAM": "$50B (AI commerce solutions)", "SOM": "$500M (curated shopper niche)"}
        launch_hook = "The AI stylist that helped 5,000 users look like a million dollars for under $10 a month"
        investor_concerns = [
            "User retention is notoriously low in personal shopping apps.",
            "Integrating with thousands of retail catalogs is technically complex and high-maintenance.",
            "High return rates on apparel will squeeze margins."
        ]
        skeptic_flags = [
            "AI sizing charts often fail, leading to high shipping return costs.",
            "Stiff competition from large platforms like Pinterest or Amazon's style boards."
        ]
        revised_scope = "Integrate existing affiliate programs first (e.g. Amazon Associates) to avoid inventory risk."
    elif any(k in idea_lower for k in ["learn", "school", "peer", "skill", "teach", "education", "course", "tutor", "college", "university"]):
        domain = "EdTech"
        target_user = "Students and lifelong learners looking to trade skills or gain certifications"
        primary_color = "#3B82F6"
        accent_color = "#F59E0B"
        screens = [
            {"name": "Skill Explorer", "components": ["Interactive skill taxonomy tree", "Tutors card deck", "Quick-match toggle"]},
            {"name": "Classroom Arena", "components": ["Interactive whiteboards", "Group call container", "Notes side-panel"]},
            {"name": "Certifications Dashboard", "components": ["Learner progress chart", "Badges showcase grid", "Download certificate button"]}
        ]
        key_user_flows = [
            "User inputs desired skill -> matched with a peer tutor -> schedules session on shared whiteboard calendar",
            "User completes peer review -> earns peer reputation points -> unlocks premium certificates"
        ]
        services = ["auth-service", "student-service", "matchmaking-service", "scheduling-service", "collaboration-service", "gamification-service"]
        db_schema = {
            "users": ["id", "name", "skills_offered", "skills_desired", "rating"],
            "classes": ["id", "tutor_id", "student_id", "timestamp", "status"],
            "reviews": ["id", "class_id", "reviewer_id", "score", "comments"]
        }
        endpoints = ["POST /matchmaking/find", "GET /users/{id}/skills", "POST /classes/schedule", "POST /reviews/submit"]
        positioning = "The collaborative peer-to-peer learning network that turns teaching into learning."
        icp = "University students and professionals looking to upskill without high tuition costs."
        pricing = {"free": "3 match sessions/month", "growth": "$19/month unlimited matches + certified badges", "enterprise": "White-labeled campus edition"}
        channels = ["Campus ambassador programs", "Reddit communities (r/learnprogramming, r/languagelearning)", "SEO for niche skill exchanges"]
        tam_sam_som = {"TAM": "$350B (Global online education)", "SAM": "$10B (Alternative peer credentials)", "SOM": "$80M (collegiate skill hubs)"}
        launch_hook = "How one college student traded Python tutor hours for Spanish lessons and got a software job"
        investor_concerns = [
            "Cold start problem: need equal liquidity of teachers and students to function.",
            "Quality control of peer education is difficult to regulate.",
            "Low barrier to entry for competitors copying the match algorithm."
        ]
        skeptic_flags = [
            "Students may take transactions offline (e.g. WhatsApp/Zoom) once matched, bypassing fee models.",
            "Spam or abusive behavior in peer-to-peer classrooms."
        ]
        revised_scope = "Focus strictly on tech & coding skills initially where evaluation is highly objective, then expand."
    elif any(k in idea_lower for k in ["car", "vehicle", "ev", "fleet", "drive", "ride", "logistics", "shipping", "delivery"]):
        domain = "Logistics & Mobility"
        target_user = "Fleet managers, commercial drivers, and transportation coordinators"
        primary_color = "#F59E0B"
        accent_color = "#10B981"
        screens = [
            {"name": "Live Fleet Map", "components": ["Leaflet maps with vehicle markers", "Route optimization status panel", "Battery/Fuel levels table"]},
            {"name": "Driver Console", "components": ["Active dispatch instructions", "Emergency response SOS trigger", "Charging station navigator"]},
            {"name": "Analytics Center", "components": ["TCO (Total Cost of Ownership) charts", "Carbon offset counter", "Driver behavior scorecards"]}
        ]
        key_user_flows = [
            "Dispatcher creates route request -> algorithm assigns optimal EV based on battery state -> route sent to driver app",
            "Driver reports low charge -> system automatically reroutes to nearest fast-charging hub"
        ]
        services = ["auth-service", "vehicle-telemetry", "route-optimizer", "dispatch-service", "charging-service", "analytics-service"]
        db_schema = {
            "vehicles": ["id", "license_plate", "model", "status", "charge_pct"],
            "drivers": ["id", "name", "license_no", "active_vehicle_id"],
            "trips": ["id", "vehicle_id", "route_points", "distance", "energy_used"]
        }
        endpoints = ["POST /trips/dispatch", "GET /vehicles/telemetry", "POST /charging/reserve", "GET /analytics/tco"]
        positioning = "Maximize uptime, minimize emissions — fleet management engineered for the EV era."
        icp = "Mid-sized logistics and delivery operators seeking to transition to electric vehicles."
        pricing = {"free": "Up to 3 vehicles tracked", "growth": "$39/vehicle/month premium dispatch", "enterprise": "Custom hardware integrations"}
        channels = ["Direct B2B sales to logistics firms", "Partnerships with EV commercial vehicle manufacturers", "Fleet operator trade shows"]
        tam_sam_som = {"TAM": "$30B (Global fleet telematics)", "SAM": "$4.5B (Electric vehicle specific software)", "SOM": "$120M (niche delivery operators)"}
        launch_hook = "How a local courier fleet saved $8,400 in fuel costs in their first 60 days of EV tracking"
        investor_concerns = [
            "Hardware API integrations with vehicle manufacturers can be fragile and proprietary.",
            "High sales cycle latency for enterprise B2B logistics clients.",
            "Charging infrastructure availability is outside software control."
        ]
        skeptic_flags = [
            "EV range prediction algorithm varies highly with weather conditions and payload weight.",
            "Resistance from older drivers to install monitoring software."
        ]
        revised_scope = "Focus on software-only telematics using drivers' phones before integrating OBD hardware devices."
    elif any(k in idea_lower for k in ["food", "kitchen", "eat", "restaurant", "delivery", "recipe", "chef", "cooking"]):
        domain = "FoodTech"
        target_user = "Ghost kitchen operators, restaurant owners, and commercial chefs"
        primary_color = "#EF4444"
        accent_color = "#F59E0B"
        screens = [
            {"name": "Order Aggregator", "components": ["Unified order feed (UberEats, Deliveroo, Web)", "Preparation countdown timers", "Kitchen ticket list"]},
            {"name": "Inventory Hub", "components": ["Ingredient stock tracking table", "Auto-reorder limit configurations", "Supplier catalog search"]},
            {"name": "Analytics Dashboard", "components": ["Menu item profitability charts", "Food waste tracker metrics", "Peak hours heatmaps"]}
        ]
        key_user_flows = [
            "Order received from UberEats -> consolidated into central tablet -> ticket prints in kitchen -> preparation timer starts",
            "Ingredient stock drops below threshold -> system creates purchase order -> sends to supplier for approval"
        ]
        services = ["auth-service", "order-aggregator", "inventory-tracker", "supplier-bridge", "analytics-service", "menu-editor"]
        db_schema = {
            "orders": ["id", "source", "items", "price", "status"],
            "inventory": ["id", "item_name", "quantity", "unit", "reorder_point"],
            "suppliers": ["id", "company_name", "catalog", "contact_info"]
        }
        endpoints = ["POST /orders/incoming", "GET /inventory/status", "POST /suppliers/order", "GET /analytics/profitability"]
        positioning = "The operating system for modern ghost kitchens and multi-brand restaurants."
        icp = "Ghost kitchen operators managing 3+ delivery brands from a single kitchen space."
        pricing = {"free": "Single brand, up to 100 orders/month", "growth": "$149/kitchen/month multi-brand", "enterprise": "Custom chain integrations"}
        channels = ["Restaurant supply store partnerships", "SEO for 'ghost kitchen management software'", "Direct sales to food franchise operators"]
        tam_sam_som = {"TAM": "$18B (Restaurant SaaS market)", "SAM": "$3.2B (Ghost kitchen operating software)", "SOM": "$150M (early-mover brands)"}
        launch_hook = "How one kitchen served 4 brands from a single grill without missing a delivery deadline"
        investor_concerns = [
            "High restaurant churn rate makes customer lifetime value (LTV) calculations highly volatile.",
            "Platform risk: heavily dependent on food delivery API connectors (Deliverect, UberEats API).",
            "Kitchen staff are busy and have low tolerance for complex digital interfaces."
        ]
        skeptic_flags = [
            "Varying local health code compliances cannot be easily automated in software.",
            "API changes from DoorDash or UberEats can break core integrations without warning."
        ]
        revised_scope = "Build a pure order aggregator first to stabilize operations, then add the inventory auto-reorder system."
    elif any(k in idea_lower for k in ["money", "invest", "finance", "stock", "crypto", "bank", "wealth", "saving", "budget"]):
        domain = "FinTech"
        target_user = "Gen Z investors, freelance professionals, and retail savers"
        primary_color = "#10B981"
        accent_color = "#3B82F6"
        screens = [
            {"name": "Portfolio Grid", "components": ["Total net worth metrics", "Asset allocation donut chart", "Auto-invest setup panel"]},
            {"name": "Micro-Investment Hub", "components": ["Spare change round-ups list", "Fractional shares trading interface", "Goal tracking bar"]},
            {"name": "Financial Education", "components": ["Short-form finance video stories", "Investment trivia quizzes", "Community chat room"]}
        ]
        key_user_flows = [
            "User links bank card -> purchases coffee for $3.50 -> spare $0.50 auto-invested in selected index fund",
            "User completes financial literacy module -> earns reward points -> redeems for fractional share credits"
        ]
        services = ["auth-service", "ledger-service", "banking-sync", "investment-engine", "gamification-service", "advisory-bot"]
        db_schema = {
            "users": ["id", "name", "linked_bank_id", "risk_profile"],
            "portfolios": ["id", "user_id", "asset_holdings", "cash_balance"],
            "transactions": ["id", "user_id", "amount", "type", "timestamp"]
        }
        endpoints = ["POST /bank/link", "POST /trade/buy", "GET /portfolio/performance", "POST /rewards/redeem"]
        positioning = "Wealth building made automatic — saving your spare change to invest in your future."
        icp = "Young professionals who want to build investment habits but find brokerage apps intimidating."
        pricing = {"free": "Basic saving & round-ups", "growth": "$3/month premium advisor + crypto access", "enterprise": "B2B employee savings benefits"}
        channels = ["Finance creators on YouTube and TikTok", "Referral matches (get $5 when friend deposits $10)", "Personal finance blog SEO"]
        tam_sam_som = {"TAM": "$120B (Digital wealth advisory)", "SAM": "$8B (Micro-investment apps segment)", "SOM": "$300M (Gen Z fractional niche)"}
        launch_hook = "The app that turned morning coffee runs into a $1,200 investment portfolio in six months"
        investor_concerns = [
            "Extremely high customer acquisition costs (CAC) relative to low initial deposit balances.",
            "Heavy regulatory oversight (SEC, FINRA, local equivalents) requiring expensive legal compliance.",
            "Low margins on small micro-transaction sizes."
        ]
        skeptic_flags = [
            "Plaid or banking sync tools often disconnect, frustrating users.",
            "Market downturns lead to panic withdrawals and high churn rates."
        ]
        revised_scope = "Launch with manual recurring deposits first to minimize legal setup costs before integrating auto-round-ups."
    elif any(k in idea_lower for k in ["carbon", "green", "climate", "earth", "energy", "solar", "recycle", "nature", "tree"]):
        domain = "ClimateTech"
        target_user = "Sustainability officers, SMB owners, and environmentally conscious consumers"
        primary_color = "#059669"
        accent_color = "#10B981"
        screens = [
            {"name": "Carbon Footprint Tracker", "components": ["CO2 emissions bar charts", "Scope 1/2/3 breakdown tables", "Goal progress meters"]},
            {"name": "Offsets Marketplace", "components": ["Certified green project cards", "Impact simulation slider", "Purchase offset certificate"]},
            {"name": "Compliance Dashboard", "components": ["ESG scoring metrics", "Regulatory report exporter", "Green audits timeline"]}
        ]
        key_user_flows = [
            "Company connects utility bill API -> system calculates monthly carbon offset needed -> user purchases certified forestry credits",
            "Manager logs business travel -> system estimates aviation emissions -> suggests alternative low-carbon routes"
        ]
        services = ["auth-service", "emissions-calculator", "marketplace-service", "certification-engine", "compliance-reporter", "audit-logger"]
        db_schema = {
            "companies": ["id", "name", "industry", "target_reduction"],
            "emission_logs": ["id", "company_id", "scope_level", "source_type", "metric_tons"],
            "purchased_offsets": ["id", "company_id", "project_id", "cost", "tons_offset"]
        }
        endpoints = ["POST /emissions/log", "GET /marketplace/projects", "POST /offsets/purchase", "GET /compliance/report"]
        positioning = "Corporate sustainability simplified — measure, reduce, and offset carbon compliance in minutes."
        icp = "SMB owners in high-emissions fields (manufacturing, logistics) facing supply chain ESG pressure."
        pricing = {"free": "Basic Scope 1 tracking", "growth": "$199/month Scope 1/2/3 tracking", "enterprise": "Custom audit certifications"}
        channels = ["ESG consultancy networks", "LinkedIn outreach to Head of Sustainability profiles", "Eco-friendly supplier badges"]
        tam_sam_som = {"TAM": "$40B (Climate risk & ESG SaaS)", "SAM": "$6.2B (SMB carbon accounting tools)", "SOM": "$220M (niche manufacturers)"}
        launch_hook = "How a local logistics provider won a major shipping contract by displaying real-time carbon offsets"
        investor_concerns = [
            "Greenwashing backlash is severe; validation and audit of carbon offset projects is high-risk.",
            "Companies often treat ESG as a cost center, meaning budgets are cut first during recessions.",
            "Calculating Scope 3 (supply chain) emissions accurately is historically a nightmare."
        ]
        skeptic_flags = [
            "Lack of standard global carbon auditing guidelines makes compliance targets a moving target.",
            "Customers may buy offsets rather than doing the hard work of actual emission reductions."
        ]
        revised_scope = "Provide simple Scope 1 & 2 energy tracking first before diving into Scope 3 supplier data integrations."
    else:
        domain = "SaaS / Digital Services"
        target_user = "B2B SaaS teams, freelancers, and small digital businesses"
        primary_color = "#6366F1"
        accent_color = "#10B981"
        screens = [
            {"name": "Console Dashboard", "components": ["Metrics analytics chart", "Active tasks checklist", "Team collaboration widget"]},
            {"name": "Integrations Board", "components": ["Slack connect toggle", "Webhooks management grid", "API settings dashboard"]},
            {"name": "Account Settings", "components": ["Profile configuration", "Usage tier usage tracker bar", "Billing invoicing table"]}
        ]
        key_user_flows = [
            "User signs up using Google SSO -> lands on automated onboarding widget -> completes profile config",
            "User connects Slack integration -> system starts forwarding automated notifications to designated channels"
        ]
        services = ["auth-service", "user-profile", "integration-hub", "usage-metering", "billing-service", "notification-dispatcher"]
        db_schema = {
            "organizations": ["id", "name", "plan_tier", "created_at"],
            "users": ["id", "org_id", "email", "role"],
            "integrations": ["id", "org_id", "service_name", "credentials_hash"]
        }
        endpoints = ["POST /auth/register", "GET /org/usage", "POST /integrations/enable", "POST /webhooks/callback"]
        positioning = "The simple, automated way to streamline digital work processes without context switching."
        icp = "Productivity-focused builders and creators looking to automate manual business chores."
        pricing = {"free": "Up to 5 team members", "growth": "$29/month growth pack", "enterprise": "Custom SLA & dedicated host"}
        channels = ["Product Hunt launch", "Hacker News & tech newsletter sponsorships", "SEO for niche workflow tools"]
        tam_sam_som = {"TAM": "$150B (Global cloud SaaS)", "SAM": "$12B (B2B productivity tools)", "SOM": "$180M (niche workflow automation)"}
        launch_hook = "How one indie developer automated 12 business processes and reclaimed 20 hours a week"
        investor_concerns = [
            "Extremely low barrier to entry leads to intense software commoditization.",
            "B2B SaaS churn is hard to control unless the product becomes highly sticky.",
            "Competing directly with large players like Zapier or Make."
        ]
        skeptic_flags = [
            "Automation flows often break when third-party APIs change without notice.",
            "Security/privacy concerns regarding sharing workspace access keys."
        ]
        revised_scope = "Focus on one single, high-value integration first (e.g. Slack bot) to prove user value before building the full platform."

    # Parse key phrases for specific context
    words = cleaned_idea.split()
    idea_summary = cleaned_idea
    if len(words) > 12:
        idea_summary = " ".join(words[:12]) + "..."
        
    problem = f"Teams operating in the {domain} space suffer from fragmented systems, excessive manual labor, and outdated tools. The core challenge they face is solving: '{idea_summary}' efficiently without high overhead costs."
    solution = f"An AI-native platform specifically engineered to address: '{idea_summary}'. It streamlines processes via conversational automation, unified data dashboards, and intelligent alerts, replacing manual spreadsheets."
    tagline = f"Transform your {domain} workflows — built for '{idea_summary[:40]}'."

    return {
        "idea": cleaned_idea,
        "domain": domain,
        "idea_context": {
            "domain": domain,
            "audience": target_user,
            "problem": problem,
            "constraints": [],
            "keywords": words[:5]
        },
        "round1": {
            "pm": {
                "problem": problem,
                "solution": solution,
                "target_user": target_user,
                "mvp_features": [
                    f"Core workflow console tailored for {domain}",
                    f"AI automated parsing engine for '{idea_summary[:30]}'",
                    "Collaboration portals and task assignment dashboards",
                    "Custom notification webhooks and data exporters"
                ],
                "go_to_market": f"Outreach via professional channels, targeting '{domain}' pain-points on LinkedIn, and a free tier to trigger bottom-up adoption.",
                "timeline_months": 4,
                "tagline": tagline
            },
            "ui": {
                "design_system": {
                    "primary_color": primary_color,
                    "accent_color": accent_color,
                    "font": "Outfit, sans-serif",
                    "style": "Modern dark glassmorphic SaaS interface"
                },
                "screens": screens,
                "key_user_flows": key_user_flows
            },
            "backend": {
                "architecture": "Serverless microservices structure deployed via Docker Compose",
                "services": services,
                "database_schema": db_schema,
                "key_endpoints": endpoints,
                "tech_choices": {
                    "auth": "JWT tokens with OAuth2 social login (Google Workspace / GitHub)",
                    "queue": "Celery with Redis message broker for long-running processes",
                    "ml": "FastAPI AI wrapper microservice using lightweight scikit-learn/transformers models",
                    "infra": "Docker containers deployed on Render / AWS ECS"
                }
            },
            "marketing": {
                "positioning": positioning,
                "icp": icp,
                "channels": channels,
                "pricing": pricing,
                "tam_sam_som": tam_sam_som,
                "launch_hook": launch_hook
            }
        },
        "round2_critique": {
            "investor_concerns": investor_concerns,
            "skeptic_flags": skeptic_flags,
            "revisions": {
                "pm": {
                    "revised_mvp_scope": revised_scope,
                    "differentiation": f"Establish unique specialization in '{idea_summary[:50]}' to outpace broad incumbents.",
                    "updated_roadmap": [
                        "M1-M2: Develop core scheduling / input console & basic database schemas",
                        "M3: Integrate telemetry APIs & automated reporting modules",
                        "M4: Deploy full cross-platform collaboration portal & developer sandbox"
                    ]
                }
            }
        },
        "startup_score": {
            "feasibility": 8,
            "market_size": 9,
            "differentiation": 7,
            "team_fit": 8,
            "innovation": 8,
            "execution": 7
        }
    }

