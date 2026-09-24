import fnmatch
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import tomllib  # Python 3.11+
except ImportError:
    import tomli as tomllib  # type: ignore


class PolicyEffect(str, Enum):
    DENY = "DENY"
    REQUIRE_CONFIRMATION = "REQUIRE_CONFIRMATION"
    WARN = "WARN"
    ALLOW = "ALLOW"


@dataclass
class PolicyRule:
    id: str
    policy_name: str
    agent_type: Optional[str]
    action_type: Optional[str]
    path_pattern: Optional[str]
    operation: Optional[str]
    effect: PolicyEffect
    reason: str
    priority: int = 100


@dataclass
class PolicyDecision:
    effect: PolicyEffect
    reason: str
    policy_name: Optional[str] = None
    rule_id: Optional[str] = None


class PolicyEngine:
    """
    Evaluates human-readable TOML security policies.
    Rules are evaluated in strict priority order (higher priority evaluated first).
    """

    def __init__(self, policies_dir: Optional[Path] = None):
        self.policies_dir = policies_dir
        self.rules: List[PolicyRule] = []
        if self.policies_dir:
            self.load_policies(self.policies_dir)

    def load_policies(self, directory: Path) -> None:
        """Loads all active policies from TOML files in directory."""
        self.rules.clear()
        resolved_dir = directory.expanduser().resolve()
        if not resolved_dir.exists():
            return

        for toml_path in resolved_dir.glob("*.toml"):
            try:
                with open(toml_path, "rb") as f:
                    data = tomllib.load(f)
                self._parse_policy_dict(data, toml_path.stem)
            except Exception as e:
                # Log or skip corrupted policy
                print(f"Warning: Failed to load policy {toml_path}: {e}")

        # Sort all rules by priority descending
        self.rules.sort(key=lambda r: r.priority, reverse=True)

    def add_rule(self, rule: PolicyRule) -> None:
        self.rules.append(rule)
        self.rules.sort(key=lambda r: r.priority, reverse=True)

    def _parse_policy_dict(self, data: Dict[str, Any], file_stem: str) -> None:
        policy_info = data.get("policy", {})
        policy_name = policy_info.get("name", file_stem)
        is_active = policy_info.get("is_active", True)
        if not is_active:
            return

        raw_rules = data.get("rules", [])
        for idx, r in enumerate(raw_rules):
            effect_str = r.get("effect", "DENY").upper()
            try:
                effect = PolicyEffect(effect_str)
            except ValueError:
                effect = PolicyEffect.DENY

            rule = PolicyRule(
                id=f"{file_stem}-{idx + 1}",
                policy_name=policy_name,
                agent_type=r.get("agent_type") if r.get("agent_type") != "*" else None,
                action_type=r.get("action_type") if r.get("action_type") != "*" else None,
                path_pattern=r.get("path_pattern") if r.get("path_pattern") != "*" else None,
                operation=r.get("operation") if r.get("operation") != "*" else None,
                effect=effect,
                reason=r.get("reason", "Rule violation triggered by policy"),
                priority=int(r.get("priority", 100)),
            )
            self.rules.append(rule)

    def evaluate(
        self,
        agent_type: Optional[str],
        action_type: Optional[str],
        path_str: Optional[str],
        operation: Optional[str],
    ) -> PolicyDecision:
        """
        Evaluates policies against the requested action.
        Returns first matching rule decision or ALLOW.
        """
        norm_path = str(Path(path_str).expanduser().resolve()).replace("\\", "/") if path_str else None

        for rule in self.rules:
            # Check agent_type match
            if rule.agent_type and agent_type and rule.agent_type.upper() != agent_type.upper():
                continue

            # Check action_type match
            if rule.action_type and action_type and rule.action_type.upper() != action_type.upper():
                continue

            # Check operation match
            if rule.operation and operation and rule.operation.upper() != operation.upper():
                continue

            # Check path match
            if rule.path_pattern and norm_path:
                exp_pattern = str(Path(rule.path_pattern).expanduser()).replace("\\", "/")
                matched = False
                if fnmatch.fnmatch(norm_path, exp_pattern) or fnmatch.fnmatch(norm_path, exp_pattern + "/*"):
                    matched = True
                elif exp_pattern.endswith("/**"):
                    base = exp_pattern[:-3]
                    if norm_path == base or norm_path.startswith(base + "/"):
                        matched = True

                if not matched:
                    continue
            elif rule.path_pattern and not norm_path:
                continue

            # Rule matched!
            return PolicyDecision(
                effect=rule.effect,
                reason=rule.reason,
                policy_name=rule.policy_name,
                rule_id=rule.id,
            )

        return PolicyDecision(effect=PolicyEffect.ALLOW, reason="No policy rule blocked this action")


def create_default_policies(policies_dir: Path) -> None:
    """Creates default baseline policy TOML files if not present."""
    policies_dir.mkdir(parents=True, exist_ok=True)

    protect_secrets = policies_dir / "protect-secrets.toml"
    if not protect_secrets.exists():
        protect_secrets.write_text(
            """[policy]
name = "Protect Secrets"
description = "Prevents access to sensitive user credentials and keys"
is_active = true

[[rules]]
agent_type = "*"
action_type = "*"
path_pattern = "~/.ssh/**"
operation = "*"
effect = "DENY"
reason = "SSH private keys and configuration are strictly protected"
priority = 200

[[rules]]
agent_type = "*"
action_type = "*"
path_pattern = "~/.env*"
operation = "*"
effect = "DENY"
reason = "Environment secret files are strictly protected"
priority = 200

[[rules]]
agent_type = "*"
action_type = "*"
path_pattern = "**/.env*"
operation = "DELETE"
effect = "DENY"
reason = "Deletion of .env secret files is strictly prohibited"
priority = 190
""",
            encoding="utf-8",
        )

    system_mod = policies_dir / "no-system-modification.toml"
    if not system_mod.exists():
        system_mod.write_text(
            """[policy]
name = "No System Modification"
description = "Blocks destructive operations on OS system paths"
is_active = true

[[rules]]
agent_type = "*"
action_type = "FILE_DELETE"
path_pattern = "/etc/**"
operation = "*"
effect = "DENY"
reason = "System directory deletion is prohibited"
priority = 250

[[rules]]
agent_type = "*"
action_type = "FILE_DELETE"
path_pattern = "C:/Windows/**"
operation = "*"
effect = "DENY"
reason = "Windows system directory modification is prohibited"
priority = 250
""",
            encoding="utf-8",
        )
