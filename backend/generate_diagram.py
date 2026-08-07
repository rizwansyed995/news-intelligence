import os
os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"
from graphviz import Digraph

def create_architecture_diagram():
    # Initialize the graph with the same aesthetic as the provided image
    dot = Digraph(
        name="Nexus_AI_Architecture",
        format="png",
        graph_attr={
            "rankdir": "LR",
            "nodesep": "0.4",
            "ranksep": "0.7",
            "fontname": "Helvetica",
            "fontsize": "14",
            "splines": "ortho",
            "bgcolor": "#F4F6F8",  # Light gray-blue background
            "label": "Nexus AI – System & Architecture Workflow",
            "labelloc": "t",
            "labeljust": "c",
            "fontsize": "24",
            "fontcolor": "#1A2530",
            "fontname": "Helvetica-Bold"
        },
        node_attr={
            "shape": "box",
            "style": "filled,rounded",
            "fontname": "Helvetica",
            "fontsize": "12",
            "height": "0.5",
            "penwidth": "1.5"
        },
        edge_attr={
            "color": "#4A5568",
            "penwidth": "1.5",
            "arrowsize": "0.8"
        }
    )

    # Presentation Layer (Blue)
    with dot.subgraph(name="cluster_presentation") as c:
        c.attr(
            label="Presentation Layer",
            style="filled,rounded",
            color="#A0AEC0",
            fillcolor="#E2E8F0",
            fontcolor="#2D3748",
            fontname="Helvetica-Bold",
            margin="15"
        )
        c.node("frontend", "Next.js Frontend\n(page.js)", fillcolor="#EDF2F7", color="#4A5568")
        c.node("dashboard", "Dashboard Canvas\n(Cards, Charts)", fillcolor="#EDF2F7", color="#4A5568")
        c.node("chat_ui", "RAG Agent Chat\n(Right Sidebar)", fillcolor="#EDF2F7", color="#4A5568")
        
        c.edge("frontend", "dashboard", style="invis")
        c.edge("dashboard", "chat_ui", style="invis")

    # Application / API Layer (Yellow)
    with dot.subgraph(name="cluster_api") as c:
        c.attr(
            label="Application / API Layer",
            style="filled,rounded",
            color="#D69E2E",
            fillcolor="#FEFCBF",
            fontcolor="#744210",
            fontname="Helvetica-Bold",
            margin="15"
        )
        c.node("fastapi", "FastAPI Router\n(router.py)", fillcolor="#4299E1", fontcolor="white", color="#2B6CB0")
        c.node("preprocessor", "Context Preprocessor\n(context_preprocessor.py)", fillcolor="#4299E1", fontcolor="white", color="#2B6CB0")
        c.node("orchestrator", "Orchestrator Service\n(orchestrator.py)", fillcolor="#4299E1", fontcolor="white", color="#2B6CB0")
        c.node("task_queue", "Task Queue\n(tasks.py)", fillcolor="#4299E1", fontcolor="white", color="#2B6CB0")
        c.node("scraper_bridge", "ScraperBridge\n(scraper_bridge.py)", fillcolor="#4299E1", fontcolor="white", color="#2B6CB0")

        c.edge("fastapi", "preprocessor")
        c.edge("preprocessor", "task_queue")
        c.edge("task_queue", "orchestrator")
        c.edge("orchestrator", "scraper_bridge")

    # AI Processing Layer (Red)
    with dot.subgraph(name="cluster_ai") as c:
        c.attr(
            label="AI Processing Layer",
            style="filled,rounded",
            color="#E53E3E",
            fillcolor="#FED7D7",
            fontcolor="#742A2A",
            fontname="Helvetica-Bold",
            margin="15"
        )
        c.node("intel_engine", "StrategicAIEngine\n(intelligence.py)", fillcolor="#E53E3E", fontcolor="white", color="#9B2C2C")
        c.node("heuristic", "Heuristic Sentiment Analyzer\n(heuristic_sentiment.py)", fillcolor="#E53E3E", fontcolor="white", color="#9B2C2C")
        c.node("impact_agent", "Impact Agent\n(impact_agent.py)", fillcolor="#E53E3E", fontcolor="white", color="#9B2C2C")
        c.node("rag_chat", "RAG Chat Module\n(chat_rag.py)", fillcolor="#E53E3E", fontcolor="white", color="#9B2C2C")

        c.edge("intel_engine", "heuristic", style="invis")
        c.edge("heuristic", "impact_agent", style="invis")
        c.edge("impact_agent", "rag_chat", style="invis")

    # Data / Storage Layer (Blue/Purple)
    with dot.subgraph(name="cluster_data") as c:
        c.attr(
            label="Data / Storage Layer",
            style="filled,rounded",
            color="#6B46C1",
            fillcolor="#E9D8FD",
            fontcolor="#44337A",
            fontname="Helvetica-Bold",
            margin="15"
        )
        # Using cylinder shapes for DBs
        c.node("cache", "SQLite Cache\n(cache.py)", shape="cylinder", fillcolor="#48BB78", fontcolor="white", color="#2F855A")
        c.node("vector_store", "ChromaDB \n(vector_store.py)", shape="cylinder", fillcolor="#3182CE", fontcolor="white", color="#2B6CB0")
        c.node("pydantic", "Pydantic Models\n(Data Validation)", fillcolor="#ED8936", fontcolor="white", color="#C05621")

        c.edge("cache", "vector_store", style="invis")
        c.edge("vector_store", "pydantic", style="invis")

    # External Services (Green)
    with dot.subgraph(name="cluster_ext") as c:
        c.attr(
            label="External Services",
            style="filled,rounded",
            color="#38A169",
            fillcolor="#C6F6D5",
            fontcolor="#22543D",
            fontname="Helvetica-Bold",
            margin="15"
        )
        c.node("ddgs", "Web Scrapers\n(Google News, CNBC)", fillcolor="#EDF2F7", color="#4A5568")
        c.node("groq", "LLM Providers\n(Groq Llama-3)", fillcolor="#EDF2F7", color="#4A5568")
        c.node("hf", "Embedding Service\n(HuggingFace MiniLM)", fillcolor="#EDF2F7", color="#4A5568")

        c.edge("ddgs", "groq", style="invis")
        c.edge("groq", "hf", style="invis")

    # ── CROSS-LAYER CONNECTIONS ──

    # UI to API
    dot.edge("frontend", "fastapi", dir="both", label=" /analyze/async")
    dot.edge("chat_ui", "fastapi", dir="both", label=" /chat")
    dot.edge("frontend", "task_queue", dir="both", label=" Polling")

    # Orchestrator to AI
    dot.edge("orchestrator", "intel_engine", dir="both")
    dot.edge("orchestrator", "impact_agent", dir="both")
    dot.edge("orchestrator", "heuristic", dir="both")
    dot.edge("fastapi", "rag_chat", dir="both")

    # AI to External
    dot.edge("intel_engine", "groq", dir="both")
    dot.edge("impact_agent", "groq", dir="both")
    dot.edge("rag_chat", "groq", dir="both")
    dot.edge("vector_store", "hf", dir="both")
    dot.edge("scraper_bridge", "ddgs", dir="both")

    # Everything to Data
    dot.edge("scraper_bridge", "cache", dir="both")
    dot.edge("orchestrator", "cache", dir="both")
    dot.edge("orchestrator", "vector_store", dir="both")
    dot.edge("rag_chat", "vector_store", dir="both")
    dot.edge("fastapi", "pydantic", dir="both")

    # Save and render
    output_path = r"C:\Users\SAGAR\Work_area\Self_Projects\IOMP\nexus\system_architecture_diagram"
    dot.render(output_path, cleanup=True)
    print(f"Diagram saved to {output_path}.png")


if __name__ == "__main__":
    create_architecture_diagram()
