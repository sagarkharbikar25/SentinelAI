import pytest
from pathlib import Path
from sentinel.core.policy_engine import PolicyEngine, PolicyRule, PolicyEffect


@pytest.fixture
def engine():
    eng = PolicyEngine()
    eng.add_rule(
        PolicyRule(
            id="rule-deny-ssh",
            policy_name="Protect Secrets",
            agent_type=None,
            action_type=None,
            path_pattern="~/.ssh/**",
            operation=None,
            effect=PolicyEffect.DENY,
            reason="SSH is protected",
            priority=200,
        )
    )
    eng.add_rule(
        PolicyRule(
            id="rule-warn-git",
            policy_name="Git Protection",
            agent_type=None,
            action_type="SHELL_CMD",
            path_pattern=None,
            operation="GIT_RESET",
            effect=PolicyEffect.REQUIRE_CONFIRMATION,
            reason="Git reset destroys history",
            priority=150,
        )
    )
    return eng


def test_rule_matching_deny(engine):
    decision = engine.evaluate(
        agent_type="MCP",
        action_type="FILE_DELETE",
        path_str="~/.ssh/known_hosts",
        operation="DELETE",
    )
    assert decision.effect == PolicyEffect.DENY
    assert "SSH is protected" in decision.reason


def test_rule_matching_require_confirmation(engine):
    decision = engine.evaluate(
        agent_type="SHELL",
        action_type="SHELL_CMD",
        path_str=None,
        operation="GIT_RESET",
    )
    assert decision.effect == PolicyEffect.REQUIRE_CONFIRMATION


def test_no_rule_match_allows(engine):
    decision = engine.evaluate(
        agent_type="MCP",
        action_type="FILE_READ",
        path_str="~/project/README.md",
        operation="READ",
    )
    assert decision.effect == PolicyEffect.ALLOW
