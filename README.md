# Scilence

Museum-grade design-system foundations for scientific interfaces.

Scilence provides tokens, framework-agnostic DOM primitives, shared contracts,
and scientific visualization packages. Package status below describes what is
available in this checkout; it is not an npm-publication or product-release
claim.

## Packages

| Package | Description | Checkout status |
| --- | --- | --- |
| [`@scilence/tokens`](packages/tokens/README.md) | CSS custom properties for color, spacing, typography, motion, surfaces, and responsive behavior | Available |
| [`@scilence/primitives`](packages/primitives/README.md) | Vanilla TypeScript/JavaScript atoms and composite DOM primitives | Available; the working tree adds public exports beyond the committed barrel |
| [`@scilence/chrome`](packages/chrome/README.md) | Application-chrome contracts; currently the module-host vocabulary and registry | Available contract; browser routing is consumer-owned |
| [`@scilence/datavis-2d`](packages/datavis-2d/README.md) | Shared heatmap, mosaic, strip, and brush renderers | Available source-JS API |
| [`@scilence/status`](packages/status/README.md) | Typed status-code registry and formatter | Available |
| [`@scilence/orbie`](packages/orbie/README.md) | Headless, framework-agnostic AI interaction contract | Available |
| `@scilence/forms`, `@scilence/overlays`, `@scilence/data`, `@scilence/layout`, `@scilence/timeline`, `@scilence/skills`, `@scilence/voice`, `@scilence/datavis-3d` | Reserved family packages with package metadata and empty barrels | Empty scaffolds; candidate scope only |

See the [package/API discovery map](COMPONENT_REGISTRY.md) for the public
runtime values currently exposed by the primitive, chrome, and visualization
barrels. That map is intentionally not a competing component catalog: detailed
variants, props, slots, and token wiring should be derived from source.

## Principles

- **Token-owned spacing**: a density-scaled Fibonacci ladder with named dense-data exceptions; semantic/component roles come first.
- **Calm surfaces**: use the foundation's semantic surfaces and borders, not hand-calculated elevation deltas. Floating-layer elevation belongs to the primitive.
- **Foundation-owned color**: consume semantic tokens; palette and theme definitions (including documented non-OKLCH exceptions) stay in the token package.
- **Visible focus**: the canonical focus-ring recipe is distinct from hover/selection styling; quiet chrome must not hide keyboard access.
- **Preference-parameterized**: brandHue, contrastNudge, density → complete token set
- **8 invariants**: Fibonacci proportion, lightness delta, depth limit, font floor, contrast guarantee, proportional contraction, hue coherence, density linearity

The historical invariants name design concerns, not literal CSS recipes or
proof that every consumer passes them. Current declarations and component
tests are the implementation reference; verify accessibility and responsive
behavior in the consuming host.

## License

Package licenses are declared in each package manifest. The checkout contains
both MIT-licensed and Apache-2.0-licensed packages.
