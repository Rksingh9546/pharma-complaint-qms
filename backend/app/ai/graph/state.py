"""Typed state object shared by all LangGraph nodes.

`total=False` — nodes return partial updates; LangGraph merges them into
the state, so each node only writes the keys it owns.
"""
from __future__ import annotations

from typing import Any, Optional, TypedDict


class ComplaintState(TypedDict, total=False):
    raw_text: str                    # input: extracted document / pasted text
    extraction: dict[str, Any]       # set by extract_node
    completeness: dict[str, Any]      # set by validation_node
    risk_assessment: dict[str, Any]            # set by risk_node
    recommendations: dict[str, Any]   # set by recommendation_node
    final: dict[str, Any]            # set by final_node (assembled response)
    error: Optional[str]             # reserved for future conditional routing