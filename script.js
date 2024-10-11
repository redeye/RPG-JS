// Elements and Spells
const Elements = {
    FIRE: 'Fire',
    WATER: 'Water',
    EARTH: 'Earth',
    AIR: 'Air',
    LIGHTNING: 'Lightning'
};

const elementIcons = {
    [Elements.FIRE]: '🔥',
    [Elements.WATER]: '💧',
    [Elements.EARTH]: '🌍',
    [Elements.AIR]: '💨',
    [Elements.LIGHTNING]: '⚡'
};

// Status Effect Icons
const statusEffectIcons = {
    burn: '🔥',
    freeze: '❄️',
    stun: '💫',
    shield: '🛡️',
    windShear: '🌪️'
};

// Player class definition
class Player {
    constructor(name) {
        this.name = name;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 10;
        this.defense = 5;
        this.xp = 0;
        this.level = 1;
        this.xpForNextLevel = 100;
        this.position = { x: 3, y: 3 };
        this.inventory = [];
        this.canProgress = false;
        this.spells = [Elements.FIRE, Elements.WATER, Elements.EARTH]; // Starting spells
        this.statusEffects = []; // List of status effects
        this.criticalChance = 0.1; // 10% chance to land a critical hit
        this.baseAttack = this.attack;
        this.baseDefense = this.defense;
    }

    gainXP(action) {
        let xpGain = 0;
        switch (action) {
            case 'enemy':
                xpGain = 50 + this.level * 10;
                updateStatusMessage(`You defeated the enemy and gained ${xpGain} XP!`);
                break;
            case 'key':
            case 'chest':
                xpGain = 10 + this.level * 2;
                updateStatusMessage(`You gained ${xpGain} XP for your discovery!`);
                break;
            case 'map':
                xpGain = 100 + this.level * 20;
                updateStatusMessage(`Congratulations! You cleared the dungeon and gained ${xpGain} XP!`);
                break;
        }
        this.xp += xpGain;
        this.updatePlayerStats();
        if (this.xp >= this.xpForNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level += 1;
        this.attack += 5;
        this.defense += 3;
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.baseAttack = this.attack;
        this.baseDefense = this.defense;
        this.xpForNextLevel = Math.floor(this.xpForNextLevel * 1.5);
        updateStatusMessage(`Level up! You are now level ${this.level}. Your attack and defense have increased!`);
        this.updatePlayerStats();
        this.unlockSpells();
        startEnemyMovement(); // Restart enemy movement interval with new level
    }

    unlockSpells() {
        if (this.level === 2 && !this.spells.includes(Elements.AIR)) {
            this.spells.push(Elements.AIR);
            updateStatusMessage('You have learned the Air spell!');
        }
        if (this.level === 3 && !this.spells.includes(Elements.LIGHTNING)) {
            this.spells.push(Elements.LIGHTNING);
            updateStatusMessage('You have learned the Lightning spell!');
        }
        this.updateSpellbook();
    }

    updateSpellbook() {
        let spellbookDisplay = document.getElementById('spellbook-list');
        spellbookDisplay.textContent = this.spells.join(', ');
    }

    addItem(itemName, displayName = null) {
        const existingItem = this.inventory.find(item => item.name === itemName);
        if (existingItem && this.isStackable(itemName)) {
            existingItem.quantity += 1;
        } else {
            this.inventory.push({ name: itemName, displayName: displayName || itemName, quantity: 1 });
        }
        this.updateInventory();
    }

    isStackable(itemName) {
        // Potions are stackable, keys and scrolls are not
        return itemName.endsWith('Potion');
    }

    hasItem(itemName) {
        return this.inventory.some(item => item.name === itemName);
    }

    removeItem(itemName) {
        const itemIndex = this.inventory.findIndex(item => item.name === itemName);
        if (itemIndex > -1) {
            if (this.isStackable(itemName) && this.inventory[itemIndex].quantity > 1) {
                this.inventory[itemIndex].quantity -= 1;
            } else {
                this.inventory.splice(itemIndex, 1);
            }
            this.updateInventory();
        }
    }

    updateInventory() {
        let inventoryDisplay = document.getElementById('inventory-list');
        let inventoryText = this.inventory.length === 0
            ? 'Empty'
            : this.inventory.map(item => {
                return item.quantity > 1 ? `${item.displayName} x${item.quantity}` : item.displayName;
            }).join(', ');
        inventoryDisplay.textContent = inventoryText;
    }

    updatePlayerStats() {
        document.getElementById('player-health').textContent = this.health;
        document.getElementById('player-attack').textContent = this.attack;
        document.getElementById('player-defense').textContent = this.defense;
        document.getElementById('player-xp').textContent = `${this.xp} / ${this.xpForNextLevel} XP`;
        document.getElementById('player-level').textContent = this.level;
    }

    resetForNewLevel() {
        this.position = { x: 3, y: 3 };
        this.inventory = this.inventory.filter(item => item.name !== 'scroll' && !item.name.startsWith('Key'));
        this.updateInventory();
        this.statusEffects = []; // Clear status effects
    }

    applyStatusEffects() {
        // Reset attack and defense to base values before applying effects
        this.attack = this.baseAttack;
        this.defense = this.baseDefense;

        this.statusEffects = this.statusEffects.filter(effect => effect.duration > 0);
        this.statusEffects.forEach(effect => {
            switch (effect.type) {
                case 'burn':
                    const burnDamage = Math.floor(this.maxHealth * 0.05);
                    this.health -= burnDamage;
                    this.health = Math.max(0, this.health); // Prevent negative health
                    updateBattleLog(`You suffer ${burnDamage} burn damage.`);
                    break;
                case 'freeze':
                    // Skip turn effect handled in battle logic
                    break;
                case 'stun':
                    this.attack *= 0.5; // Reduce attack by 50%
                    updateBattleLog(`Your attack power is reduced due to stun.`);
                    break;
                case 'shield':
                    this.defense *= 1.5; // Increase defense by 50%
                    updateBattleLog(`Your defense is increased due to shield.`);
                    break;
                case 'windShear':
                    this.defense *= 0.75; // Decrease defense by 25%
                    updateBattleLog(`Your defense is decreased due to wind shear.`);
                    break;
            }
            effect.duration -= 1;
        });
    }
}

// Enemy class definition
class Enemy {
    constructor(type, playerLevel) {
        const baseStats = {
            Goblin: { health: 50, attack: 10, defense: 5, movementType: 'random' },
            Orc: { health: 80, attack: 15, defense: 10, movementType: 'chase' },
            Dragon: { health: 150, attack: 25, defense: 20, movementType: 'protect' }
        };

        const enemyTypes = Object.keys(baseStats);
        const chosenType = type || enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        const stats = baseStats[chosenType];

        this.name = this.generateName(chosenType);
        this.type = chosenType;
        this.health = stats.health + playerLevel * 10;
        this.maxHealth = this.health;
        this.attack = stats.attack + playerLevel * 2;
        this.defense = stats.defense + playerLevel * 1.5;
        this.movementType = stats.movementType;
        this.statusEffects = [];
        this.criticalChance = 0.1; // 10% chance for enemy critical hits
        this.baseAttack = this.attack;
        this.baseDefense = this.defense;
    }

