from sentinel.core.risk_scorer import RiskCategory, RiskScorer

scorer = RiskScorer()


def test_ssh_path_critical_risk():
    risk = scorer.score("~/.ssh/id_rsa", "DELETE", granted_paths=["~/project"])
    assert risk.category == RiskCategory.CRITICAL
    assert risk.score >= 85
    assert any("sensitive" in r.lower() for r in risk.reasons)


def test_env_path_high_or_critical_risk():
    risk = scorer.score("~/project/.env", "DELETE", granted_paths=["~/project"])
    assert risk.category in [RiskCategory.HIGH, RiskCategory.CRITICAL]
    assert risk.score >= 61


def test_safe_read_in_scope_low_risk():
    risk = scorer.score("~/project/src/index.js", "READ", granted_paths=["~/project"], is_git_tracked=True)
    assert risk.category == RiskCategory.LOW
    assert risk.score <= 30


def test_delete_multiplier():
    risk_read = scorer.score("~/project/src/index.js", "READ", granted_paths=["~/project"], is_git_tracked=True)
    risk_delete = scorer.score("~/project/src/index.js", "DELETE", granted_paths=["~/project"], is_git_tracked=True)
    assert risk_delete.score > risk_read.score
