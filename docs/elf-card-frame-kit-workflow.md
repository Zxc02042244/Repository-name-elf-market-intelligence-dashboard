# ELF three-piece kit workflow

`scripts/process_kit.py` applies the fixed desktop card-frame geometry and stops when a file violates it.

## Build a kit

```powershell
C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe scripts\process_kit.py build `
  --skin-id character-id `
  --base C:\path\to\base.png `
  --rank C:\path\to\rank.png `
  --name C:\path\to\name.png `
  --rank-key green `
  --name-key green
```

Omit a `--*-key` value when the plaque source already has transparency. The command writes three production PNGs, a composite preview, and a manifest to `assets/skin-frames` by default.

## Fixed layout

| Element | Output size | Position on base |
| --- | --- | --- |
| Base frame | 1041 x 1511 | n/a |
| Rank plaque | 601 x 168 | x=220, y=78 |
| Name plaque | 801 x 180 | x=120, y=1264 |

The command validates dimensions, alpha channels, transparent plaque corners, and manifest coordinates. It does not decide whether a character-specific frame looks visually balanced; inspect the composite preview before registering the new skin in the website.
