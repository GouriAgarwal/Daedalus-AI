# orchestrator/__init__.py
# Person A owns this package — this stub keeps imports clean for Person B.
# When Person A's graph.py is ready, run_pipeline will be importable here.

try:
    from orchestrator.graph import run_pipeline  # noqa: F401
except ImportError:
    run_pipeline = None  # graceful degradation → main.py falls back to mock data
