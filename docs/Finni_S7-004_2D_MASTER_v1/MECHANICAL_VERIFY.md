# Mechanical verify — FINNI-2D-MASTER-V1

Run on 2026-09-21.

- Room, neutral, blink and flattened exports decode as `941×1672`.
- Room is RGB; neutral/blink layers are RGBA.
- Neutral non-zero alpha bounds: left `274`, top `720`, right-exclusive
  `698`, bottom-exclusive `1262`.
- Blink non-zero alpha bounds: left `273`, top `720`, right-exclusive `701`,
  bottom-exclusive `1264`.
- Neutral and blink use the same build anchor and differ only in their source
  expression image.
- OpenRaster contains `mimetype` first and uncompressed, `stack.xml`, merged
  preview, thumbnail and three canvas-sized layer files.
- The clean room and exports contain no financial values, catalog IDs, labels
  or runtime claims.
- `master-inventory.json` is the acceptance inventory with alpha bounds;
  `master-manifest.json` is the initial assembly record retained unchanged.

Visual identity and product acceptance remain owner decisions rather than
mechanical checks.
