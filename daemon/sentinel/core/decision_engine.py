from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

from sentinel.core.manifest_checker import ManifestChecker, ManifestCheckResult
from sentinel.core.policy_engine import PolicyDecision, PolicyEffect, PolicyEngine
from sentinel.core.risk_scorer import RiskCategory, RiskScore, RiskScorer


class DecisionOutcome(str, Enum):
    ALLOW = "ALLOW"
    PROMPT_USER = "PROMPT_USER"
    BLOCK = "BLOCK"


@dataclass
class Decision:
    outcome: DecisionOutcome
    reason_code: str
    explanation: str
    risk_score: int
    risk_category: RiskCategory
    policy_name: Optional[str] = None
    rule_id: Optional[str] = None


class DecisionEngine:
    """
    Central Decision Brain of SentinelAI.
    Combines agent permission manifests, deterministic file risk scoring,
    and active security policies into a unified ALLOW / PROMPT_USER / BLOCK verdict.
    """

    def __init__(
        self,
        manifest_checker: Optional[ManifestChecker] = None,
        risk_scorer: Optional[RiskScorer] = None,
        policy_engine: Optional[PolicyEngine] = None,
    ):
        self.manifest_checker = manifest_checker or ManifestChecker()
        self.risk_scorer = risk_scorer or RiskScorer()
        self.policy_engine = policy_engine or PolicyEngine()

    def decide(
        self,
        agent_type: str,
        action_type: str,
        target_path: Optional[str],
        operation: str,
        granted_paths: Optional[List[str]] = None,
        is_git_tracked: Optional[bool] = None,
    ) -> Decision:
        # Step 1: Manifest Check
        manifest_res = self.manifest_checker.check(target_path, operation)
        if manifest_res == ManifestCheckResult.OUT_OF_SCOPE:
            return Decision(
                outcome=DecisionOutcome.BLOCK,
                reason_code="MANIFEST_DENY",
                explanation=f"Target path or operation '{operation}' is outside the authorized scope granted in the agent manifest.",
                risk_score=90,
                risk_category=RiskCategory.CRITICAL,
            )

        # Step 2: Policy Engine Evaluation
        policy_decision: PolicyDecision = self.policy_engine.evaluate(
            agent_type=agent_type,
            action_type=action_type,
            path_str=target_path,
            operation=operation,
        )
        if policy_decision.effect == PolicyEffect.DENY:
            return Decision(
                outcome=DecisionOutcome.BLOCK,
                reason_code="POLICY_DENY",
                explanation=f"Security Policy '{policy_decision.policy_name}' denied action: {policy_decision.reason}",
                risk_score=95,
                risk_category=RiskCategory.CRITICAL,
                policy_name=policy_decision.policy_name,
                rule_id=policy_decision.rule_id,
            )

        # Step 3: Deterministic Risk Scoring
        risk: RiskScore = self.risk_scorer.score(
            path_str=target_path,
            operation=operation,
            granted_paths=granted_paths,
            is_git_tracked=is_git_tracked,
        )

        # Step 4: Map Risk Category to Final Outcome
        if policy_decision.effect == PolicyEffect.REQUIRE_CONFIRMATION:
            return Decision(
                outcome=DecisionOutcome.PROMPT_USER,
                reason_code="POLICY_REQUIRES_CONFIRMATION",
                explanation=f"Policy requires manual confirmation: {policy_decision.reason}",
                risk_score=risk.score,
                risk_category=risk.category,
                policy_name=policy_decision.policy_name,
            )

        if risk.category == RiskCategory.CRITICAL or risk.category == RiskCategory.HIGH:
            explanation = self._build_prompt_explanation(operation, target_path, risk)
            return Decision(
                outcome=DecisionOutcome.PROMPT_USER,
                reason_code="HIGH_RISK_ACTION",
                explanation=explanation,
                risk_score=risk.score,
                risk_category=risk.category,
            )

        if risk.category == RiskCategory.MEDIUM:
            if not risk.is_git_tracked:
                explanation = self._build_prompt_explanation(operation, target_path, risk)
                return Decision(
                    outcome=DecisionOutcome.PROMPT_USER,
                    reason_code="MEDIUM_RISK_UNTRACKED",
                    explanation=explanation,
                    risk_score=risk.score,
                    risk_category=risk.category,
                )
            else:
                return Decision(
                    outcome=DecisionOutcome.ALLOW,
                    reason_code="AUTO_ALLOW_TRACKED",
                    explanation=f"Action is git-tracked and in scope ({operation} on {target_path}). Silently approved and logged.",
                    risk_score=risk.score,
                    risk_category=risk.category,
                )

        # Low risk
        return Decision(
            outcome=DecisionOutcome.ALLOW,
            reason_code="AUTO_ALLOW_SAFE",
            explanation=f"Action '{operation}' on '{target_path or 'system'}' evaluated as low risk.",
            risk_score=risk.score,
            risk_category=risk.category,
        )

    def _build_prompt_explanation(self, operation: str, target_path: Optional[str], risk: RiskScore) -> str:
        reasons_text = "; ".join(risk.reasons) if risk.reasons else "Potential destructive impact."
        path_display = target_path or "unspecified target"
        return f"Agent requested {operation} on '{path_display}'. Risk Level: {risk.category.value} ({risk.score}/100). Details: {reasons_text}"
