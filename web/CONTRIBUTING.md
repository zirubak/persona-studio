# Contributing to Persona Studio

First: thanks for even reading this page. Real contributions make this project worth doing.

## Before you start

- Search [Issues](https://github.com/your-org/persona-studio/issues) and [Discussions](https://github.com/your-org/persona-studio/discussions) — someone may already be on it.
- For anything bigger than a typo or a one-line fix, **open an issue first** so we can agree on the shape of the change. This saves you from writing a PR we can't merge.

## Local dev

```bash
pnpm install
pnpm dev
```

The hi-fi prototype lives at `hifi-v2.html`. Open it directly — there's no build step for the prototype layer.

## Pull requests

- One concern per PR. Split refactors from features.
- Keep diffs small. If a PR exceeds ~400 lines, consider splitting it.
- Include a screenshot or short screen recording for any UI change.
- Update the relevant docs in the same PR.
- No new runtime dependencies without discussion.

## Design changes

Design work happens in the `hifi-*` files. When you propose a visual change:

1. Post a before/after screenshot in the PR.
2. If you're adding a new pattern, justify it against the existing design tokens in `hifi-atoms.jsx`.
3. Touch the design tokens themselves only in a dedicated PR.

## Code style

- Follow what's already there. Match the existing vocabulary before inventing new abstractions.
- Comments should explain **why**, not **what**. The code shows what.
- No dead code. No commented-out blocks "for later."

## License

By contributing, you agree that your contributions will be licensed under the [Elastic License 2.0](./LICENSE).

## Code of conduct

Be decent. Assume good intent. Disagree on the thing, not the person. We'll write something more formal when we need to.