    generateName(type) {
        const names = {
            Goblin: ["Gorbash", "Snaggle", "Blarg", "Threk"],
            Orc: ["Gorok", "Mogor", "Urk", "Brug"],
            Dragon: ["Smaug", "Fafnir", "Drako", "Ancalagon"]
        };
        const nameList = names[type];
        return nameList[Math.floor(Math.random() * nameList.length)];
    }

    isAlive() {
        return this.health > 0;
    }

    applyStatusEffects() {
        // Reset attack and defense to base values before applying effects
        this.attack = this.baseAttack;
        this.defense = this.baseDefense;

        this.statusEffects = this.statusEffects.filter(effect => effect.duration > 0);
        this.statusEffects.forEach(effect => {
            switch (effect.type) {
                case 'burn':
                    const burnDamage = Math.floor(this.maxHealth * 0.05);
                    this.health -= burnDamage;
                    this.health = Math.max(0, this.health); // Prevent negative health
                    updateBattleLog(`${this.name} suffers ${burnDamage} burn damage.`);
                    break;
                case 'freeze':
                    // Skip turn effect handled in battle logic
                    break;
                case 'stun':
                    this.attack *= 0.5; // Reduce attack by 50%
                    updateBattleLog(`${this.name}'s attack power is reduced due to stun.`);
                    break;
                case 'shield':
                    this.defense *= 1.5; // Increase defense by 50%
                    updateBattleLog(`${this.name}'s defense is increased due to shield.`);
                    break;
                case 'windShear':
                    this.defense *= 0.75; // Decrease defense by 25%
                    updateBattleLog(`${this.name}'s defense is decreased due to wind shear.`);
                    break;
            }
            effect.duration -= 1;
        });
    }
}

// Item class definition
class Item {
    constructor(name, effect, keyType = null, displayName = null) {
        this.name = name;
        this.displayName = displayName || name;
        this.effect = effect;
        this.keyType = keyType;
        this.used = false;
        this.containsScroll = false;
    }

