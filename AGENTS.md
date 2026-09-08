# Repository and production rules

- `main` is the only authoritative integration branch and the GitHub default branch in both Content Online repositories.
- Base new work on current remote `main`; target every pull request at `main`. Temporary `codex/*` branches are for review and Preview only, never a competing source of truth.
- Vercel Production must track `main` with automatic production-domain assignment enabled. Do not promote a feature-branch preview, change the production branch, or deploy a non-main commit to Production.
- Work in the cloud through GitHub, CI and Vercel. Do not start local development servers or move development back to a local checkout unless the user changes that instruction.
- Review the current diff and required checks before merging. After delivery, verify the stable production URL serves a READY deployment whose Git SHA equals current GitHub `main`. Report merge and live verification separately.
- `Jakeminator123/content-online-platform` owns Content Online staff administration, guarded APIs and the persistent customer/publisher registry. It deploys to Vercel `content-online-platform`.
- `Jakeminator123/content-online-kundplatform-frontend` is the shared customer-portal application, deployed to Vercel `fokus`. It is not a disposable KTH-only repository; do not delete it or create a repository/deployment for each customer.
- Customer publication creates registry metadata and a URL in the shared frontend. It does not yet provision real customer accounts or recreate the frontend source code. KTH remains a synthetic pilot; keep customer and Content Online staff permissions separate.
