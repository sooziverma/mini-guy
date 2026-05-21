// Procedural Pixel Art Generator for Mini Guy: Zombie Run
// Generates textures on offscreen canvases for crisp pixel-art rendering.

const Sprites = {
    // Canvas elements cache
    player: {},
    zombie: {},
    zombieRunner: {},
    zombieTank: {},
    ammo: null,
    heart: {},
    grass: null,
    dirt: null,
    bush: null,
    tree: null,
    cloud: null,
    crate: null,
    spikes: null,
    health: null,
    powerupRapid: null,
    powerupShotgun: null,
    powerupLaser: null,
    powerupInfinite: null,
    powerupExplosive: null,

    // Initialize all sprites
    init() {
        // Shared colors
        const PALETTE = {
            t: 'transparent',
            // Player
            ph: '#563b8c', // Hair (dark purple-brown)
            ps: '#ffc3a0', // Skin (peach)
            pc: '#f7768e', // Shirt (salmon red)
            po: '#3d59a1', // Overalls (blue)
            pd: '#2a2f41', // Shoes / Dark outlines
            pg: '#9ece6a', // Gun (bright neon green accent)
            pw: '#ffffff', // White (eyes/shine)
            // Zombie
            zh: '#24283b', // Hair (dark)
            zs: '#73daca', // Skin (zombie light green)
            zc: '#bb9af7', // Shirt (tattered light purple)
            zo: '#ff757f', // Pants (tattered red/pink)
            ze: '#ff007f', // Red eyes
            // Items
            ab: '#565f89', // Ammo box grey-blue
            ay: '#e0af68', // Ammo stripe gold
            // Environment
            g1: '#73daca', // Grass top green
            g2: '#41a6b5', // Grass shadow teal
            d1: '#563b8c', // Dirt dark brown-purple
            d2: '#2a2f41', // Dirt deep shadow
            f1: '#9ece6a', // Foliage bright green
            f2: '#73daca', // Foliage medium
            f3: '#41a6b5', // Foliage shadow
            tr: '#9d7cd8', // Trunk purple-wood
            ts: '#563b8c', // Trunk shadow
            cl: '#c0caf5', // Cloud body
            cs: '#a9b1d6', // Cloud shadow
            
            // Custom obstacle/pickup colors
            // Crate wood colors
            cr1: '#5c3523',
            cr2: '#8c563b',
            cr3: '#b97a57',
            // Spikes steel
            sp1: '#2a2f41',
            sp2: '#414868',
            sp3: '#a9b1d6',
            sp4: '#c0caf5',
            // Health
            hr1: '#f7768e',
            // Powerups (glow, icon, bg)
            p_rg: '#ff9e3b', p_ri: '#ffe066', p_rb: '#3d59a1', // Rapid
            p_sg: '#ff5555', p_si: '#ffffff', p_sb: '#563b8c', // Shotgun
            p_lg: '#73daca', p_li: '#7aa2f7', p_lb: '#24283b', // Laser
            p_ig: '#bb9af7', p_ii: '#ffffff', p_ib: '#414868', // Infinite
            p_eg: '#ff007f', p_ei: '#ffe066', p_eb: '#1a1b26', // Explosive
        };

        // --- PLAYER SPRITES (16x16 pixels) ---
        
        // Idle
        const playerIdle = [
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..psswpdswwp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....cccccc......",
            "...coocoooc.....",
            "..cooooooooc....",
            "..cooooooooc....",
            "...cooooooc.....",
            "....oooooo......",
            "....dd..dd......",
            "....dd..dd......",
            "...ddd..ddd.....",
            "................"
        ];
        
        // Run Frame 1 (Left Leg Forward)
        const playerRun1 = [
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..psswpdswwp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....cccccc......",
            "...coocoooc.....",
            "..cooooooooc....",
            "..cooooooooc....",
            "...cooooooc.....",
            "....oooooo......",
            "....dd...d......",
            "....dd...dd.....",
            "...ddd....dd....",
            "................"
        ];

        // Run Frame 2 (Passing)
        const playerRun2 = [
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..psswpdswwp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....cccccc......",
            "...coocoooc.....",
            "..cooooooooc....",
            "..cooooooooc....",
            "...cooooooc.....",
            "....oooooo......",
            "....d...dd......",
            "....dd..dd......",
            "....dd..ddd.....",
            "................"
        ];

        // Run Frame 3 (Right Leg Forward)
        const playerRun3 = [
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..psswpdswwp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....cccccc......",
            "...coocoooc.....",
            "..cooooooooc....",
            "..cooooooooc....",
            "...cooooooc.....",
            "....oooooo......",
            "....d...dd......",
            "...dd...dd......",
            "..dd....ddd.....",
            "................"
        ];

        // Run Frame 4 (Passing 2)
        const playerRun4 = playerRun2; // Re-use

        // Jump
        const playerJump = [
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..psswpdswwp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....cccccc......",
            "...coocoooc.....",
            "..cooooooooc....",
            "..cooooooooc....",
            "...cooooooc.....",
            "....oooooo......",
            "...dd...dd......",
            "..dd.....dd.....",
            "..dd.....dd.....",
            "................"
        ];

        // Shoot (Holds Gun Outright)
        const playerShoot = [
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..psswpdswwp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....ccccccgg....",
            "...coocoooog....",
            "..coooooooog....",
            "..cooooooooc....",
            "...cooooooc.....",
            "....oooooo......",
            "....dd..dd......",
            "....dd..dd......",
            "...ddd..ddd.....",
            "................"
        ];

        // Hurt
        const playerHurt = [
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..pssddddswp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....cccccc......",
            "...coocoooc.....",
            "..cooooooooc....",
            "..cooooooooc....",
            "...cooooooc.....",
            "....oooooo......",
            "....dd..dd......",
            "....dd..dd......",
            "...ddd..ddd.....",
            "................"
        ];

        // Dead
        const playerDead = [
            "................",
            "................",
            "................",
            "................",
            "....pppppp......",
            "...pssssssp.....",
            "..pssssssssp....",
            "..pssd--dswp....",
            "..pssssssssp....",
            "...pssssssp.....",
            "....cccccc......",
            "...coocoooc.....",
            "..cooooooooc....",
            "....oooooo......",
            "....dd..dd......",
            "....dd..dd......"
        ];

        this.player.idle = this.createCanvasFromMap(playerIdle, PALETTE, 'p');
        this.player.run = [
            this.createCanvasFromMap(playerRun1, PALETTE, 'p'),
            this.createCanvasFromMap(playerRun3, PALETTE, 'p')
        ];
        this.player.jump = this.createCanvasFromMap(playerJump, PALETTE, 'p');
        this.player.shoot = this.createCanvasFromMap(playerShoot, PALETTE, 'p');
        this.player.hurt = this.createCanvasFromMap(playerHurt, PALETTE, 'p');
        // Let's modify palette helper slightly to make the hurt player blink red
        this.player.hurtRed = this.createCanvasFromMap(playerHurt, Object.assign({}, PALETTE, {pc:'#ff0000', po:'#aa0000', ps:'#ffaaaa'}), 'p');
        this.player.dead = this.createCanvasFromMap(playerDead, PALETTE, 'p');


        // --- ZOMBIE SPRITES (16x16 pixels) ---
        
        // Walk Frame 1 (Hands Reaching out - hunched posture, green skin hands, glowing eyes)
        const zombieWalk1 = [
            "................",
            "........hhhh....",
            ".......hhsssh...",
            "......hhssessh..",
            "......hssssssh..",
            "....chssssss....",
            "...ccchccccc....",
            "..ccccc.cssss...",
            "..cccc..sssss...",
            "..ccccc.........",
            "...ooooo........",
            "...o..ooo.......",
            "..oo...oo.......",
            "..dd...dd.......",
            ".ddd..ddd.......",
            "................"
        ];

        // Walk Frame 2 (Bobbing arm and forward stride)
        const zombieWalk2 = [
            "................",
            "........hhhh....",
            ".......hhsssh...",
            "......hhssessh..",
            "......hssssssh..",
            "....chssssss....",
            "...ccchccccc....",
            "..ccccc..ssssss.",
            "..cccc...sssss..",
            "..ccccc.........",
            "...ooooo........",
            "...oo..oo.......",
            "...oo...oo......",
            "...dd...dd......",
            "...ddd..ddd.....",
            "................"
        ];

        // Walk Frame 3 (Stepping frame)
        const zombieWalk3 = [
            "................",
            "........hhhh....",
            ".......hhsssh...",
            "......hhssessh..",
            "......hssssssh..",
            "....chssssss....",
            "...ccchccccc....",
            "..ccccc.cssss...",
            "..cccc..sssss...",
            "..ccccc.........",
            "...ooooo........",
            "....oo..oo......",
            "....oo..oo......",
            "....dd..dd......",
            "....ddd.ddd.....",
            "................"
        ];

        const zombieDead = [
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            "................",
            ".......hhhhhh...",
            "......hssssssh..",
            "....chssseessh..",
            "...cccccccoss...",
            "..ccccccoooos...",
            "..dddddddddd....",
            "................"
        ];

        this.zombie.walk = [
            this.createCanvasFromMap(zombieWalk1, PALETTE, 'z'),
            this.createCanvasFromMap(zombieWalk2, PALETTE, 'z')
        ];
        this.zombie.hurt = this.createCanvasFromMap(zombieWalk1, Object.assign({}, PALETTE, {zs:'#ff8888', zc:'#ff0055'}), 'z');
        this.zombie.dead = this.createCanvasFromMap(zombieDead, PALETTE, 'z');



        // --- COLLECTIBLES & ICONS ---

        // Ammo Box (10x10 pixels)
        const ammoBox = [
            ".aaaaaaaa.",
            "abbbbbbbba",
            "abbsysbba",
            "abbsysbba",
            "absysysba",
            "absysysba",
            "abbsysbba",
            "abbsysbba",
            "abbbbbbbba",
            ".aaaaaaaa."
        ];
        this.ammo = this.createCanvasFromMap(ammoBox, PALETTE, 'a');

        // UI Heart (9x8 pixels)
        const heartFull = [
            ".rr..rr.",
            "rrrrrrrr",
            "rrrrrrrr",
            "rrrrrrrr",
            ".rrrrrr.",
            "..rrrr..",
            "...rr...",
            "........"
        ];
        const heartEmpty = [
            ".dd..dd.",
            "d..dd..d",
            "d......d",
            "d......d",
            ".d....d.",
            "..d..d..",
            "...dd...",
            "........"
        ];
        this.heart.full = this.createCanvasFromMap(heartFull, {t:'transparent', r:'#ff3366'}, 'h');
        this.heart.empty = this.createCanvasFromMap(heartEmpty, {t:'transparent', d:'#3c3c54'}, 'h');


        // --- ENVIRONMENT TILES (16x16 pixels) ---
        
        // Grass Platform Top Block
        const blockGrass = [
            "gggggggggggggggg",
            "gggggggggggggggg",
            "gssssggggggssgsg",
            "gssgssgssgssgssg",
            "gssgssgssgssgssg",
            "ssddddddddddddss",
            "sdddddddddddddds",
            "dddddddddddddddd",
            "ddddhhdhhhhddhhd",
            "dddhhhhhddhhhhhd",
            "ddhhhhhhhhhhhhdd",
            "ddhhhhhhhhhhhhdd",
            "dddhhhhhddhhhhhd",
            "ddddhhdhhhhddhhd",
            "dddddddddddddddd",
            "dddddddddddddddd"
        ];
        this.grass = this.createCanvasFromMap(blockGrass, PALETTE, 'grass');

        // Dirt Platform Underneath Block
        const blockDirt = [
            "dddddddddddddddd",
            "dddddddddddddddd",
            "ddddhhdhhhhddhhd",
            "dddhhhhhddhhhhhd",
            "ddhhhhhhhhhhhhdd",
            "ddhhhhhhhhhhhhdd",
            "dddhhhhhddhhhhhd",
            "ddddhhdhhhhddhhd",
            "dddddddddddddddd",
            "dddddddddddddddd",
            "ddddhhdhhhhddhhd",
            "dddhhhhhddhhhhhd",
            "ddhhhhhhhhhhhhdd",
            "ddhhhhhhhhhhhhdd",
            "dddhhhhhddhhhhhd",
            "dddddddddddddddd"
        ];
        this.dirt = this.createCanvasFromMap(blockDirt, PALETTE, 'grass');


        // --- LARGE SCENERY (Bushe, Tree, Cloud) ---
        
        // Bush (24x16 pixels)
        const bushMap = [
            "........ffffff..........",
            "......ffffffffff........",
            "....ffffffffffffff......",
            "...fffffffffffffffff....",
            "..ffffffffffssfffffff...",
            ".fffffffffsssssfffffffff.",
            ".fffffffsssssssssfffffff.",
            "ffffffsssssssssssssfffff.",
            "fffffsssssssssssssssffff.",
            "fffffssssshsssssssssffff.",
            "ffffsssshhhhhssssssssfff.",
            "ffffssshhhhhhhsssssssfff.",
            "ffffsshhhhhhhhhssssssfff.",
            "fffsshhhhhhhhhhhsssssfff.",
            "fffsshhhhhhhhhhhsssssfff.",
            "........................"
        ];
        this.bush = null;
        this.tree = null;
        this.cloud = null;
        const crateMap = [
            "1111111111111111",
            "1222222222222221",
            "1233333333333221",
            "1231122222213221",
            "1231312222133221",
            "1232131221323221",
            "1232213121322221",
            "1232221313222221",
            "1232222132222221",
            "1232221313222221",
            "1232213121322221",
            "1232131221322221",
            "1231312222132221",
            "1231122222212221",
            "1222222222222221",
            "1111111111111111"
        ];
        const spikesMap = [
            "................",
            "................",
            "................",
            "....3......3....",
            "...343....343...",
            "...343....343...",
            "..34443..34443..",
            "..34443..34443..",
            ".34424433442443.",
            ".34424433442443.",
            "3442224444222443",
            "3442224444222443",
            "4422122442212244",
            "4221112222111224",
            "2211111221111122",
            "1111111111111111"
        ];
        this.crate = this.createCanvasFromMap(crateMap, PALETTE, 'crate');
        this.spikes = this.createCanvasFromMap(spikesMap, PALETTE, 'spikes');
        this.health = null;

    },

    // Convert string array to scaling-independent offscreen canvas
    createCanvasFromMap(map, palette, category) {
        const height = map.length;
        const width = map[0].length;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Pick specific letter-to-color mapper based on category
        const mapColor = (char) => {
            if (char === '.') return 'transparent';
            if (category === 'p') {
                // Player mapping
                if (char === 'p') return palette.ph; // hair
                if (char === 's') return palette.ps; // skin
                if (char === 'c') return palette.pc; // shirt
                if (char === 'o') return palette.po; // overalls
                if (char === 'd') return palette.pd; // boots
                if (char === 'g') return palette.pg; // gun neon
                if (char === 'w') return palette.pw; // white
                if (char === '-') return 'transparent'; // mouth/cross eyes
            } else if (category === 'z') {
                // Zombie mapping
                if (char === 'h') return palette.zh; // hair
                if (char === 's') return palette.zs; // skin
                if (char === 'c') return palette.zc; // shirt
                if (char === 'o') return palette.zo; // pants
                if (char === 'd') return palette.pd; // boots
                if (char === 'e') return palette.ze; // eyes
                if (char === '-') return 'transparent';
            } else if (category === 'a') {
                // Ammo box mapping
                if (char === 'a') return palette.ab; // metal box dark
                if (char === 'b') return palette.ay; // metal box stripe
                if (char === 's') return '#111'; // shadow
                if (char === 'y') return '#ffc107'; // bullet gold
            } else if (category === 'grass') {
                if (char === 'g') return palette.g1; // grass green
                if (char === 's') return palette.g2; // grass shadow
                if (char === 'd') return palette.d1; // dirt brown
                if (char === 'h') return palette.d2; // dirt shadow
            } else if (category === 'tree') {
                if (char === 'f') return palette.f1; // foliage bright
                if (char === 's') return palette.f2; // foliage med
                if (char === 'h') return palette.f3; // foliage shadow
                if (char === 't') return palette.tr; // trunk wood
            } else if (category === 'cloud') {
                if (char === 'c') return palette.cl; // cloud
                if (char === 's') return palette.cs; // cloud shadow
            } else if (category === 'crate') {
                if (char === '1') return palette.cr1;
                if (char === '2') return palette.cr2;
                if (char === '3') return palette.cr3;
            } else if (category === 'spikes') {
                if (char === '1') return palette.sp1;
                if (char === '2') return palette.sp2;
                if (char === '3') return palette.sp3;
                if (char === '4') return palette.sp4;
            } else if (category === 'health') {
                if (char === '1') return palette.sp1;
                if (char === '2') return palette.cr2;
                if (char === 'w') return palette.pw;
                if (char === 'h') return palette.hr1;
            }
            return palette[char] || 'transparent';
        };

        // Draw pixel-by-pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = map[y][x];
                const color = mapColor(char);
                if (color !== 'transparent') {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        return canvas;
    }
};
