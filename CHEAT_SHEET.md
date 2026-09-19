# CYBER ESCAPE ROOM: OPERATIVE CHEAT SHEET & WALKTHROUGH

This document provides the complete room layout, item locations, puzzle mechanics, and the exact step-by-step procedure to escape.

---

## 1. Chamber Map & Coordinates (5x5 Grid)

- Grid dimensions: `x = 0..4` (columns, left-to-right), `y = 0..4` (rows, top-to-bottom).
- Walls (Titanium barriers): `(1, 0)`, `(1, 1)`, `(3, 2)`, `(3, 3)`, `(1, 4)`.

```
      x=0           x=1          x=2          x=3          x=4
y=0  [Start]       [WALL]       [Open]       [Open]       [Open]
y=1  [Lantern]     [WALL]       [PUZ_1]      [Hallway]    [Hallway]
y=2  [Open]        [Open]       [Center]     [WALL]       [PUZ_3]
y=3  [PUZ_2]       [Open]       [Open]       [WALL]       [Hallway]
y=4  [Open]        [WALL]       [Open]       [Open]       [EXIT DOOR]
```

### Legend
- **Start**: Coordinate `(0, 0)` — where operatives spawn.
- **Lantern** (`item_lantern`): Located on the ground at `(0, 1)`.
- **PUZ_1 (Main Terminal)**: Coordinate `(2, 1)` (Hex Match). Unblocks northern corridor and grants **WD-40**.
- **PUZ_2 (Security Router)**: Coordinate `(0, 3)` (Memory Matrix). Required to disable the firewall.
- **PUZ_3 (Reactor Core)**: Coordinate `(4, 2)` (Hex Match). Grants the **Exit Key**.
- **Exit Door**: Coordinate `(4, 4)`.

---

## 2. Why the Exit Door Was Blocking You

The exit door at `(4, 4)` enforces three sequential security checks:

1. **Firewall Nodes**: All 3 puzzles (`puz_1`, `puz_2`, `puz_3`) must be solved (`unsolved_count == 0`).
2. **Rusted Hinges**: You must be standing adjacent to `(4, 4)` (e.g. at `(3, 4)` or `(4, 3)`), have **WD-40** equipped in your **HAND**, and click **USE**.
3. **Locked Tumbler**: You must have the **Exit Key** (from `puz_3`) equipped in your **HAND**, stand adjacent to `(4, 4)`, and click **USE**.

> **Note**: Having an item in your **BAG** is not enough to use it. You must click **EQUIP** in the Inventory Panel to move it into your **HAND**, then click **USE**.

---

## 3. Step-by-Step Speedrun Walkthrough

### Step 1: Secure the Lantern
1. Move South from `(0, 0)` to `(0, 1)`.
2. Click **PICK UP** on the Lantern.
3. In the **INVENTORY STATUS** panel, click **TURN ON** on the Lantern.
   - Your vision radius expands from 1 to 2 cells, illuminating nearby walls and corridors.

### Step 2: Disable Firewall Node 2 (PUZ_2)
1. Move South: `(0, 1) -> (0, 2) -> (0, 3)`.
2. Step into `(0, 3)` to trigger the **Security Router** (Memory Matrix).
3. Memorize the 4-tile flash pattern and repeat it on the 3x3 grid.
4. The puzzle is bypassed.

### Step 3: Hack Main Terminal & Obtain WD-40 (PUZ_1)
1. Move East & North to the center: `(0, 3) -> (1, 3) -> (2, 3) -> (2, 2)`.
2. Move North into `(2, 1)` to trigger **Main Terminal** (Hexadecimal Match).
3. Find and click the matching hex code from the 4 options.
4. The terminal bypasses, your operative automatically advances into `(2, 1)`, and **WD-40** is added to your inventory.

### Step 4: Hack Reactor Core & Obtain Exit Key (PUZ_3)
1. From `(2, 1)`, take the northern hallway East: `(2, 1) -> (3, 1) -> (4, 1)`.
2. Move South into `(4, 2)` to trigger **Reactor Core** (Hexadecimal Match).
3. Select the matching hex code.
4. The core is bypassed, your operative advances into `(4, 2)`, and the **Exit Key** is added to your inventory (typically placed in your **BAG** because your hand is holding the Lantern or WD-40).

### Step 5: Unlock the Exit Door
1. Move South down the eastern hallway: `(4, 2) -> (4, 3)`. You are now directly North of the exit door at `(4, 4)`.
2. **Apply WD-40**:
   - In the Inventory panel, ensure **WD-40** is in your **HAND** (if it's in your BAG, click **EQUIP**).
   - Click **USE** on WD-40.
   - Terminal log confirms: *"You sprayed WD-40 on the exit door hinges. The rust dissolved!"*
3. **Turn the Exit Key**:
   - In the Inventory panel, find **Exit Key** in your **STORAGE (BAG)** and click **EQUIP**.
   - Click **USE** on Exit Key.
   - Terminal log confirms: *"You turned the key. The exit door is unlocked!"*

### Step 6: Breach and Escape
1. Move South into `(4, 4)`:
   - Press `ArrowDown` or `S` (or click on `(4, 4)`).
2. The victory screen triggers:
   **"CHAMBER BREACH SUCCESSFUL! Operative escaped in X steps."**

---

## 4. Debug-Aid Cheat Code

For instructors and developers testing the chamber endgame without re-playing all puzzles:

- **Activation Methods**:
  - **Keyboard**: Type `cheat` or `opendoor` anywhere on the game screen.
  - **In-Game Button**: Click the `CHEAT_CODE` button in the header bar.
  - **Admin Panel**: Click `[ADMIN]` in the footer and click `CHEAT` next to any connected operative.
- **Setup Applied**:
  - Operative positioned at `(3, 4)` (immediately adjacent to the exit door at `(4, 4)`).
  - Active **Lantern** deployed on the grid at `(2, 2)` with `activation_level = 3` (illuminating the entire 5x5 chamber).
  - All 3 firewall puzzles solved.
  - **WD-40** equipped in **HAND**.
  - **Exit Key** placed in **STORAGE (BAG)**.
- **Immediate Next Steps**:
  1. Click **USE** on WD-40.
  2. Click **EQUIP** on Exit Key in the Bag.
  3. Click **USE** on Exit Key.
  4. Step East into `(4, 4)` (`ArrowRight` or `D`) to trigger escape!

---

## 5. Lantern Persistence Mechanics

When putting down / dropping the lantern, it remains ON if it was turned on (preserving its `activation_level`). The deployed lantern continues illuminating its surrounding grid radius for all operatives on the local network. Operatives stepping onto the lantern's coordinates can pick it back up with its active state preserved.