    useItem(player, map, location) {
        if (this.effect === 'key') {
            const itemName = mythicalKeys[Math.floor(Math.random() * mythicalKeys.length)];
            player.addItem(this.keyType, itemName);
            updateStatusMessage(`You picked up ${itemName}.`);
            player.gainXP('key');
            map.removeObject(location);
        } else if (this.effect === 'chest') {
            if (this.used) {
                updateStatusMessage(`You have already opened ${this.displayName}.`);
            } else if (player.hasItem(this.keyType)) {
                this.used = true;
                map.removeObject(location);

                if (this.containsScroll) {
                    player.addItem('scroll', 'Magical Scroll');
                    updateStatusMessage(`You opened ${this.displayName} and found a magical scroll!`);
                } else {
                    // Random chance to find a potion
                    const foundPotion = this.getRandomPotion();
                    if (foundPotion) {
                        player.addItem(foundPotion.name, foundPotion.displayName);
                        updateStatusMessage(`You opened ${this.displayName} and found a ${foundPotion.displayName}!`);
                    } else {
                        updateStatusMessage(`You opened ${this.displayName}, but it was empty.`);
                    }
                }
                player.gainXP('chest');
            } else {
                updateStatusMessage(`${this.displayName} is locked and requires ${this.keyType}.`);
            }
        } else if (this.effect === 'portal') {
            if (player.hasItem('scroll')) {
                player.canProgress = true;
                updateStatusMessage("You used the scroll to unlock the portal and progress to the next dungeon.");
                player.gainXP('map');
                startNewLevel(player);
            } else {
                updateStatusMessage("You need a magical scroll to open the portal.");
            }
        }
    }

