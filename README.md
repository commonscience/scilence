# Scilence

Museum-grade design system for scientific interfaces.

Token-driven. Preference-parameterized. Framework-agnostic primitives with Svelte bindings.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@scilence/tokens` | CSS custom properties + DTCG JSON. The coordinate system. | Planned |
| `@scilence/css` | Compiled utilities: depth, surface, typography, reset | Planned |
| `@scilence/primitives` | Headless interaction primitives (vanilla JS, APG-compliant) | Planned |
| `@scilence/svelte` | Svelte bindings for primitives | Planned |
| `@scilence/datavis` | D3/viz primitives for scientific UI | Planned |
| `@scilence/cli` | Token generation and validation CLI | Planned |
| `@scilence/figma` | Figma export tooling | Planned |

## Principles

- **Fibonacci spacing**: 3, 5, 8, 13, 21, 34, 55px
- **Surfaces, not borders**: containment through ≥4% lightness delta
- **Oklch color space**: greenscale (hue 180°) with teal accents
- **Preference-parameterized**: brandHue, contrastNudge, density → complete token set
- **8 invariants**: Fibonacci proportion, lightness delta, depth limit, font floor, contrast guarantee, proportional contraction, hue coherence, density linearity

## License

MIT
