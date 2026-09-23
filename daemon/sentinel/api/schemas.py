from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class InterceptRequest(BaseModel):
    agent_id: str = Field(default="default-agent", description="Identifier of the calling agent")
    agent_type: str = Field(default="SHELL", description="Agent type: MCP | SHELL | SCRIPT | BROWSER")
    session_id: Optional[str] = Field(default=None, description="Active session ID if one is active")
    action_type: str = Field(default="FILE_DELETE", description="Action type: FILE_DELETE, FILE_WRITE, SHELL_CMD")
    target_path: Optional[str] = Field(default=None, description="Absolute or relative path of the file")
    target_url: Optional[str] = Field(default=None, description="Target URL if applicable")
    command: Optional[str] = Field(default=None, description="Raw shell command string")
    operation: Optional[str] = Field(default="DELETE", description="Operation: READ | WRITE | DELETE | EXECUTE")


class InterceptResponse(BaseModel):
    decision: str = Field(description="Decision outcome: ALLOW | PROMPT_USER | BLOCK")
    action_id: str
    reason_code: str
    explanation: str
    risk_score: int
    risk_category: str
    snapshot_taken: bool = False


class UserResponseRequest(BaseModel):
    action_id: str
    user_choice: str = Field(description="User response: ALLOW or BLOCK")
    remember_for_session: bool = Field(default=False)


class UserResponseResult(BaseModel):
    ok: bool
    action_id: str
    final_outcome: str
    message: str


class StartSessionRequest(BaseModel):
    agent_id: str = "claude-code"
    task_description: Optional[str] = "Development task"
    granted_paths: List[str] = Field(default_factory=list)


class StartSessionResponse(BaseModel):
    session_id: str
    agent_id: str
    task_description: Optional[str]
    granted_paths: List[str]
    started_at: str


class EndSessionRequest(BaseModel):
    session_id: str


class ActionLogItem(BaseModel):
    id: str
    session_id: Optional[str]
    agent_id: Optional[str]
    action_type: str
    target_path: Optional[str]
    outcome: str
    risk_score: int
    created_at: str


class DaemonStatusResponse(BaseModel):
    running: bool = True
    version: str = "0.1.0"
    active_session_id: Optional[str] = None
    circuit_breaker_state: str = "CLOSED"
    vault_size_mb: float = 0.0