    getRandomPotion() {
        const potions = [
            { name: 'firePotion', displayName: 'Fire Potion' },
            { name: 'waterPotion', displayName: 'Water Potion' },
            { name: 'earthPotion', displayName: 'Earth Potion' },
            { name: 'airPotion', displayName: 'Air Potion' },
            { name: 'lightningPotion', displayName: 'Lightning Potion' },
        ];
        // 50% chance to find a potion
        if (Math.random() < 0.5) {
            return potions[Math.floor(Math.random() * potions.length)];
        }
        return null;
    }
}

// Battle logic and functions
let isInBattle = false;

function startCombat(encounter) {
    isInBattle = true;
    window.currentEnemy = encounter.enemy;
    window.currentEnemyLocation = encounter.location; // Store the enemy's location
    updateStatusMessage(`You have encountered ${window.currentEnemy.name} the ${window.currentEnemy.type}!`);
    showBattleOptions();

    // Clear the battle log at the start of combat
    const battleLogDiv = document.getElementById('battle-log');
    battleLogDiv.innerHTML = '';
}

function showBattleOptions() {
    const battleInterface = document.getElementById('battle-interface');
    battleInterface.style.display = 'block';

    const battleOptionsDiv = document.getElementById('battle-options');
    battleOptionsDiv.innerHTML = '';

    player.spells.forEach(spell => {
        const button = document.createElement('button');
        button.innerHTML = `${elementIcons[spell]} ${spell}`;
        button.onclick = () => performPlayerAttack(spell);
        battleOptionsDiv.appendChild(button);
    });

    // Add Use Potion button
    const usePotionButton = document.createElement('button');
    usePotionButton.innerHTML = 'Use Potion';
    usePotionButton.onclick = () => showPotionOptions();
    battleOptionsDiv.appendChild(usePotionButton);

    document.getElementById('player-name').textContent = player.name;
    document.getElementById('enemy-name').textContent = `${window.currentEnemy.name} (${window.currentEnemy.type})`;

    updateHealthBars();
}

function hideBattleOptions() {
    const battleInterface = document.getElementById('battle-interface');
    battleInterface.style.display = 'none';
}

function updateBattleLog(message) {
    const logDiv = document.getElementById('battle-log');
    const newEntry = document.createElement('p');
    newEntry.textContent = message;
    logDiv.appendChild(newEntry);
    logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll to the bottom
}

// Determine outcome of spell interactions
function determineOutcome(playerChoice, enemyChoice) {
    const winningCombinations = {
        [Elements.FIRE]: [Elements.AIR, Elements.LIGHTNING],
        [Elements.WATER]: [Elements.FIRE, Elements.EARTH],
        [Elements.EARTH]: [Elements.LIGHTNING, Elements.AIR],
        [Elements.AIR]: [Elements.WATER, Elements.EARTH],
        [Elements.LIGHTNING]: [Elements.WATER, Elements.FIRE]
    };

    if (playerChoice === enemyChoice) {
        return 'tie';
    } else if (winningCombinations[playerChoice].includes(enemyChoice)) {
        return 'player';
    } else {
        return 'enemy';
    }
}

function performPlayerAttack(playerChoice) {
    const enemyChoice = enemySelectAttack(window.currentEnemy);

    const enemyFrozen = window.currentEnemy.statusEffects.some(effect => effect.type === 'freeze');
    const playerFrozen = player.statusEffects.some(effect => effect.type === 'freeze');

    if (playerFrozen) {
        updateBattleLog(`You are frozen and cannot act this turn.`);
        animateSpell('player', '❄️');
    }

    if (enemyFrozen) {
        updateBattleLog(`${window.currentEnemy.name} is frozen and cannot act this turn.`);
        animateSpell('enemy', '❄️');
    }

    if (playerFrozen && enemyFrozen) {
        updateBattleLog(`Both you and the enemy are frozen. Nothing happens this turn.`);
        return endTurn();
    }

    if (playerFrozen) {
        // Enemy gets a free attack
        enemyAction(enemyChoice);
    } else if (enemyFrozen) {
        // Player gets a free attack
        playerAction(playerChoice);
    } else {
        // Normal turn
        const outcome = determineOutcome(playerChoice, enemyChoice);

        updateBattleLog(`You cast ${elementIcons[playerChoice]} ${playerChoice}. ${window.currentEnemy.name} casts ${elementIcons[enemyChoice]} ${enemyChoice}.`);

        if (outcome === 'player') {
            playerAction(playerChoice);
        } else if (outcome === 'enemy') {
            enemyAction(enemyChoice);
        } else {
            updateBattleLog(`Both spells are equally matched. It's a tie!`);
            animateSpell('tie', playerChoice);
        }
    }

    endTurn();
}

function playerAction(playerChoice) {
    let damage = calculateDamage(player, window.currentEnemy);
    if (isCriticalHit(player.criticalChance)) {
        damage *= 2;
        updateBattleLog('Critical hit! You deal double damage.');
    }
    window.currentEnemy.health -= damage;
    window.currentEnemy.health = Math.max(0, window.currentEnemy.health);
    updateBattleLog(`Your spell overpowers the enemy! You deal ${damage} damage.`);
    animateSpell('player', playerChoice);
}

function enemyAction(enemyChoice) {
    let damage = calculateDamage(window.currentEnemy, player);
    if (isCriticalHit(window.currentEnemy.criticalChance)) {
        damage *= 2;
        updateBattleLog('Critical hit! The enemy deals double damage.');
    }
    player.health -= damage;
    player.health = Math.max(0, player.health);
    updateBattleLog(`Enemy's spell overpowers yours! You take ${damage} damage.`);
    animateSpell('enemy', enemyChoice);
}

function endTurn() {
    player.applyStatusEffects();
    window.currentEnemy.applyStatusEffects();

    updateHealthBars();
    checkBattleOutcome();

    if (!isInBattle) return;

    // Show battle options again
    showBattleOptions();
}

function checkBattleOutcome() {
    if (window.currentEnemy.health <= 0) {
        updateBattleLog(`You have defeated ${window.currentEnemy.name}!`);
        player.gainXP('enemy');
        map.removeEnemy(window.currentEnemyLocation);
        map.displayMap();
        endCombat();
    } else if (player.health <= 0) {
        updateBattleLog('You have been defeated! Game Over.');
        endCombat();
        gameOver(); // Handle game over
    }
}

function endCombat() {
    isInBattle = false;
    hideBattleOptions();
    updateStatusMessage('Battle concluded. You can continue your adventure.');
}

function gameOver() {
    isInBattle = false;
    clearInterval(enemyMoveTimer); // Stop enemy movements
    document.removeEventListener('keydown', handleKeyDown); // Disable player input
    updateStatusMessage('Game Over. Press F5 to restart.');
    hideBattleOptions();
}

function animateSpell(caster, element) {
    const elementIcon = elementIcons[element] || element;
    const animDiv = document.createElement('div');
    animDiv.classList.add('cast-animation');
    animDiv.textContent = elementIcon;
    animDiv.style.position = 'absolute';
    animDiv.style.fontSize = '50px';
    animDiv.style.zIndex = 1000;

    if (caster === 'player') {
        const playerInfo = document.getElementById('player-info');
        playerInfo.appendChild(animDiv);
    } else if (caster === 'enemy') {
        const enemyInfo = document.getElementById('enemy-info');
        enemyInfo.appendChild(animDiv);
    } else {
        const battleInterface = document.getElementById('battle-interface');
        battleInterface.appendChild(animDiv);
    }

    setTimeout(() => {
        animDiv.remove();
    }, 500);
}

function isCriticalHit(chance) {
    return Math.random() < chance; // Return true if random roll is within critical hit chance
}

function calculateDamage(attacker, defender) {
    let baseDamage = attacker.attack - defender.defense;
    baseDamage = Math.max(5, baseDamage); // Ensure minimum damage
    return Math.floor(baseDamage);
}

function enemySelectAttack(enemy) {
    const attackOptions = [];

    if (enemy.type === 'Dragon') {
        attackOptions.push(Elements.FIRE, Elements.EARTH, Elements.AIR);
    } else if (enemy.type === 'Goblin') {
        attackOptions.push(Elements.EARTH, Elements.WATER);
    } else if (enemy.type === 'Orc') {
        attackOptions.push(Elements.EARTH, Elements.FIRE);
    } else {
        attackOptions.push(Elements.FIRE, Elements.WATER, Elements.EARTH, Elements.AIR, Elements.LIGHTNING);
    }

    const choice = attackOptions[Math.floor(Math.random() * attackOptions.length)];
    return choice;
}

// Potion usage during battle
function showPotionOptions() {
    const battleOptionsDiv = document.getElementById('battle-options');
    battleOptionsDiv.innerHTML = '';

    const potions = player.inventory.filter(item => item.name.endsWith('Potion'));

    if (potions.length === 0) {
        updateBattleLog('You have no potions to use.');
        showBattleOptions();
        return;
    }

    potions.forEach(potion => {
        const button = document.createElement('button');
        button.innerHTML = `${potion.displayName} (${potion.quantity})`;
        button.onclick = () => usePotionInBattle(potion.name);
        battleOptionsDiv.appendChild(button);
    });

    const backButton = document.createElement('button');
    backButton.innerHTML = 'Back';
    backButton.onclick = showBattleOptions;
    battleOptionsDiv.appendChild(backButton);
}

function usePotionInBattle(potionName) {
    // Apply the status effect to the enemy
    const element = getElementFromPotion(potionName);
    applyStatusEffect(window.currentEnemy, element);
    updateBattleLog(`You used a ${element} Potion on ${window.currentEnemy.name}.`);

    // Remove the potion from inventory
    player.removeItem(potionName);

    // Enemy's turn (if not frozen)
    performEnemyTurn();

    endTurn();
}

function getElementFromPotion(potionName) {
    switch (potionName) {
        case 'firePotion':
            return Elements.FIRE;
        case 'waterPotion':
            return Elements.WATER;
        case 'earthPotion':
            return Elements.EARTH;
        case 'airPotion':
            return Elements.AIR;
        case 'lightningPotion':
            return Elements.LIGHTNING;
    }
}

function performEnemyTurn() {
    const enemyFrozen = window.currentEnemy.statusEffects.some(effect => effect.type === 'freeze');

    if (enemyFrozen) {
        updateBattleLog(`${window.currentEnemy.name} is frozen and cannot act this turn.`);
        animateSpell('enemy', '❄️');
    } else {
        const enemyChoice = enemySelectAttack(window.currentEnemy);
        let damage = calculateDamage(window.currentEnemy, player);
        if (isCriticalHit(window.currentEnemy.criticalChance)) {
            damage *= 2;
            updateBattleLog('Critical hit! The enemy deals double damage.');
        }
        player.health -= damage;
        player.health = Math.max(0, player.health);
        updateBattleLog(`${window.currentEnemy.name} attacks and deals ${damage} damage to you.`);
        animateSpell('enemy', enemyChoice);
    }
}

// Status update function
function updateStatusMessage(message) {
    document.getElementById('status-message').textContent = message;
}

// Mythical keys and chests
const mythicalKeys = [
    "The Key of Solomon",
    "The Key of Thoth",
    "The Silver Key of Yggdrasil",
    "The Key of Olympus",
    "The Key of Hades",
    "The Lunar Key of the Moon",
    "The Celestial Key of Orion"
];

const mythicalChests = [
    "Chest of the Pharaohs",
    "Chest of Arcane Wizards",
    "Chest of Forgotten Kings",
    "Chest of the Eternal Flame",
    "Chest of the Naga Queen",
    "Chest of the Ancient Dragons",
    "Chest of the Lost Gods"
];

// Map and dungeon handling
let currentDungeonNumber = 1;

class Map {
    constructor(size, playerLevel) {
        this.size = size;
        this.grid = this.generateMap();
        this.enemies = this.placeEnemies(playerLevel);
        this.objects = this.placeObjects(playerLevel);
    }

