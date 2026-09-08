# Repository and production rules

- `main` is the only authoritative integration branch and the GitHub default branch.
- Base new work on current remote `main`; target every pull request at `main`. Temporary `codex/*` branches are for review and Preview only, never a competing source of truth.
- Vercel Production must track `main` with automatic production-domain assignment enabled. Do not promote a feature-branch preview, change the production branch, or deploy a non-main commit to Production.
- Work in the cloud through GitHub, CI and Vercel. Do not start local development servers or move development back to a local checkout unless the user changes that instruction.
- Review the current diff and required checks before merging. After delivery, verify the stable production URL serves a READY deployment whose Git SHA equals current GitHub `main`. Report merge and live verification separately.
- `Jakeminator123/content-online-platform` owns Content Online staff administration, guarded APIs, the persistent customer/publisher registry and the shared multi-tenant customer-portal runtime. It deploys to Vercel `content-online-platform`.
- Never create a repository, branch deployment or Vercel project per customer. A customer site is a tenant configuration plus a published hostname on the shared runtime.
- `Jakeminator123/content-online-kundplatform-frontend` is a migration source only. Do not delete or change it until the replacement is merged, production-verified, accepted and recoverable.
- Customer publication creates a branded portal shell and URL. It does not provision real customer identity, publisher access or live statistics. KTH remains an explicitly synthetic pilot; keep customer and Content Online staff permissions separate.
- D-ID API keys and Vercel automation tokens are server-only secrets. D-ID client keys are browser configuration but must be restricted to the exact customer origin. Never expose customer stats from an unauthenticated route.
