# ELF Card Frame Layout Specification

All character card frames use one fixed geometry. Character theme, color, material,
and ornament may change, but no layer may change the canvas or plaque coordinates.

## Canvas

- Size: `1041 x 1511 px`
- Origin: top-left (`0, 0`)
- Color space: sRGB
- Export: PNG at 100%, with no crop, padding, or external black margin
- Horizontal center: `X = 520.5`

## Fixed geometry

| Region | Outer boundary | Text-safe boundary | Center |
| --- | --- | --- | --- |
| Rank plaque | `X220 Y78 W601 H168` | `X275 Y117 W491 H90` | `520.5, 162` |
| Character | `X180 Y280 W681 H930` | Keep ornament outside this area | `520.5, 756` |
| Name plaque | `X120 Y1264 W801 H180` | `X210 Y1310 W621 H88` | `520.5, 1354` |

## Layer order

1. `BASE_BACKGROUND`: full canvas, no text, character, or plaque.
2. `FRAME_ART`: full-canvas border decoration; keep important detail inside 24 px.
3. `RANK_PLAQUE`: fixed to the rank outer boundary.
4. `NAME_PLAQUE`: fixed to the name outer boundary.
5. `CHARACTER_PREVIEW`: anchored at `520.5, 756`; not exported into empty frame assets.
6. `GUIDES`: template lines and labels; hide before production export.

## Rules

- Do not change plaque width for different character names.
- Long names are handled by HTML font sizing, not by image geometry.
- Plaque ornament may extend inside its outer boundary, but never into the text-safe boundary.
- Do not add raster text to production frame images.
- AI-generated artwork must be placed below the locked plaque layers.
- Validate every exported frame by overlaying this template at 50% opacity.
