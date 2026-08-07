import os
import logging
from typing import TypedDict, List
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)

# Define the State for the LangGraph
class AgentState(TypedDict):
    article_summary: str
    event: str
    effect: str
    risk: str
    impact_chain: List[str]

# Initialize LLM
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.environ.get("GROQ_API_KEY"),
    temperature=0.1
)

def extract_event(state: AgentState):
    """Node 1: Extract the core event from the article."""
    prompt = PromptTemplate.from_template(
        "You are a financial analyst. Identify the single core event described in this text. Keep it under 10 words.\n\nText: {summary}\n\nEvent:"
    )
    chain = prompt | llm | StrOutputParser()
    event = chain.invoke({"summary": state["article_summary"]}).strip()
    return {"event": event}

def predict_effect(state: AgentState):
    """Node 2: Predict the immediate secondary business effect."""
    prompt = PromptTemplate.from_template(
        "You are a supply chain and macro analyst. Given this event, predict the immediate secondary business or economic effect. Keep it under 10 words.\n\nEvent: {event}\n\nSecondary Effect:"
    )
    chain = prompt | llm | StrOutputParser()
    effect = chain.invoke({"event": state["event"]}).strip()
    return {"effect": effect}

def assess_risk(state: AgentState):
    """Node 3: Assess the final market risk or opportunity."""
    prompt = PromptTemplate.from_template(
        "You are a hedge fund risk assessor. Given this event and its secondary effect, determine the final market risk or opportunity (e.g., 'Target short position on Tech', 'Inflation risk for Retail'). Keep it under 10 words.\n\nEvent: {event}\nEffect: {effect}\n\nMarket Risk/Opportunity:"
    )
    chain = prompt | llm | StrOutputParser()
    risk = chain.invoke({"event": state["event"], "effect": state["effect"]}).strip()
    
    impact_chain = [state["event"], state["effect"], risk]
    return {"risk": risk, "impact_chain": impact_chain}

# Build the Graph
workflow = StateGraph(AgentState)

workflow.add_node("extract_event", extract_event)
workflow.add_node("predict_effect", predict_effect)
workflow.add_node("assess_risk", assess_risk)

workflow.set_entry_point("extract_event")
workflow.add_edge("extract_event", "predict_effect")
workflow.add_edge("predict_effect", "assess_risk")
workflow.add_edge("assess_risk", END)

# Compile the agent
impact_agent_app = workflow.compile()

async def generate_impact_chain(article_summary: str) -> List[str]:
    """Helper function to run the LangGraph agent for an article."""
    if not os.environ.get("GROQ_API_KEY") or not article_summary:
        return []
        
    try:
        # Run the graph synchronously for simplicity within async wrapper, or use ainvoke if supported natively by chains easily
        # We'll use the compiled graph's ainvoke
        initial_state = {"article_summary": article_summary[:2000]} # Limit context
        result = await impact_agent_app.ainvoke(initial_state)
        return result.get("impact_chain", [])
    except Exception as e:
        logger.error(f"Impact Agent failed: {e}")
        return []
