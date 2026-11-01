import type { Idea } from './ideas-data';

// Product hypotheses; revenue and differentiation require customer and prior-art validation.
export const IAM_IDEAS: Idea[] = [
  {
    "id": "permission-counterfactual-lab",
    "title": "Permission Counterfactual Lab",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Prove what breaks before removing access.",
    "problem": "IAM teams keep excess permissions because they cannot prove which real business workflows would break after a removal.",
    "solution": "Replay sanitized authorization decisions against proposed policy changes and show the smallest counterexample workflow for each rejected request.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Before-and-after decision replay with policy version pins",
      "Minimal counterexample showing the exact missing entitlement",
      "Business workflow impact mapped to owners",
      "Read-only production connectors and a synthetic replay environment"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Replay sanitized authorization decisions against proposed policy changes and show the smallest counterexample workflow for each rejected request. Validation: Compare false alarms and unsafe removals with a manual access-review baseline. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": true,
    "isHot": true,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "offboarding-race-detector",
    "title": "Offboarding Race Detector",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Find access that outlives the employee.",
    "problem": "Removing an account does not prove downstream sessions, cached roles, delegated tokens, and asynchronous provisioning jobs have stopped granting access.",
    "solution": "Build a time-ordered revocation dependency graph and test which residual access survives each offboarding step without collecting bearer tokens.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Revocation completion proofs from each connected system",
      "Session, group cache, and SCIM event reconciliation",
      "Race-condition reproduction in a disposable tenant",
      "Evidence-only alerts with approved remediation plans"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Build a time-ordered revocation dependency graph and test which residual access survives each offboarding step without collecting bearer tokens. Validation: Measure residual-access detection time using controlled delayed-deprovisioning fixtures. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": true,
    "isHot": true,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "agent-delegation-receipts",
    "title": "Agent Delegation Receipts",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Trace every AI action back to its human authority.",
    "problem": "A business cannot reliably reconstruct which employee authorized an AI agent action after several agents delegate work to one another.",
    "solution": "Attach signed, purpose-limited delegation receipts to each agent hop and deterministically reject any hop that expands the original scope or survives revocation.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Human-to-agent-to-tool delegation lineage",
      "Audience, purpose, expiry, and resource-bound capability checks",
      "Transitive revocation and replay-resistant receipt verification",
      "LLMs explain decisions; a deterministic policy engine authorizes them"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Attach signed, purpose-limited delegation receipts to each agent hop and deterministically reject any hop that expands the original scope or survives revocation. Validation: Test multi-hop scope escalation, replay, and revocation in an agent-tool sandbox. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": true,
    "isHot": true,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "recovery-path-simulator",
    "title": "Recovery Path Simulator",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Rehearse account recovery without weakening login.",
    "problem": "Passkey deployments can leave legitimate employees locked out or introduce helpdesk recovery paths weaker than the original authentication.",
    "solution": "Model each identity recovery route as an evidence graph and run both legitimate-loss and impersonation scenarios to identify the weakest bypass.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Recovery path comparison by role and device loss scenario",
      "Phishing-resistant recovery requirements where supported",
      "Helpdesk dual-control and cooldown simulation",
      "Synthetic identities only; no biometric or credential harvesting"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Model each identity recovery route as an evidence graph and run both legitimate-loss and impersonation scenarios to identify the weakest bypass. Validation: Compare successful legitimate recoveries and impersonation acceptance against the current helpdesk process. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": true,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "temporal-duty-conflict-planner",
    "title": "Temporal Duty Conflict Planner",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Detect toxic access combinations across time.",
    "problem": "Traditional separation-of-duties checks miss privileges held in different systems at overlapping moments or through delegated temporary roles.",
    "solution": "Build interval-based entitlement proofs that expose the shortest time window in which a person could both initiate and approve a sensitive action.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Time-bounded cross-system entitlement joins",
      "Delegated and inherited access-chain evidence",
      "Minimum-change remediation proposals",
      "Human approval and deterministic SoD checks before any policy change"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Build interval-based entitlement proofs that expose the shortest time window in which a person could both initiate and approve a sensitive action. Validation: Seed known toxic combinations with staggered grants and measure detection precision. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": true,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "vendor-trust-escrow",
    "title": "Vendor Trust Escrow",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Vendor access ends when its evidence expires.",
    "problem": "Supplier access often survives contract expiry, missing insurance evidence, or an unverified ownership change.",
    "solution": "Bind temporary vendor access to verifiable contract and sponsor evidence with a grace-state workflow that makes suspension impact visible before approval.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Evidence freshness and named business sponsor tracking",
      "Contract milestone-bound access leases",
      "Impact preview and customer-approved suspension",
      "No access changes based solely on AI document interpretation"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Bind temporary vendor access to verifiable contract and sponsor evidence with a grace-state workflow that makes suspension impact visible before approval. Validation: Pilot against expired-vendor scenarios and track time to revoke without interrupting approved work. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": true,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "policy-evidence-compiler",
    "title": "Policy Evidence Compiler",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Turn an access rule into executable proof obligations.",
    "problem": "Auditors and engineers interpret the same access policy differently, producing controls that look compliant but do not test the intended requirement.",
    "solution": "Translate a policy clause into proposed machine-checkable tests linked to its source evidence, requiring an owner to approve the formal interpretation.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Clause-to-control-to-test traceability",
      "Ambiguity questions before policy activation",
      "Deterministic regression suites for approved controls",
      "Versioned sign-off with no autonomous privilege grants"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Translate a policy clause into proposed machine-checkable tests linked to its source evidence, requiring an owner to approve the formal interpretation. Validation: Have independent reviewers compare compiled tests with intentionally ambiguous policy clauses. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "authorization-drift-diff",
    "title": "Authorization Drift Diff",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "See the access difference hidden behind a role rename.",
    "problem": "A harmless-looking group, attribute, or resource-label edit can change effective access across several identity providers and applications.",
    "solution": "Compute effective-access deltas across identity graphs and attribute policies, then produce a causality trace from each changed decision to the exact input edit.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Before-and-after effective access graph snapshots",
      "Transitive group and attribute provenance",
      "Readable causal traces for each new permission",
      "Read-only connectors and tenant-scoped encrypted snapshots"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Compute effective-access deltas across identity graphs and attribute policies, then produce a causality trace from each changed decision to the exact input edit. Validation: Replay controlled role and attribute mutations and measure unexplained access changes. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "break-glass-rehearsal-room",
    "title": "Break-Glass Rehearsal Room",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Practice emergency access without opening production.",
    "problem": "Emergency accounts are rarely exercised, leaving teams unsure whether a disaster will cause a lockout or uncontrolled permanent access.",
    "solution": "Use a digital twin of emergency access dependencies to rehearse outages and generate a signed, time-bounded recovery checklist for the actual on-call team.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Identity-provider outage and network isolation scenarios",
      "Dual-control, expiry, and rollback verification",
      "Synthetic credentials and disposable rehearsal environments",
      "Production actions remain explicit, separately approved operations"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Use a digital twin of emergency access dependencies to rehearse outages and generate a signed, time-bounded recovery checklist for the actual on-call team. Validation: Run an outage tabletop and compare recovery time, evidence quality, and excess privileges. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "workload-identity-continuity",
    "title": "Workload Identity Continuity Map",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Keep machine identity intact through deployment changes.",
    "problem": "Teams cannot tell whether a workload identity changed legitimately during a deployment or was rebound to an unexpected process or service.",
    "solution": "Compare attested workload identity lineage across releases and flag changes that violate an approved continuity contract rather than trusting service names.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SPIFFE / SPIRE"
    ],
    "features": [
      "SPIFFE identity and selector lineage across releases",
      "Approved identity transition contracts",
      "Unexpected owner, namespace, and audience changes",
      "Metadata-only attestation evidence with no private-key collection"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Compare attested workload identity lineage across releases and flag changes that violate an approved continuity contract rather than trusting service names. Validation: Test legitimate migrations and injected selector changes against a deployment fixture set. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "merger-identity-lineage",
    "title": "Merger Identity Lineage Map",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Merge directories without merging the wrong people.",
    "problem": "During acquisitions, matching accounts by email or name can merge unrelated people or silently combine incompatible privileges.",
    "solution": "Produce evidence-backed identity-match hypotheses and simulate the access consequences of each merge before a human accepts any directory mapping.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Conflicting identity evidence surfaced explicitly",
      "No silent account linking from fuzzy name matches",
      "Effective-access impact previews for candidate merges",
      "Tenant isolation and reversible approved mapping exports"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Produce evidence-backed identity-match hypotheses and simulate the access consequences of each merge before a human accepts any directory mapping. Validation: Evaluate on synthetic duplicate names, renamed users, and recycled email addresses. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "consent-expiry-reconciler",
    "title": "Consent Expiry Reconciler",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Prove access follows the user’s current consent.",
    "problem": "Application consent, identity-provider grants, and downstream data-processing permissions drift apart after revocations or purpose changes.",
    "solution": "Reconcile the complete consent-to-access chain and identify which processing routes still function after their permitted purpose or consent expires.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Purpose and audience mapped to active grants",
      "Revocation evidence from downstream processors",
      "Stale-consent workflow simulation",
      "No inferred consent and no autonomous grant expansion"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Reconcile the complete consent-to-access chain and identify which processing routes still function after their permitted purpose or consent expires. Validation: Use controlled consent revocations to measure which stale processing paths remain detectable. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "token-budget-governor",
    "title": "Token Budget Governor",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Give each automation a measurable privilege budget.",
    "problem": "Long-running automations accumulate privileges and delegation chains without a clear bound on the scope of work their credentials can authorize.",
    "solution": "Express an automation’s authority as resource, action, time, and delegation budgets, then verify every requested token against that approved contract.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Resource/action/time/delegation budget accounting",
      "Per-task least-privilege issuance plans",
      "Deterministic denial reasons and owner-approved renewals",
      "Use standard token binding and short-lived credentials where supported"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Express an automation’s authority as resource, action, time, and delegation budgets, then verify every requested token against that approved contract. Validation: Test budget exhaustion, delegation fan-out, and retries against representative job traces. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "policy-intent-contracts",
    "title": "Policy Intent Contracts",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Stop policy refactors from changing business intent.",
    "problem": "A policy rewrite may pass syntax validation while silently changing who can approve payments, access patient records, or modify production.",
    "solution": "Turn owner-approved example decisions into signed intent contracts and check every new policy revision for both forbidden grants and required access loss.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Must-allow and must-deny example contracts",
      "Policy regression tests attached to pull requests",
      "Counterexamples linked to the approving business owner",
      "AI suggests examples; verified engines evaluate policies"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Turn owner-approved example decisions into signed intent contracts and check every new policy revision for both forbidden grants and required access loss. Validation: Compare detection of intentionally introduced semantic policy regressions with syntax-only review. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "federated-logout-proof",
    "title": "Federated Logout Proof",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Distinguish signed out from access actually revoked.",
    "problem": "A logout screen can succeed while a relying-party session, refresh grant, or downstream API session continues to authorize work.",
    "solution": "Construct a standards-aware logout evidence timeline and test residual authorization through consented, non-destructive probes in a controlled tenant.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Identity-provider and relying-party logout event correlation",
      "Refresh-grant and downstream session evidence",
      "Unsupported logout paths reported explicitly",
      "No bearer-token scraping or production session takeover"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Construct a standards-aware logout evidence timeline and test residual authorization through consented, non-destructive probes in a controlled tenant. Validation: Measure surviving sessions after scripted logout and revocation scenarios. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "recovery-quarantine-workspace",
    "title": "Recovery Quarantine Workspace",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Restore productivity while identity recovery is reviewed.",
    "problem": "An employee recovering an account is often either fully blocked or restored to broad access before the recovery evidence is independently checked.",
    "solution": "Propose a temporary, read-limited work envelope tied to an approved recovery case, with automatic expiry and a deterministic promotion checklist.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Recovery case-bound, expiring access envelopes",
      "Sensitive write actions denied until independent verification",
      "Named approver and explicit promotion evidence",
      "No fallback to weaker authentication or automatic elevation"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Propose a temporary, read-limited work envelope tied to an approved recovery case, with automatic expiry and a deterministic promotion checklist. Validation: Compare recovery downtime and exposure during staged incomplete-evidence cases. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "purpose-bound-data-access",
    "title": "Purpose-Bound Data Access",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Keep an approved purpose attached to each data access.",
    "problem": "A role can remain valid even after an employee’s approved reason for reading a sensitive dataset has ended.",
    "solution": "Join purpose attestations, case assignments, and policy decisions to produce an access receipt explaining both permission and the still-valid business purpose.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Case-bound purpose expiry checks",
      "Role and purpose evidence evaluated independently",
      "Minimal-data receipts with pseudonymous subject identifiers",
      "Human-approved purpose mappings and deterministic enforcement"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Join purpose attestations, case assignments, and policy decisions to produce an access receipt explaining both permission and the still-valid business purpose. Validation: Test closed cases and reassigned staff for unauthorized residual access. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "orphan-principal-canary",
    "title": "Orphan Principal Canary",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Find identities whose responsible owner has disappeared.",
    "problem": "Service accounts can remain active after their creator, business owner, and dependent workloads have changed, making nobody accountable for their access.",
    "solution": "Correlate non-human identity lineage with code owners and runtime evidence, then simulate harmless canary denials before proposing a suspension.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Ownership evidence from repositories and deployment metadata",
      "Confidence gaps presented rather than guessed owners",
      "Dry-run canary decisions and dependency impact reports",
      "Suspension requires a named approver and rollback plan"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Correlate non-human identity lineage with code owners and runtime evidence, then simulate harmless canary denials before proposing a suspension. Validation: Plant ownerless service identities in a lab and compare safe detection with inactivity-only rules. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "contractor-attribute-provenance",
    "title": "Contractor Attribute Provenance",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Know which evidence made a contractor privileged.",
    "problem": "A stale HR attribute or vendor-provided job title can grant contractor access far beyond the sponsor’s intended scope.",
    "solution": "Trace every effective contractor permission to its source attribute, freshness, verification authority, and sponsor-approved business context.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Attribute-to-permission lineage with evidence timestamps",
      "Untrusted external attributes flagged before policy use",
      "Sponsor challenge and correction workflow",
      "No automatic trust upgrades from model-generated classifications"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Trace every effective contractor permission to its source attribute, freshness, verification authority, and sponsor-approved business context. Validation: Inject stale and conflicting attributes to measure unjustified grants caught before activation. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  },
  {
    "id": "access-review-causal-replay",
    "title": "Access Review Causal Replay",
    "category": "Identity & Access Management",
    "emoji": "🔐",
    "tagline": "Review the reason access exists, not another giant checklist.",
    "problem": "Managers rubber-stamp access reviews because flat entitlement lists omit the operational reason each permission was granted and still remains necessary.",
    "solution": "Reconstruct a minimal causal story for each grant from approved tickets, policy revisions, and task evidence, distinguishing verified facts from missing evidence.",
    "revenueModel": "Pricing hypothesis: $299–$1,499/month per organization, validated through a paid pilot.",
    "revenuePotential": "Unvalidated; estimate from customer interviews and paid-pilot conversion.",
    "difficulty": "Hard",
    "timeToMVP": "8–12 weeks for one identity-provider integration and a controlled pilot",
    "techStack": [
      "TypeScript",
      "PostgreSQL",
      "OpenID Connect / OAuth",
      "OPA or Cedar",
      "SCIM where supported"
    ],
    "features": [
      "Grant-to-ticket-to-workflow evidence chains",
      "Unverifiable reasons shown as unresolved questions",
      "Reviewer-approved keep, reduce, or revoke proposals",
      "Privacy-minimized evidence and no autonomous entitlement mutation"
    ],
    "whyNow": "Identity systems now span people, workloads, vendors, and agents. Novelty hypothesis: Reconstruct a minimal causal story for each grant from approved tickets, policy revisions, and task evidence, distinguishing verified facts from missing evidence. Validation: Measure reviewer accuracy and review time against a blinded conventional entitlement list. Compare this mechanism with existing IGA, PAM, CIEM, ITDR, and workload-identity products before claiming novelty.",
    "isFeatured": false,
    "isHot": false,
    "color": "#06b6d4",
    "gradient": "from-cyan-500/20 to-sky-900/10"
  }
];
