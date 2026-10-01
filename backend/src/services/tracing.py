"""
Langfuse LLM Observability and Tracing for SmartFind.

Supports Langfuse v4 (OpenTelemetry-based):
- Automatic LangChain tracing for Groq LLM queries via CallbackHandler
- Root request observation via @observe_search decorator
- Context manager trace_span for granular non-LLM pipeline steps
- Automatic flush and trace URL generation
"""

import os
import time
from typing import Optional, Any
from contextlib import contextmanager

from dotenv import load_dotenv

# Ensure environment is loaded from backend directory
load_dotenv()

# Synchronize HOST and BASE_URL if one is defined
if not os.getenv("LANGFUSE_HOST") and os.getenv("LANGFUSE_BASE_URL"):
    os.environ["LANGFUSE_HOST"] = os.environ["LANGFUSE_BASE_URL"]
if not os.getenv("LANGFUSE_BASE_URL") and os.getenv("LANGFUSE_HOST"):
    os.environ["LANGFUSE_BASE_URL"] = os.environ["LANGFUSE_HOST"]

_langfuse_client = None


def is_tracing_enabled() -> bool:
    """Check if valid Langfuse credentials are configured."""
    pub = os.getenv("LANGFUSE_PUBLIC_KEY")
    sec = os.getenv("LANGFUSE_SECRET_KEY")
    return bool(pub and sec and pub != "your_langfuse_public_key_here")


def get_langfuse():
    """Returns the singleton Langfuse v4 client, or None if unconfigured."""
    global _langfuse_client
    if not is_tracing_enabled():
        return None
    if _langfuse_client is None:
        try:
            from langfuse import get_client
            _langfuse_client = get_client()
        except Exception as e:
            print(f"[Langfuse] Client initialization warning: {e}")
            return None
    return _langfuse_client


def observe_search(func):
    """
    Decorator for FastAPI endpoint to establish a root Langfuse trace.
    Falls back gracefully to a transparent no-op if Langfuse is not configured.
    """
    if is_tracing_enabled():
        try:
            from langfuse import observe
            return observe(name="smartfind-search")(func)
        except Exception:
            return func
    return func


class SpanWrapper:
    """Safe wrapper for observation spans to support update and end methods gracefully."""
    def __init__(self, span=None):
        self.span = span

    def update(self, **kwargs):
        if self.span:
            try:
                self.span.update(**kwargs)
            except Exception:
                pass

    def end(self, **kwargs):
        if self.span:
            try:
                if kwargs:
                    self.span.update(**kwargs)
            except Exception:
                pass


@contextmanager
def trace_span(name_or_trace: Any, name: Optional[str] = None, input_data: Any = None, as_type: str = "span"):
    """
    Context manager for instrumenting pipeline steps.
    Supports both:
      with trace_span("step-name", {"input": data})
    and legacy syntax:
      with trace_span(trace, "step-name", {"input": data})
    """
    if isinstance(name_or_trace, str):
        span_name = name_or_trace
        span_input = input_data if input_data is not None else name
    else:
        span_name = name or "step"
        span_input = input_data

    client = get_langfuse()
    if client is None:
        yield SpanWrapper(None)
        return

    try:
        with client.start_as_current_observation(name=span_name, as_type=as_type, input=span_input) as span:
            yield SpanWrapper(span)
    except Exception as e:
        yield SpanWrapper(None)


def create_trace(query: str, user_id: str = "anonymous", metadata: dict = None):
    """
    Compatibility helper for root trace context.
    Under @observe_search, root trace is created automatically.
    """
    client = get_langfuse()
    if client is None:
        return None
    return SpanWrapper(None)


def create_langchain_handler(trace=None):
    """
    Creates a LangChain CallbackHandler for automatic Groq LLM tracing.
    Captures prompt AST queries, latencies, tokens, and cost.
    """
    if not is_tracing_enabled():
        return None
    try:
        from langfuse.langchain import CallbackHandler
        return CallbackHandler()
    except Exception as e:
        print(f"[Langfuse] CallbackHandler creation warning: {e}")
        return None


def get_trace_url() -> Optional[str]:
    """Returns the direct web dashboard URL for the current active trace."""
    client = get_langfuse()
    if client:
        try:
            return client.get_trace_url()
        except Exception:
            return None
    return None


def flush_tracing():
    """Flush pending trace events to Langfuse Cloud."""
    client = get_langfuse()
    if client:
        try:
            client.flush()
        except Exception as e:
            print(f"[Langfuse] Flush warning: {e}")