    generateMap() {
        let grid = [];
        for (let i = 0; i < this.size; i++) {
            let row = [];
            for (let j = 0; j < this.size; j++) {
                row.push('empty');
            }
            grid.push(row);
        }
        return grid;
    }

    placeEnemies(playerLevel) {
        let enemies = [];
        const possibleEnemies = ['Goblin', 'Orc', 'Dragon'];
        const enemyCount = Math.min(Math.floor(Math.random() * (playerLevel + 2)) + 1, this.size * this.size - 1);

        for (let i = 0; i < enemyCount; i++) {
            let { x, y } = this.findEmptyTile();

            const enemyType = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
            const enemy = new Enemy(enemyType, playerLevel);
            enemies.push({ enemy, location: { x, y } });
            this.grid[x][y] = 'enemy';
        }

        return enemies;
    }

    placeObjects(playerLevel) {
        let objects = [];

        const keyCount = Math.floor(Math.random() * 2) + 1 + Math.floor(playerLevel / 2);
        const chestCount = keyCount;

        const scrollChestIndex = Math.floor(Math.random() * chestCount);

        for (let i = 0; i < keyCount; i++) {
            let { x, y } = this.findEmptyTile();
            const key = new Item(`Key${i + 1}`, 'key', `Key${i + 1}`);
            objects.push({ item: key, location: { x, y } });
            this.grid[x][y] = 'key';
        }

        for (let i = 0; i < chestCount; i++) {
            let { x, y } = this.findEmptyTile();
            const chestName = mythicalChests[Math.floor(Math.random() * mythicalChests.length)];
            const chest = new Item(`Chest${i + 1}`, 'chest', `Key${i + 1}`, chestName);

            if (i === scrollChestIndex) {
                chest.containsScroll = true;
                chest.displayName = 'Scroll Chest';
            } else {
                chest.containsScroll = false;
            }

            objects.push({ item: chest, location: { x, y } });
            this.grid[x][y] = 'chest';
        }

        let portalAdded = false;
        while (!portalAdded) {
            let { x, y } = this.findEmptyTile();
            const portal = new Item('Portal', 'portal');
            objects.push({ item: portal, location: { x, y } });
            this.grid[x][y] = 'portal';
            portalAdded = true;
        }

        let wallCount = Math.floor(Math.random() * 6) + 2;
        for (let i = 0; i < wallCount; i++) {
            let { x, y } = this.findEmptyTile();
            const wall = new Item('Wall', 'wall');
            objects.push({ item: wall, location: { x, y } });
            this.grid[x][y] = 'wall';
        }

        return objects;
    }

