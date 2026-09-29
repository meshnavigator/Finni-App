# FINNI-S8-001 layer contract v1

Status: fixed engineering contract for S8-001 and S8-003; artwork acceptance is separate.

The canvas is 941 × 1672 pixels, matching the accepted `FINNI-2D-MASTER-V1`.
Every exported pet layer uses that full RGBA canvas, straight alpha, sRGB, and
the same layer origin. Exports never trim transparent pixels. The room uses
the same canvas. Import order, back to front, is defined in
`src/ui/finni-layer-contract.ts`.

Pet variants use existing `round|pointy|floppy` and `plain|spots|stripes` IDs.
All nine combinations exist at each of stages 1, 2 and 3. Stage 1/2/3 scales
are 0.86/1/1.12 about the shared feet anchor (470, 1272); no domain growth
calculation is performed in the renderer. The face, ears, collar and attachment
anchors are recorded in the TypeScript contract. Expression IDs are
`neutral|blink|happy|thoughtful|inspired`. Blink or expression image swaps must
preserve the body silhouette and all anchors.

The `pet-pattern`, `pet-ear-shape` and `pet-expression` layers may be empty for
an individual state, but layer names and dimensions are stable. Accessory and
room foreground layers may not cover the face or make the pet's feet appear to
float. Missing or corrupt exports use the existing labelled local fallback.

`REF-001` and exact S7-004 hashes are identity references. New artwork must
carry its own source, hash, rights and visual acceptance record before it is
labelled production. This contract alone does not accept new artwork.
