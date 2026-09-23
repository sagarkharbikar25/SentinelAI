from sentinel.core.decision_engine import DecisionEngine, DecisionOutcome
from sentinel.core.manifest_checker import ManifestChecker
from sentinel.core.policy_engine import PolicyEngine, PolicyRule, PolicyEffect
from sentinel.core.risk_scorer import RiskScorer


def create_test_decision_engine() -> DecisionEngine:
    manifest = {
        "agent": {"name": "Claude Code", "type": "MCP"},
        "permissions": {
            "allowed_paths": ["~/project/**"],
            "denied_paths": ["~/.ssh/**"],
            "allowed_operations": ["READ", "WRITE", "DELETE"],
            "denied_operations": [],
        },
    }
    manifest_checker = ManifestChecker(manifest)

    policy_engine = PolicyEngine()
    policy_engine.add_rule(
        PolicyRule(
            id="rule-1",
            policy_name="Protect Secrets",
            agent_type=None,
            action_type=None,
            path_pattern="**/.env*",
            operation="DELETE",
            effect=PolicyEffect.DENY,
            reason="Never delete .env",
            priority=200,
        )
    )

    risk_scorer = RiskScorer()
    return DecisionEngine(manifest_checker, risk_scorer, policy_engine)


def test_manifest_out_of_scope_blocks():
    engine = create_test_decision_engine()
    dec = engine.decide(
        agent_type="MCP",
        action_type="FILE_DELETE",
        target_path="~/Documents/thesis.docx",
        operation="DELETE",
        granted_paths=["~/project"],
    )
    assert dec.outcome == DecisionOutcome.BLOCK
    assert dec.reason_code == "MANIFEST_DENY"


def test_policy_deny_blocks():
    engine = create_test_decision_engine()
    dec = engine.decide(
        agent_type="MCP",
        action_type="FILE_DELETE",
        target_path="~/project/.env",
        operation="DELETE",
        granted_paths=["~/project"],
    )
    assert dec.outcome == DecisionOutcome.BLOCK
    assert dec.reason_code == "POLICY_DENY"


def test_untracked_file_delete_prompts_user():
    engine = create_test_decision_engine()
    dec = engine.decide(
        agent_type="MCP",
        action_type="FILE_DELETE",
        target_path="~/project/scratch.py",
        operation="DELETE",
        granted_paths=["~/project"],
        is_git_tracked=False,
    )
    assert dec.outcome == DecisionOutcome.PROMPT_USER


def test_tracked_safe_read_allows():
    engine = create_test_decision_engine()
    dec = engine.decide(
        agent_type="MCP",
        action_type="FILE_READ",
        target_path="~/project/main.py",
        operation="READ",
        granted_paths=["~/project"],
        is_git_tracked=True,
    )
    assert dec.outcome == DecisionOutcome.ALLOW