    findEmptyTile() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.size);
            y = Math.floor(Math.random() * this.size);
        } while (this.grid[x][y] !== 'empty' || (x === player.position.x && y === player.position.y));
        return { x, y };
    }

    checkTile(player) {
        const tile = this.grid[player.position.x][player.position.y];
        if (tile === 'enemy') {
            return this.enemies.find(e => e.location.x === player.position.x && e.location.y === player.position.y);
        } else if (tile === 'key' || tile === 'chest' || tile === 'portal' || tile === 'wall') {
            return this.objects.find(o => o.location.x === player.position.x && o.location.y === player.position.y);
        }
        return null;
    }

    removeEnemy(enemyLocation) {
        this.grid[enemyLocation.x][enemyLocation.y] = 'empty';
        this.enemies = this.enemies.filter(e => e.location.x !== enemyLocation.x || e.location.y !== enemyLocation.y);
    }

    removeObject(location) {
        this.grid[location.x][location.y] = 'empty';
        this.objects = this.objects.filter(o => o.location.x !== location.x || o.location.y !== location.y);
    }

    moveEnemies() {
        this.enemies.forEach(({ enemy, location }) => {
            if (enemy.movementType === 'random') {
                this.moveEnemyRandomly(enemy, location);
            } else if (enemy.movementType === 'chase') {
                this.moveEnemyTowardsPlayer(enemy, location);
            } else if (enemy.movementType === 'protect') {
                this.moveDragonTowardsKey(enemy, location);
            }
        });
    }

    moveEnemyRandomly(enemy, location) {
        const directions = ['up', 'down', 'left', 'right'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        this.moveEnemy(enemy, location, direction);
    }

    moveEnemyTowardsPlayer(enemy, location) {
        let deltaX = player.position.x - location.x;
        let deltaY = player.position.y - location.y;
        let direction = '';

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'down' : 'up';
        } else {
            direction = deltaY > 0 ? 'right' : 'left';
        }

        this.moveEnemy(enemy, location, direction);
    }

    moveDragonTowardsKey(enemy, location) {
        if (enemy.isGuarding) {
            return;
        }

        const keyLocation = this.findClosestKey(location);
        if (!keyLocation) return;

        let deltaX = keyLocation.x - location.x;
        let deltaY = keyLocation.y - location.y;
        let direction = '';

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'down' : 'up';
        } else {
            direction = deltaY > 0 ? 'right' : 'left';
        }

        this.moveEnemy(enemy, location, direction);

        if (location.x === keyLocation.x && location.y === keyLocation.y) {
            enemy.isGuarding = true;
        }
    }

    findClosestKey(location) {
        const keys = this.objects.filter(obj => obj.item.effect === 'key');
        if (keys.length === 0) return null;

        let closestKey = null;
        let shortestDistance = Infinity;

        keys.forEach(keyObj => {
            const keyLocation = keyObj.location;
            const distance = Math.abs(keyLocation.x - location.x) + Math.abs(keyLocation.y - location.y);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                closestKey = keyLocation;
            }
        });

        return closestKey;
    }

    moveEnemy(enemy, location, direction) {
        const { x, y } = location;
        let newX = x;
        let newY = y;

        if (direction === 'up' && x > 0 && this.grid[x - 1][y] === 'empty') {
            newX = x - 1;
        } else if (direction === 'down' && x < this.size - 1 && this.grid[x + 1][y] === 'empty') {
            newX = x + 1;
        } else if (direction === 'left' && y > 0 && this.grid[x][y - 1] === 'empty') {
            newY = y - 1;
        } else if (direction === 'right' && y < this.size - 1 && this.grid[x][y + 1] === 'empty') {
            newY = y + 1;
        }

        if (newX === player.position.x && newY === player.position.y) {
            if (!isInBattle) {
                startCombat({ enemy, location });
            }
            return;
        }

        if (newX !== x || newY !== y) {
            this.grid[x][y] = 'empty';
            location.x = newX;
            location.y = newY;
            this.grid[location.x][location.y] = 'enemy';
        }
    }

    displayMap() {
        let gameGrid = document.getElementById('game-grid');
        gameGrid.innerHTML = '';

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                let tileDiv = document.createElement('div');
                tileDiv.classList.add('grid-tile');

                if (i === player.position.x && j === player.position.y) {
                    tileDiv.textContent = '🧙';
                } else if (this.grid[i][j] === 'enemy') {
                    const enemy = this.enemies.find(e => e.location.x === i && e.location.y === j).enemy;
                    if (enemy.type === 'Goblin') tileDiv.textContent = '👺';
                    else if (enemy.type === 'Orc') tileDiv.textContent = '🧟‍♂️';
                    else if (enemy.type === 'Dragon') tileDiv.textContent = '🐉';
                } else if (this.grid[i][j] === 'key') {
                    tileDiv.textContent = '🔑';
                } else if (this.grid[i][j] === 'chest') {
                    tileDiv.textContent = '📦';
                } else if (this.grid[i][j] === 'portal') {
                    tileDiv.textContent = '🚪';
                } else if (this.grid[i][j] === 'wall') {
                    tileDiv.textContent = '🧱';
                }

                gameGrid.appendChild(tileDiv);
            }
        }
    }
}

