# Computer Use API — Référence rapide

Source : https://docs.anthropic.com/en/agents-and-tools/tool-use/computer-use-tool

---

## Beta header requis

| Modèle | Header |
|--------|--------|
| Claude Opus 4.6, Sonnet 4.6, Opus 4.5 | `computer-use-2025-11-24` |
| Sonnet 4.5, Haiku 4.5, Opus 4.1, Sonnet 3.7 | `computer-use-2025-01-24` |

---

## Quick start (curl)

```bash
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: computer-use-2025-11-24" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1024,
    "tools": [
      {
        "type": "computer_20251124",
        "name": "computer",
        "display_width_px": 1024,
        "display_height_px": 768,
        "display_number": 1
      },
      { "type": "text_editor_20250728", "name": "str_replace_based_edit_tool" },
      { "type": "bash_20250124", "name": "bash" }
    ],
    "messages": [{ "role": "user", "content": "Save a picture of a cat to my desktop." }]
  }'
```

---

## Agent loop (Python)

```python
from anthropic import Anthropic

async def sampling_loop(*, model, messages, api_key, max_tokens=4096,
                         tool_version, thinking_budget=None, max_iterations=10):
    client = Anthropic(api_key=api_key)
    beta_flag = "computer-use-2025-11-24" if "20251124" in tool_version else "computer-use-2025-01-24"
    text_editor_type = "text_editor_20250728" if "20251124" in tool_version else f"text_editor_{tool_version}"

    tools = [
        {"type": f"computer_{tool_version}", "name": "computer",
         "display_width_px": 1024, "display_height_px": 768},
        {"type": text_editor_type, "name": "str_replace_based_edit_tool"},
        {"type": "bash_20250124", "name": "bash"},
    ]

    iterations = 0
    while True and iterations < max_iterations:
        iterations += 1
        thinking = {"type": "enabled", "budget_tokens": thinking_budget} if thinking_budget else None

        response = client.beta.messages.create(
            model=model, max_tokens=max_tokens, messages=messages,
            tools=tools, betas=[beta_flag],
            **({"thinking": thinking} if thinking else {}),
        )
        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = {"result": "Tool executed successfully"}  # <- implémenter ici
                tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": result})

        if not tool_results:
            return messages

        messages.append({"role": "user", "content": tool_results})
```

---

## Actions disponibles

### Toutes versions
| Action | Description |
|--------|-------------|
| `screenshot` | Capture l'écran |
| `left_click` | Clic à `[x, y]` |
| `type` | Tape du texte |
| `key` | Touche/raccourci (ex: `"ctrl+s"`) |
| `mouse_move` | Déplace le curseur |

### `computer_20250124` (Claude 4 + Sonnet 3.7)
| Action | Description |
|--------|-------------|
| `scroll` | Scroll directionnel avec amount |
| `left_click_drag` | Clic + drag |
| `right_click`, `middle_click` | Autres boutons |
| `double_click`, `triple_click` | Multi-clics |
| `left_mouse_down`, `left_mouse_up` | Contrôle fin |
| `hold_key` | Maintenir une touche (secondes) |
| `wait` | Pause |

### `computer_20251124` (Opus 4.6, Sonnet 4.6, Opus 4.5)
Tout ce qui précède, plus :
| Action | Description |
|--------|-------------|
| `zoom` | Zoom sur région `[x1, y1, x2, y2]` — nécessite `enable_zoom: true` |

---

## Paramètres du tool

| Paramètre | Requis | Description |
|-----------|--------|-------------|
| `type` | Oui | `computer_20251124` ou `computer_20250124` |
| `name` | Oui | `"computer"` |
| `display_width_px` | Oui | Largeur écran en px |
| `display_height_px` | Oui | Hauteur écran en px |
| `display_number` | Non | Numéro display X11 |
| `enable_zoom` | Non | Active `zoom` (20251124 uniquement) |

---

## Gestion du scaling de coordonnées (important sur Mac Retina)

```python
import math

def get_scale_factor(width, height):
    long_edge = max(width, height)
    total_pixels = width * height
    long_edge_scale = 1568 / long_edge
    total_pixels_scale = math.sqrt(1_150_000 / total_pixels)
    return min(1.0, long_edge_scale, total_pixels_scale)

# Capture
scale = get_scale_factor(screen_width, screen_height)
screenshot = capture_and_resize(int(screen_width * scale), int(screen_height * scale))

# Click — remonter dans l'espace écran réel
def execute_click(x, y):
    perform_click(x / scale, y / scale)
```

---

## Modificateurs clavier sur click/scroll

```json
{ "action": "left_click", "coordinate": [500, 300], "text": "shift" }
{ "action": "left_click", "coordinate": [500, 300], "text": "ctrl" }
{ "action": "left_click", "coordinate": [500, 300], "text": "super" }
```

---

## Pricing (contexte)

- Overhead system prompt : **466-499 tokens**
- Par définition de tool computer use : **735 tokens** (Claude 4.x)
- Screenshots : selon Vision pricing
