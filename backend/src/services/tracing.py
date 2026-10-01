"""
Langfuse LLM Observability and Tracing for SmartFind.

Provides:
- A singleton Langfuse client (lazy-initialized, zero overhead if keys are missing)
- A LangChain CallbackHandler for automatic Groq LLM tracing
- Decorator-style span helpers for manual instrumentation of non-LLM steps
"""

import os
import time
from typing import Optional, Any
from contextlib import contextmanager

from dotenv import load_dotenv

load_dotenv()

# Lazy singleton — only created if keys are configured
_langfuse_client = None
_tracing_enabled: Optional[bool] = None


def _is_tracing_enabled() -> bool:
    """Check if Langfuse credentials are configured."""
    global _tracing_enabled
    if _tracing_enabled is None:
        _tracing_enabled = bool(
            os.getenv("LANGFUSE_PUBLIC_KEY")
            and os.getenv("LANGFUSE_SECRET_KEY")
            and os.getenv("LANGFUSE_PUBLIC_KEY") != "your_langfuse_public_key_here"
        )
    return _tracing_enabled


def get_langfuse():
    """Returns the singleton Langfuse client, or None if not configured."""
    global _langfuse_client
    if not _is_tracing_enabled():
        return None
    if _langfuse_client is None:
        from langfuse import Langfuse
        _langfuse_client = Langfuse(
            public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
            secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
            host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
        )
    return _langfuse_client


def create_langchain_handler(trace):
    """
    Creates a LangChain CallbackHandler bound to a specific Langfuse trace.
    This automatically captures LLM calls (Groq), token usage, and latencies.
    """
    if trace is None:
        return None
    try:
        from langfuse.callback import CallbackHandler
        return CallbackHandler(
            trace_id=trace.id,
            public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
            secret_key=os.getenv("LANGFUSE_SECRET_KEY"),
            host=os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
        )
    except Exception:
        return None


def create_trace(query: str, user_id: str = "anonymous", metadata: dict = None):
    """
    Creates a new Langfuse trace for a search request.
    Returns None if tracing is not configured (zero overhead).
    """
    langfuse = get_langfuse()
    if langfuse is None:
        return None
    return langfuse.trace(
        name="smartfind-search",
        input={"query": query},
        user_id=user_id,
        metadata=metadata or {},
    )


@contextmanager
def trace_span(trace, name: str, input_data: Any = None):
    """
    Context manager for manually instrumenting a pipeline step.

    Usage:
        with trace_span(trace, "pinecone-vector-search", {"query": q}) as span:
            results = vectorstore.similarity_search(q)
            if span:
                span.end(output={"count": len(results)})
    """
    if trace is None:
        yield None
        return

    span = trace.span(name=name, input=input_data)
    start = time.perf_counter()
    try:
        yield span
    except Exception as e:
        if span:
            span.end(
                output={"error": str(e)},
                level="ERROR",
                status_message=str(e),
            )
        raise
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        # Latency is auto-tracked, but we add it as metadata for quick filtering
        if span and not getattr(span, "_ended", False):
            span.update(metadata={"latency_ms": round(elapsed_ms, 2)})


def flush_tracing():
    """Flush any pending trace events. Call at shutdown."""
    langfuse = get_langfuse()
    if langfuse:
        langfuse.flush()