// Initialize the game
let player = new Player('Hero');
player.updateSpellbook();
let map = new Map(7, player.level);
let enemyMoveTimer;

function updateDungeonNumber() {
    document.getElementById('dungeon-number').textContent = `Dungeon: ${currentDungeonNumber}`;
}

map.displayMap();
player.updatePlayerStats();
player.updateInventory(); // Initialize inventory display
updateDungeonNumber();

// Handle player movement
function handleKeyDown(event) {
    if (isInBattle) return;
    if (event.key === 'ArrowUp') {
        move('up');
    } else if (event.key === 'ArrowDown') {
        move('down');
    } else if (event.key === 'ArrowLeft') {
        move('left');
    } else if (event.key === 'ArrowRight') {
        move('right');
    }
}

document.addEventListener('keydown', handleKeyDown);

function move(direction) {
    if (direction === 'up' && player.position.x > 0 && map.grid[player.position.x - 1][player.position.y] !== 'wall') player.position.x -= 1;
    else if (direction === 'down' && player.position.x < map.size - 1 && map.grid[player.position.x + 1][player.position.y] !== 'wall') player.position.x += 1;
    else if (direction === 'left' && player.position.y > 0 && map.grid[player.position.x][player.position.y - 1] !== 'wall') player.position.y -= 1;
    else if (direction === 'right' && player.position.y < map.size - 1 && map.grid[player.position.x][player.position.y + 1] !== 'wall') player.position.y += 1;
    else {
        updateStatusMessage('You cannot move in that direction.');
        return;
    }

    map.displayMap();
    handleTileEncounter();
}

