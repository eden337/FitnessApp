"""Extract the approved food reference sheets into transparent app icons.

Run with the bundled workspace Python runtime (Pillow is required). The source
sheets are intentionally retained so this operation is reproducible.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path
from typing import Iterable

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SHEETS = ROOT / "apps" / "mobile" / "assets" / "food" / "reference-sheets"
OUTPUT = ROOT / "apps" / "mobile" / "assets" / "food" / "catalog"
ICON_SIZE = 256
PADDING = 18

VEGETABLES = [
    "artichoke", "asparagus", "onion", "broccoli", "okra", "carrot",
    "butternut-squash", "pumpkin", "zucchini", "lettuce", "eggplant",
    "cilantro", "white-or-red-cabbage", "cauliflower", "leek", "turnip",
    "hearts-of-palm", "cucumber", "chard", "sprouts", "celery", "tomato",
    "cherry-tomatoes", "parsley", "mushrooms", "bell-pepper", "radish",
    "kohlrabi", "summer-squash", "kale", "green-or-yellow-beans", "fennel",
    "spinach", "baby-corn",
]

FRUITS = [
    "watermelon", "pear", "cherimoya", "fresh-pineapple", "persimmon",
    "peach", "grapefruit", "banana", "guava", "cherries", "quince",
    "fresh-lychee", "melon", "mango", "apricot", "nectarine", "prickly-pear",
    "grapes", "passion-fruit", "papaya", "kiwi", "clementine", "star-fruit",
    "pomegranate", "plum", "loquat", "fresh-fig", "orange", "apple",
    "strawberry", "berries", "dried-fruit",
]

CARBOHYDRATES = [
    "sweet-potato", "potatoes", "beetroot", "rice", "beans", "lentils",
    "peas", "chickpeas", "fresh-fruit", "thick-rolled-oats", "quinoa",
    "buckwheat", "corn", "edamame", "pearl-barley", "skinny-pasta",
]

FATS = [
    "tahini", "butter", "cooking-oil", "olives", "avocado",
    "peanut-butter", "almond-butter", "nuts-almonds", "coconut-products",
]

PROTEINS = [
    "eggs", "fish", "chicken", "meat", "dairy-products", "tofu", "seitan",
]

LIMITED = ["diet-cola", "dry-wine", "beer", "honey"]


def grid_boxes(width: int, height: int, columns: int, rows: int) -> list[tuple[int, int, int, int]]:
    x_edges = [round(index * width / columns) for index in range(columns + 1)]
    y_edges = [round(index * height / rows) for index in range(rows + 1)]
    return [
        (x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1])
        for row in range(rows)
        for column in range(columns)
    ]


def boxes_from_edges(x_edges: list[int], y_edges: list[int]) -> list[tuple[int, int, int, int]]:
    return [
        (x_edges[column], y_edges[row], x_edges[column + 1], y_edges[row + 1])
        for row in range(len(y_edges) - 1)
        for column in range(len(x_edges) - 1)
    ]


def is_background(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, _ = pixel
    return min(red, green, blue) >= 210 and max(red, green, blue) - min(red, green, blue) <= 32


def remove_connected_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    queue: deque[tuple[int, int]] = deque()
    seen: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not is_background(pixels[x, y]):
            continue
        seen.add((x, y))
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = (red, green, blue, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    return rgba


def remove_edge_fragments(image: Image.Image) -> Image.Image:
    """Remove neighboring-cell pieces that enter a crop across one of its edges."""
    pixels = image.load()
    width, height = image.size
    visited: set[tuple[int, int]] = set()

    for start_y in range(height):
        for start_x in range(width):
            if (start_x, start_y) in visited or pixels[start_x, start_y][3] == 0:
                continue
            component: list[tuple[int, int]] = []
            queue = deque([(start_x, start_y)])
            touches_edge = False
            while queue:
                x, y = queue.popleft()
                if (x, y) in visited or pixels[x, y][3] == 0:
                    continue
                visited.add((x, y))
                component.append((x, y))
                touches_edge = touches_edge or x == 0 or y == 0 or x == width - 1 or y == height - 1
                if x > 0:
                    queue.append((x - 1, y))
                if x + 1 < width:
                    queue.append((x + 1, y))
                if y > 0:
                    queue.append((x, y - 1))
                if y + 1 < height:
                    queue.append((x, y + 1))

            if touches_edge or len(component) < 12:
                for x, y in component:
                    red, green, blue, _ = pixels[x, y]
                    pixels[x, y] = (red, green, blue, 0)

    return image


def normalize_icon(image: Image.Image) -> Image.Image:
    transparent = remove_edge_fragments(remove_connected_background(image))
    alpha = transparent.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("No foreground found in icon crop")
    foreground = transparent.crop(bounds)
    available = ICON_SIZE - PADDING * 2
    foreground.thumbnail((available, available), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    offset = ((ICON_SIZE - foreground.width) // 2, (ICON_SIZE - foreground.height) // 2)
    canvas.alpha_composite(foreground, offset)
    return canvas


def extract(source_name: str, keys: Iterable[str], boxes: list[tuple[int, int, int, int]]) -> None:
    source = Image.open(SHEETS / source_name).convert("RGBA")
    key_list = list(keys)
    if len(key_list) != len(boxes):
        raise ValueError(f"{source_name}: {len(key_list)} keys for {len(boxes)} boxes")
    for key, box in zip(key_list, boxes, strict=True):
        normalize_icon(source.crop(box)).save(OUTPUT / f"{key}.png", optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    extract(
        "cleansing-vegetables-text-free.png",
        VEGETABLES[:30],
        boxes_from_edges(
            [0, 219, 421, 625, 830, 1034, 1254],
            [0, 229, 442, 648, 849, 1045],
        ),
    )
    extract(
        "cleansing-vegetables-text-free.png",
        VEGETABLES[30:],
        boxes_from_edges([0, 298, 524, 776, 1034], [1045, 1254]),
    )
    extract(
        "fruits-text-free.png",
        FRUITS[:30],
        boxes_from_edges(
            [0, 217, 418, 624, 831, 1035, 1254],
            [0, 230, 456, 675, 881, 1085],
        ),
    )
    extract(
        "fruits-text-free.png",
        FRUITS[30:],
        boxes_from_edges([0, 310, 624], [1085, 1254]),
    )
    extract(
        "leptin-carbohydrates-text-free.png",
        CARBOHYDRATES,
        grid_boxes(1254, 1254, 4, 4),
    )

    fat_x = [0, 300, 675, 925, 1180, 1536]
    fat_boxes = [
        (fat_x[column], 0, fat_x[column + 1], 470)
        for column in range(5)
    ] + [
        (0, 470, 335, 1024),
        (335, 470, 605, 1024),
        (605, 470, 950, 1024),
        (950, 470, 1536, 1024),
    ]
    extract("fats-text-free.png", FATS, fat_boxes)
    extract(
        "proteins-text-free.png",
        PROTEINS,
        boxes_from_edges([0, 205, 458, 660, 885, 1105, 1320, 1536], [0, 1024]),
    )
    extract("limited-foods-drinks-text-free.png", LIMITED, grid_boxes(1536, 1024, 4, 1))

    generated = sorted(OUTPUT.glob("*.png"))
    if len(generated) != 102:
        raise ValueError(f"Expected 102 icons, generated {len(generated)}")
    print(f"Generated {len(generated)} icons in {OUTPUT}")


if __name__ == "__main__":
    main()
