"""
SentinelAI LLM Intent & Warning Explainer
Integrates with local Ollama (e.g., llama3.2:1b, qwen2.5:0.5b, phi3:mini)
to translate silent background agent activities and security warnings into plain English.
Includes deterministic heuristic fallback if Ollama is offline.
"""
from dataclasses import dataclass
import json
import os
from typing import Any, Dict, Optional
import urllib.error
import urllib.request


@dataclass
class IntentExplanation:
    provider: str  # "Ollama (Local LLM)" or "Sentinel Heuristic Brain"
    model_name: str
    silent_activity: str
    security_warning: str
    recommended_action: str
    is_llm_powered: bool


class LLMExplainer:
    """
    Connects to local Ollama daemon on http://127.0.0.1:11434.
    If Ollama is unavailable, seamlessly uses Sentinel's deterministic heuristic engine.
    """

    PREFERRED_MODELS = [
        "deepseek-coder:1.3b-instruct",
        "deepseek-coder:1.3b",
        "qwen2.5-coder:7b",
        "qwen2.5:7b-instruct",
        "llama3.2:1b",
        "qwen2.5:0.5b",
        "phi3:mini",
    ]

    def __init__(self, ollama_url: Optional[str] = None, default_model: str = "deepseek-coder:1.3b-instruct"):
        self.ollama_url = ollama_url or os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
        self.default_model = os.getenv("OLLAMA_MODEL", default_model)

    def check_ollama_available(self) -> Optional[str]:
        """Checks if Ollama is running and returns the best lightweight available model name."""
        try:
            req = urllib.request.Request(f"{self.ollama_url}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = [m.get("name") for m in data.get("models", []) if m.get("name")]
                if not models:
                    return None
                # Match preferred lightweight models in priority order
                for pref in self.PREFERRED_MODELS:
                    for m in models:
                        if pref in m or m.startswith(pref):
                            return m
                return models[0]
        except Exception:
            return None

    def explain_action(
        self,
        agent_id: str,
        action_type: str,
        operation: str,
        target_path: Optional[str],
        risk_score: int,
        command: Optional[str] = None,
    ) -> IntentExplanation:
        """
        Explains what the AI agent is silently doing in the background.
        Tries local Ollama first; if unavailable, uses rule-based heuristic intelligence.
        """
        active_model = self.check_ollama_available()

        if active_model:
            # 1. Try querying local Ollama
            try:
                prompt = (
                    f"You are SentinelAI Security Supervisor. Explain in 2 concise sentences what this AI agent "
                    f"is doing in the background and what warning/risk it poses.\n"
                    f"Agent: {agent_id}\n"
                    f"Operation: {operation} ({action_type})\n"
                    f"Target Path: {target_path or 'system'}\n"
                    f"Command: {command or 'none'}\n"
                    f"Risk Score: {risk_score}/100\n"
                    f"Format: Silent Activity | Risk Warning | Recommended Action"
                )
                payload = json.dumps(
                    {
                        "model": active_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.2, "num_predict": 120},
                    }
                ).encode("utf-8")

                req = urllib.request.Request(
                    f"{self.ollama_url}/api/generate",
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=2.5) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
                    text = result.get("response", "").strip()
                    if text:
                        return IntentExplanation(
                            provider="Ollama (Local LLM)",
                            model_name=active_model,
                            silent_activity=f"Agent '{agent_id}' requested background {operation} on '{target_path or 'system'}'.",
                            security_warning=text,
                            recommended_action="BLOCK" if risk_score >= 80 else "PROMPT_USER" if risk_score >= 40 else "ALLOW",
                            is_llm_powered=True,
                        )
            except Exception:
                pass  # Gracefully fall through to deterministic heuristic engine

        # 2. Heuristic Intent Engine (Fast, Deterministic, 0ms latency)
        return self._heuristic_explanation(agent_id, action_type, operation, target_path, risk_score, command)

    def _heuristic_explanation(
        self,
        agent_id: str,
        action_type: str,
        operation: str,
        target_path: Optional[str],
        risk_score: int,
        command: Optional[str],
    ) -> IntentExplanation:
        path_lower = (target_path or "").lower()
        op_upper = operation.upper()

        if ".env" in path_lower or "credential" in path_lower or "secret" in path_lower:
            activity = f"AI agent '{agent_id}' is attempting to inspect or access environment credentials silently in the background."
            warning = "High danger of API secret exfiltration. Production secrets (AWS, Stripe, Database) could be transmitted to an external service or logged in cleartext."
            action = "BLOCK access immediately unless running in an isolated mock environment."
        elif ".sh" in path_lower or ".bat" in path_lower or op_upper == "EXECUTE":
            activity = f"AI agent '{agent_id}' requested system-level command execution ('{command or target_path}')."
            warning = "Arbitrary shell execution bypasses application boundaries and could download remote payloads or open a reverse shell."
            action = "PROMPT USER or BLOCK unverified binary execution."
        elif "DELETE" in op_upper or "RM" in op_upper:
            activity = f"AI agent '{agent_id}' is trying to delete '{target_path or 'files'}' permanently."
            warning = "Destructive file removal detected. If this is an untracked file or honeypot canary, recovery may be impossible."
            action = "REQUIRE EXPLICIT HUMAN CONFIRMATION before allowing file destruction."
        elif "READ" in op_upper or "INSPECT" in op_upper:
            activity = f"AI agent '{agent_id}' is retrieving contextual file data to generate code or answers."
            warning = "Normal development telemetry. Workspace access is tracked and verified against allowed project scope."
            action = "ALLOW with audit log record."
        else:
            activity = f"AI agent '{agent_id}' initiated background operation '{operation}' on resource '{target_path or 'system'}'."
            warning = f"Evaluated by Sentinel Policy Engine with risk score {risk_score}/100."
            action = "BLOCK" if risk_score >= 80 else "PROMPT" if risk_score >= 40 else "ALLOW"

        return IntentExplanation(
            provider="Sentinel Heuristic Brain (Local Hybrid)",
            model_name="Deterministic Pattern & Manifest Engine",
            silent_activity=activity,
            security_warning=warning,
            recommended_action=action,
            is_llm_powered=False,
        )
