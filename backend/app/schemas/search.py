from pydantic import BaseModel
from typing import List, Optional


class FieldMatch(BaseModel):
    workspace: str
    layer: str
    field: Optional[str] = None
    values: Optional[List[str]] = None
    cql_filter: Optional[str] = None
    match_type: str


class SearchResponse(BaseModel):
    query: str
    matches: List[FieldMatch]