function handleTileEncounter() {
    let encounter = map.checkTile(player);
    if (encounter) {
        if (encounter.enemy) {
            startCombat(encounter);
        } else if (encounter.item) {
            encounter.item.useItem(player, map, player.position);
        }
    }
}

function startNewLevel(player) {
    currentDungeonNumber += 1;
    player.resetForNewLevel();
    map = new Map(7, player.level);
    map.displayMap();
    updateDungeonNumber();
    updateStatusMessage(`Welcome to Dungeon ${currentDungeonNumber}!`);
}
function updateHealthBars() {
    const playerHealthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
    const enemyHealthPercent = Math.max(0, (window.currentEnemy.health / window.currentEnemy.maxHealth) * 100);

    document.getElementById('player-health-fill').style.width = playerHealthPercent + '%';
    document.getElementById('enemy-health-fill').style.width = enemyHealthPercent + '%';

    player.updatePlayerStats(); // Update the player's health display outside battle

    // Update status effect displays
    updateStatusEffectDisplay('player', player.statusEffects);
    updateStatusEffectDisplay('enemy', window.currentEnemy.statusEffects);
}

function updateStatusEffectDisplay(target, effects) {
    const statusDiv = document.getElementById(`${target}-status-effects`);
    statusDiv.innerHTML = ''; // Clear previous effects

    effects.forEach(effect => {
        const effectSpan = document.createElement('span');
        effectSpan.textContent = `${statusEffectIcons[effect.type]}(${effect.duration}) `;
        statusDiv.appendChild(effectSpan);
    });
}
function applyStatusEffect(target, element) {
    switch (element) {
        case Elements.FIRE:
            target.statusEffects.push({ type: 'burn', duration: 3 });
            updateBattleLog(`${target.name} is now burning!`);
            break;
        case Elements.WATER:
            target.statusEffects.push({ type: 'freeze', duration: 1 });
            updateBattleLog(`${target.name} is frozen!`);
            break;
        case Elements.LIGHTNING:
            target.statusEffects.push({ type: 'stun', duration: 2 });
            updateBattleLog(`${target.name} is stunned!`);
            break;
        case Elements.EARTH:
            target.statusEffects.push({ type: 'shield', duration: 3 });
            updateBattleLog(`${target.name} gains a protective shield!`);
            break;
        case Elements.AIR:
            target.statusEffects.push({ type: 'windShear', duration: 2 });
            updateBattleLog(`${target.name}'s defense is reduced by the wind!`);
            break;
    }
}

function startEnemyMovement() {
    clearInterval(enemyMoveTimer);
    let enemyMoveInterval = Math.max(1000 - (player.level * 100), 500);
    enemyMoveTimer = setInterval(() => {
        if (!isInBattle) {
            map.moveEnemies();
            map.displayMap();
        }
    }, enemyMoveInterval);
}

startEnemyMovement();
