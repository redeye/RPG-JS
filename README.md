<<<<<<< HEAD
# RPG-JS
Experiment with client side rogue like RPG
=======
# Simple 2D RPG Game

A simple 2D RPG game built using **HTML**, **CSS**, and **JavaScript**. The game features dungeon crawling, combat with enemies, and progressing through levels as the player gains experience and levels up.

## Features
- Procedurally generated dungeons with dynamic difficulty scaling based on the player’s level.
- Multiple enemy types (Goblin, Orc, Dragon), each with unique stats and behaviors.
- Combat system with a dice-based mechanic for attack and defense.
- Interactive objects such as keys, chests, and portals.
- Experience-based leveling system, where player stats increase as they progress through the game.
- Randomly generated names and descriptions for enemies and objects to add immersion.

## Installation
To run this game locally, follow these steps:

1. **Clone the repository** (or download the files directly):
   ```bash
   git clone https://github.com/redeye/F2P-Sim.git
   ```

2. **Open the game**:
   - Navigate to the folder where you cloned/downloaded the files.
   - Open `index.html` in your browser.

No additional dependencies are required, and the game runs entirely in the browser.

## Gameplay Instructions

1. **Movement**:
   - Use the arrow keys (`↑`, `↓`, `←`, `→`) to move your character around the dungeon.
   - Avoid walls and try to find keys and open chests to progress.

2. **Objectives**:
   - **Keys**: Collect keys (`🔑`) to open chests (`📦`).
   - **Chests**: Some chests contain a magical scroll, which is required to unlock the portal.
   - **Portal**: Find the portal (`🚪`) and use the magical scroll to progress to the next dungeon.

3. **Combat**:
   - When encountering an enemy (`👺` for Goblins, `🧟‍♂️` for Orcs, `🐉` for Dragons), you will enter combat.
   - Roll the dice to attack the enemy and defend yourself.
   - The battle continues until either the enemy or the player is defeated.

4. **Leveling Up**:
   - Defeat enemies, collect items, and complete dungeons to gain experience (`XP`).
   - Upon reaching certain experience thresholds, the player levels up, increasing their attack, defense, and health.

5. **Dungeon Progression**:
   - Once you defeat the enemies and collect the magical scroll, you can use the portal to advance to the next dungeon.
   - Each new dungeon has stronger enemies and more complex challenges.

## Game Components

### Player
- The player starts with a health of 100, attack power of 10, and defense of 5.
- As the player gains XP and levels up, their stats improve.
- The player’s inventory holds keys and scrolls required for progression.

### Enemies
- **Goblins (`👺`)**: Randomly move around the map, weaker than other enemies.
- **Orcs (`🧟‍♂️`)**: Chase the player, dealing more damage than Goblins.
- **Dragons (`🐉`)**: Guard important keys and portals, very powerful but move strategically.

### Items
- **Keys (`🔑`)**: Required to open chests.
- **Chests (`📦`)**: May contain a scroll or a potion or be empty.
- **Portals (`🚪`)**: Used to progress to the next dungeon, unlocked by using a scroll.

## Game Flow
1. Start in a randomly generated dungeon.
2. Explore the dungeon, avoid walls, and find keys to open chests.
3. Battle enemies as you encounter them.
4. Find the scroll to unlock the portal and progress to the next dungeon.
5. Repeat, with increasing difficulty, as the player levels up.


## Contributing
Feel free to submit issues or pull requests to improve the game. Contributions are welcome!

## License
This project is licensed under the MIT License. See the LICENSE file for details.

>>>>>>> b0ef954 (Initialise)
