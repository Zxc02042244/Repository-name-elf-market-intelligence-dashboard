#!/usr/bin/env python3
"""Build and validate fixed-layout ELF desktop card-frame three-piece kits."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

CANVAS_SIZE = (1041, 1511)
RANK_SIZE = (601, 168)
NAME_SIZE = (801, 180)
RANK_POSITION = (220, 78)
NAME_POSITION = (120, 1264)


def fail(message: str) -> None:
    raise ValueError(message)


def open_image(path: Path) -> Image.Image:
    if not path.is_file():
        fail(f"Input file not found: {path}")
    return Image.open(path)


def image_has_alpha(image: Image.Image) -> bool:
    return "A" in image.getbands()


def key_chroma(image: Image.Image, key: str) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    key = key.lower()
    if key not in {"green", "magenta"}:
        fail(f"Unsupported chroma key: {key}")

    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, _ = pixels[x, y]
            if key == "green":
                dominance = green - max(red, blue)
                brightness = green
            else:
                dominance = min(red, blue) - green
                brightness = min(red, blue)

            strength = max(0.0, min(1.0, (dominance - 8) / 75))
            strength *= max(0.0, min(1.0, (brightness - 65) / 145))
            alpha = round((1 - strength) * 255)
            if dominance > 45 and brightness > 135:
                alpha = 0
            pixels[x, y] = (red, green, blue, alpha)
    return image


def crop_transparent_bounds(image: Image.Image, label: str) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        fail(f"{label} has no visible pixels after chroma-key removal")
    return image.crop(bounds)


def pad_to_aspect(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_ratio = size[0] / size[1]
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        canvas_height = round(image.width / target_ratio)
        canvas_size = (image.width, canvas_height)
    else:
        canvas_width = round(image.height * target_ratio)
        canvas_size = (canvas_width, image.height)

    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    offset = ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2)
    canvas.alpha_composite(image, offset)
    return canvas.resize(size, Image.Resampling.LANCZOS)


def prepare_plaque(path: Path, size: tuple[int, int], key: str | None, label: str) -> Image.Image:
    image = open_image(path)
    if key:
        image = key_chroma(image, key)
    elif not image_has_alpha(image):
        fail(f"{label} needs transparency or --{label}-key green/magenta")
    else:
        image = image.convert("RGBA")
    return pad_to_aspect(crop_transparent_bounds(image, label), size)


def prepare_base(path: Path) -> Image.Image:
    image = open_image(path).convert("RGB")
    if image.size != CANVAS_SIZE:
        image = image.resize(CANVAS_SIZE, Image.Resampling.LANCZOS)
    return image


def save_kit(output_dir: Path, skin_id: str, base: Image.Image, rank: Image.Image, name: Image.Image) -> dict[str, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = {
        "base": output_dir / f"{skin_id}-card-frame-base-v1.png",
        "rank": output_dir / f"{skin_id}-rank-plaque-v1.png",
        "name": output_dir / f"{skin_id}-name-plaque-v1.png",
        "preview": output_dir / f"{skin_id}-card-frame-preview-v1.png",
        "manifest": output_dir / f"{skin_id}-kit-v1.json",
    }
    base.save(paths["base"], "PNG")
    rank.save(paths["rank"], "PNG")
    name.save(paths["name"], "PNG")

    preview = base.convert("RGBA")
    preview.alpha_composite(rank, RANK_POSITION)
    preview.alpha_composite(name, NAME_POSITION)
    preview.save(paths["preview"], "PNG")

    manifest = {
        "skinId": skin_id,
        "canvas": {"width": CANVAS_SIZE[0], "height": CANVAS_SIZE[1]},
        "rankPlaque": {"file": paths["rank"].name, "width": RANK_SIZE[0], "height": RANK_SIZE[1], "x": RANK_POSITION[0], "y": RANK_POSITION[1]},
        "namePlaque": {"file": paths["name"].name, "width": NAME_SIZE[0], "height": NAME_SIZE[1], "x": NAME_POSITION[0], "y": NAME_POSITION[1]},
        "baseFrame": paths["base"].name,
        "preview": paths["preview"].name,
    }
    paths["manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return paths


def transparent_corners(image: Image.Image) -> bool:
    alpha = image.getchannel("A")
    corners = [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]
    return all(alpha.getpixel(point) == 0 for point in corners)


def validate_kit(output_dir: Path, skin_id: str) -> dict[str, object]:
    files = {
        "base": output_dir / f"{skin_id}-card-frame-base-v1.png",
        "rank": output_dir / f"{skin_id}-rank-plaque-v1.png",
        "name": output_dir / f"{skin_id}-name-plaque-v1.png",
        "manifest": output_dir / f"{skin_id}-kit-v1.json",
    }
    base = open_image(files["base"])
    rank = open_image(files["rank"])
    name = open_image(files["name"])
    manifest = json.loads(files["manifest"].read_text(encoding="utf-8"))

    errors = []
    if base.size != CANVAS_SIZE:
        errors.append(f"base dimensions are {base.size}, expected {CANVAS_SIZE}")
    if rank.size != RANK_SIZE:
        errors.append(f"rank dimensions are {rank.size}, expected {RANK_SIZE}")
    if name.size != NAME_SIZE:
        errors.append(f"name dimensions are {name.size}, expected {NAME_SIZE}")
    for label, image in (("rank", rank), ("name", name)):
        if not image_has_alpha(image):
            errors.append(f"{label} plaque lacks an alpha channel")
        elif not transparent_corners(image.convert("RGBA")):
            errors.append(f"{label} plaque corners are not transparent")
    if manifest.get("rankPlaque", {}).get("x") != RANK_POSITION[0] or manifest.get("rankPlaque", {}).get("y") != RANK_POSITION[1]:
        errors.append("rank plaque coordinates differ from the fixed layout")
    if manifest.get("namePlaque", {}).get("x") != NAME_POSITION[0] or manifest.get("namePlaque", {}).get("y") != NAME_POSITION[1]:
        errors.append("name plaque coordinates differ from the fixed layout")

    if errors:
        fail("Validation failed:\n- " + "\n- ".join(errors))
    return {
        "skinId": skin_id,
        "status": "passed",
        "base": list(CANVAS_SIZE),
        "rank": {"size": list(RANK_SIZE), "position": list(RANK_POSITION)},
        "name": {"size": list(NAME_SIZE), "position": list(NAME_POSITION)},
    }


def build_command(args: argparse.Namespace) -> None:
    base = prepare_base(Path(args.base))
    rank = prepare_plaque(Path(args.rank), RANK_SIZE, args.rank_key, "rank")
    name = prepare_plaque(Path(args.name), NAME_SIZE, args.name_key, "name")
    output_dir = Path(args.output_dir)
    paths = save_kit(output_dir, args.skin_id, base, rank, name)
    report = validate_kit(output_dir, args.skin_id)
    report["files"] = {key: str(value) for key, value in paths.items()}
    print(json.dumps(report, ensure_ascii=False, indent=2))


def validate_command(args: argparse.Namespace) -> None:
    print(json.dumps(validate_kit(Path(args.output_dir), args.skin_id), ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    build = subparsers.add_parser("build", help="Process source images and validate a three-piece kit")
    build.add_argument("--skin-id", required=True)
    build.add_argument("--base", required=True)
    build.add_argument("--rank", required=True)
    build.add_argument("--name", required=True)
    build.add_argument("--rank-key", choices=("green", "magenta"))
    build.add_argument("--name-key", choices=("green", "magenta"))
    build.add_argument("--output-dir", default="assets/skin-frames")
    build.set_defaults(handler=build_command)

    validate = subparsers.add_parser("validate", help="Validate an existing three-piece kit")
    validate.add_argument("--skin-id", required=True)
    validate.add_argument("--output-dir", default="assets/skin-frames")
    validate.set_defaults(handler=validate_command)

    args = parser.parse_args()
    try:
        args.handler(args)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1) from error


if __name__ == "__main__":
    main()
