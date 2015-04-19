(function pizza_slap(c) {
    'use strict';
    var BLOCK_HEIGHT = 16;
    var BLOCK_WIDTH = 16;

    var TERMINAL_VELOCITY = 19;
    var GRAVITY = 0.9;

    c.width = BLOCK_WIDTH * 53;
    c.height = BLOCK_HEIGHT * 46;

    var sprites = function (basename, n) {
        var list = [];
        for (var i = 0; i < n; ++i) {
            var current = new Image();
            current.src = basename + (i + 1) + ".png";
            list.push(current);
        }
        return list;
    };

    var bg_layer1 = new Image();
    var bg_layer2 = new Image();
    var bg_layer3 = new Image();
    var player_sprites = sprites("player", 8);
    var arm_sprites = sprites("arm", 4);
    var brick_sprite = new Image();
    var spike_sprite = new Image();
    var slap_sprites = sprites("slap", 10);
    var life_sprites = sprites("life", 9);
    var flyer_sprites = sprites("flyer", 5);
    var blob_sprites = sprites("blob", 6);
    var whacker_sprite = new Image();
    var whacker_arm_sprite = new Image();
    var whacker_slap_sprites = sprites("whacker-slap", 32);

    bg_layer1.src = "bg-layer1.png";
    bg_layer2.src = "bg-layer2.png";
    bg_layer3.src = "bg-layer3.png";
    brick_sprite.src = "brick.png";
    spike_sprite.src = "spike.png";
    whacker_sprite.src = "whacker.png";
    whacker_arm_sprite.src = "whacker-arm.png";

    var frameno = 0;
    var platforms = [];
    var level_end = [];
    var game_over = false;
    var victory = false;

    var collides = function(o1, o2, respect_invincibility) {
        if (respect_invincibility) {
            if ((o1.invincible_until > frameno) || (o2.invincible_until > frameno)) {
                return false;
            }
        }
        if ((o1.x < (o2.x + o2.width)) &&
            ((o1.x + o1.width) > o2.x) &&
            (o1.y < (o2.y + o2.height)) &&
            ((o1.y + o1.height) > o2.y)) {
            return true;
        }
        return false;
    };
    var collides_with_platforms = function(obj) {
        for (var i = 0; i < platforms.length; ++i) {
            if (collides(obj, platforms[i])) {
                // console.log("bump");
                return true;
            }
        }
        // console.log("no bump");
        return false;
    };

    var new_obj_at = function(obj, new_x, new_y) {
        return {
            'invincible_until': obj.invincible_until,
            'x': new_x,
            'y': new_y,
            'height': obj.height,
            'width': obj.width,
        };
    };
    var slap_obj = function(obj) {
        if (obj.slap_frame === -1) {
            return {
                'x': 0,
                'y': 0,
                'height': 0,
                'width': 0,
            };
        }
        if (obj.facing === 1) {
            return {
                'x': obj.x + (obj.width / 2) + obj.slap[obj.slap_frame].dx,
                'y': obj.y + (obj.height / 2) + obj.slap[obj.slap_frame].dy,
                'height': obj.slap[obj.slap_frame].h,
                'width': obj.slap[obj.slap_frame].w
            };
        } else {
            return {
                'x': obj.x + (obj.width / 2) - obj.slap[obj.slap_frame].dx - obj.slap[obj.slap_frame].w,
                'y': obj.y + (obj.height / 2) + obj.slap[obj.slap_frame].dy,
                'height': obj.slap[obj.slap_frame].h,
                'width': obj.slap[obj.slap_frame].w
            };
        }
    };
    var under_feet = function(obj) {
        return new_obj_at(obj, obj.x, obj.y + 1);
    };
    var spiked = function(obj) {
        var under = under_feet(obj);
        for (var i = 0; i < platforms.length; ++i) {
            if (platforms[i].spike) {
                if (collides(under, platforms[i], true)) {
                    return true;
                }
            }
        }
        return false;
    };

    var animated_sprite = function(obj, sprite_name) {
        var sinfo = obj.sprites[sprite_name];
        if (sinfo.predicate(obj)) {
            if ((frameno % sinfo.sprite_speed) === 0) {
                ++sinfo.sprite_index;
                if (sinfo.sprite_index >= sinfo.ss.length) {
                    sinfo.sprite_index = 0;
                }
            }
            //console.log(sinfo.sprite_index);
        }
        return sinfo.ss[sinfo.sprite_index];
    };

    var player = {
        'health': 8,
        'dead': true,
        'kill': function (p) {
            p.dead = true;
            game_over = true;
        },
        'facing': 1,
        'height': 118,
        'width': 74,
        'x': 50,
        'y': 200,
        'xspeed': 0,
        'yspeed': 0,
        'press_left': false,
        'press_right': false,
        'press_jump': false,
        'unpress_jump': false,
        'press_slap': false,
        'top_speed': 6,
        'jump': -10.5,
        'unjump': -5.5,
        'invincible_until': frameno + 120,
        'hit': function (p) {
            p.yspeed = -5,
            p.invincible_until = frameno + 80;
            --p.health;
            if (p.health <= 0) {
                p.kill(p);
            }
        },
        'slap': [
            { 'dx': -20, 'dy': -90, 'h': 40, 'w': 90 },
            { 'dx': -20, 'dy': -90, 'h': 40, 'w': 90 },
            { 'dx': -20, 'dy': -90, 'h': 40, 'w': 90 },
            { 'dx': -20, 'dy': -90, 'h': 40, 'w': 90 },
            { 'dx': 20, 'dy': -60, 'h': 100, 'w': 60 },
            { 'dx': 20, 'dy': -60, 'h': 100, 'w': 60 },
            { 'dx': 20, 'dy': -60, 'h': 100, 'w': 60 },
            { 'dx': 20, 'dy': -60, 'h': 100, 'w': 60 },
            { 'dx': 20, 'dy': -60, 'h': 100, 'w': 60 },
            { 'dx': 20, 'dy': -60, 'h': 100, 'w': 60 },
        ],
        'slap_frame': -1,
        'sprites': {
            'player': { 's': function (p) { return animated_sprite(p, 'player') },
                        'dx': 0,
                        'dy': 0,
                        'ss': player_sprites,
                        'sprite_index': 0,
                        'sprite_speed': 2,
                        'predicate': function (p) { return p.xspeed !== 0; },
            },
            'arm':    { 's': function (p) { return animated_sprite(p, 'arm') },
                        'dx': 0,
                        'dy': 0,
                        'ss': arm_sprites,
                        'sprite_index': 0,
                        'sprite_speed': 9,
                        'predicate': function (p) { return true; },
            },
            'slap':   { 's': function (p) { return slap_sprites[p.slap_frame] },
                        'dx': 0,
                        'dy': -30
            },
        },
    };
    var spawn_player = function(bx, by) {
        player.x = bx * BLOCK_WIDTH;
        player.y = by * BLOCK_HEIGHT;
        player.dead = false;
    };

    var move = function(obj) {
        var in_the_air = (! collides_with_platforms(under_feet(obj)));

        if (obj.press_left) {
            obj.facing = -1;
            if (obj.xspeed > 0) {
                obj.xspeed = 0;
            } else {
                obj.xspeed = -obj.top_speed;
            }
        } else if (obj.press_right) {
            obj.facing = 1;
            if (obj.xspeed < 0) {
                obj.xspeed = 0;
            } else {
                obj.xspeed = obj.top_speed;
            }
        } else {
            obj.xspeed = 0;
        }

        if ((! in_the_air) && (obj.press_jump)) {
            obj.press_jump = false;
            obj.yspeed = obj.jump;
        }
        if (obj.unpress_jump) {
            obj.unpress_jump = false;
            if (obj.yspeed < obj.unjump) {
                obj.yspeed = obj.unjump;
            }
        }
        if ((in_the_air) && (! obj.flying)) {
            obj.yspeed = Math.min(TERMINAL_VELOCITY, obj.yspeed + GRAVITY);
        }

        var new_x = Math.floor(obj.x + obj.xspeed);
        var new_y = Math.floor(obj.y + obj.yspeed);

        if (new_y >= c.height + obj.height) {
            obj.kill(obj);
            return;
        }
        if (obj.yspeed > 0) {
            while (collides_with_platforms(new_obj_at(obj, obj.x, new_y))) {
                obj.yspeed = 0;
                --new_y;
            }
        } else if (obj.yspeed < 0) {
            while (collides_with_platforms(new_obj_at(obj, obj.x, new_y))) {
                obj.yspeed = 0;
                ++new_y;
            }
        }
        if (obj.xspeed > 0) {
            while (collides_with_platforms(new_obj_at(obj, new_x, obj.y))) {
                obj.xspeed = 0;
                --new_x;
            }
        } else if (obj.xspeed < 0) {
            while ((new_x < 0) || (collides_with_platforms(new_obj_at(obj, new_x, obj.y)))) {
                obj.xspeed = 0;
                ++new_x;
            }
        }

        // console.log("obj.x = " + obj.x + ", obj.y = " + obj.y);
        obj.x = new_x;
        obj.y = new_y;
        //console.log("obj.x = " + obj.x + ", obj.y = " + obj.y);
    };

    var maybe_slap = function(obj) {
        if (obj.slap_frame == -1) {
            if (obj.press_slap) {
                obj.slap_frame = 0;
                obj.press_slap = false;
            }
        } else {
            //console.log("slapping");
            ++obj.slap_frame;
            if (obj.slap_frame == obj.slap.length) {
                obj.slap_frame = -1;
            }
        }
    };

    var move_player = function() {
        move(player);
        maybe_slap(player);
        if (spiked(player)) {
            player.hit(player);
        }
        for (var ei = 0; ei < level_end.length; ++ei) {
            if (collides(player, level_end[ei])) {
                victory = true;
                game_over = true;
            }
        }
        for (var mi = 0; mi < monsters.length; ++mi) {
            if (! monsters[mi].dead) {
                if (collides(player, monsters[mi], true)) {
                    player.hit(player);
                } else if (collides(player, slap_obj(monsters[mi]), true)) {
                    player.hit(player);
                }

                if (collides(slap_obj(player), monsters[mi], true)) {
                    monsters[mi].hit(monsters[mi]);
                }
            }
        }
    };

    var update = function() {
        ++frameno;
        move_player();
        move_monsters();
        maybe_spawn_monsters();
    };

    var keydown = function(e) {
        switch (e.keyCode) {
            case 37:
            case 65:
                player.press_left = true;
                return false;
            case 39:
            case 68:
                player.press_right = true;
                return false;
            case 38:
            case 87:
                player.unpress_jump = false;
                player.press_jump = true;
                return false;
            case 32:
                player.press_slap = true;
                return false;
        }
    };
    var keyup = function(e) {
        switch (e.keyCode) {
            case 37:
            case 65:
                player.press_left = false;
                return false;
            case 39:
            case 68:
                player.press_right = false;
                return false;
            case 38:
            case 87:
                player.unpress_jump = true;
                player.press_jump = false;
                return false;
            case 32:
                player.press_slap = false;
                return false;
        }
    };
    $(document).keydown(keydown);
    $(document).keyup(keyup);

    var new_platform = function(bx, by, spike) {
        return {
            'sprites': { 'platform': { 's': function (p) { return p.spike ? spike_sprite : brick_sprite; }, 'dx': 0, 'dy': 0 } },
            'x': bx * BLOCK_WIDTH,
            'y': by * BLOCK_HEIGHT,
            'height': BLOCK_HEIGHT,
            'width': BLOCK_WIDTH,
            'spike': spike,
        };
    };
    var new_level_end = function(bx, by) {
        return {
            'x': bx * BLOCK_WIDTH,
            'y': by * BLOCK_HEIGHT,
            'height': BLOCK_HEIGHT,
            'width': BLOCK_WIDTH,
        };
    };

    var spawnpoints = [];
    var new_spawnpoint = function(bx, by, predicate, spawn) {
        return {
            'x': bx * BLOCK_WIDTH,
            'y': by * BLOCK_HEIGHT,
            'predicate': predicate,
            'spawn': spawn,
            'spawned': false,
        };
    };

    var monsters = [];

    var maybe_spawn_monsters = function() {
        for (var si = 0; si < spawnpoints.length; ++si) {
            if ((! spawnpoints[si].spawned) && (spawnpoints[si].predicate())) {
                // spawn a monster
                monsters.push(spawnpoints[si].spawn(spawnpoints[si].x, spawnpoints[si].y));
                spawnpoints[si].spawned = true;
            }
        }
    };

    var monster_hit = function (m) {
        m.yspeed = -5;
        m.invincible_until = frameno + 30;
        --m.health;
        if (m.health <= 0) {
            m.kill(m);
        }
    };

    var monster_kill = function (m) {
        m.dead = true;
    };

    var new_blob = function(x, y) {
        return {
            'facing': 1,
            'x': x,
            'y': y,
            'height': 70,
            'width': 90,
            'xspeed': 0,
            'yspeed': 0,
            'top_speed': 3.0,
            'jump': -11.5,
            'unjump': -8,
            'invincible_until': 0,
            'slap_frame': -1,
            'slap': [],
            'ai': function (m) {
                m.press_left  = false;
                m.press_right = false;
                m.press_jump  = false;
                m.press_slap  = false;

                var in_the_air = (! collides_with_platforms(under_feet(m)));
                // attempt to chase
                if ((player.x + player.width) < m.x) {
                    if ((in_the_air) || (collides_with_platforms(new_obj_at(m, m.x - m.width / 2, m.y + m.height)))) {
                        if (m.xspeed === 0) {
                            m.press_jump = true;
                        }
                        m.press_left = true;
                    }
                } else if (player.x > (m.x + m.width)) {
                    if ((in_the_air) || (collides_with_platforms(new_obj_at(m, m.x + m.width / 2, m.y + m.height)))) {
                        if (m.xspeed === 0) {
                            m.press_jump = true;
                        }
                        m.press_right = true;
                    }
                }
            },
            'health': 4,
            'hit': monster_hit,
            'kill': monster_kill,
            'sprites': {
                'monster': { 's': function(p) { return animated_sprite(p, 'monster') },
                             'dx': 0,
                             'dy': 0,
                             'ss': blob_sprites,
                             'sprite_index': 0,
                             'sprite_speed': 6,
                             'predicate': function (p) { return true; },
                },
            }
        };
    };

    var new_flyer = function(x, y) {
        return {
            'facing': 1,
            'flying': true,
            'x': x,
            'y': y,
            'height': 50,
            'width': 70,
            'xspeed': 0,
            'yspeed': 0,
            'top_speed': 3.0,
            'jump': -1,
            'unjump': -1,
            'invincible_until': 0,
            'slap_frame': -1,
            'slap': [],
            'ai': function (m) {
                m.yspeed = 0;
            },
            'health': 2,
            'hit': monster_hit,
            'kill': monster_kill,
            'sprites': {
                'monster': { 's': function(p) { return animated_sprite(p, 'monster') },
                             'dx': 0,
                             'dy': 0,
                             'ss': flyer_sprites,
                             'sprite_index': 0,
                             'sprite_speed': 4,
                             'predicate': function (p) { return true; },
                },
            }
        };
    };

    var new_whacker = function(x, y) {
        return {
            'facing': 1,
            'x': x,
            'y': y,
            'height': 100,
            'width': 70,
            'xspeed': 0,
            'yspeed': 0,
            'top_speed': 4.0,
            'jump': -13,
            'unjump': -13,
            'invincible_until': 0,
            'slap_frame': -1,
            'slap': [ 
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 40 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 50 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 60 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 70 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 80 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 90 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 90 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 80 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 70 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 60 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 50 },
                { 'dx': 0, 'dy': 0, 'h': 30, 'w': 40 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
                { 'dx': 0, 'dy': 0, 'h': 0, 'w': 0 },
            ],
            'ai': function (m) {
                m.press_left  = false;
                m.press_right = false;
                m.press_jump  = false;
                m.press_slap  = false;

                // freeze when slapping
                if (m.slap_frame !== -1) {
                    return;
                }

                var in_the_air = (! collides_with_platforms(under_feet(m)));
                // attempt to chase
                if ((player.x + player.width) < (m.x - 20)) {
                    if ((in_the_air) || (collides_with_platforms(new_obj_at(m, m.x - m.width / 2, m.y + m.height)))) {
                        if (m.xspeed === 0) {
                            m.press_jump = true;
                        }
                        m.press_left = true;
                    }
                } else if (player.x > (m.x + m.width + 20)) {
                    if ((in_the_air) || (collides_with_platforms(new_obj_at(m, m.x + m.width / 2, m.y + m.height)))) {
                        if (m.xspeed === 0) {
                            m.press_jump = true;
                        }
                        m.press_right = true;
                    }
                } else {
                    m.press_slap = true;
                }
            },
            'health': 4,
            'hit': monster_hit,
            'kill': monster_kill,
            'sprites': {
                'monster': { 's': function(p) { return whacker_sprite },
                             'dx': 0,
                             'dy': 0 },
                'arm':     { 's': function(p) { return whacker_arm_sprite },
                             'dx': -35,
                             'dy': 6 },
                'slap':    { 's': function(p) { return whacker_slap_sprites[p.slap_frame] },
                             'dx': -35,
                             'dy': 50 },
            }
        };
    };

    var move_monsters = function() {
        for (var mi = 0; mi < monsters.length; ++mi) {
            if (! monsters[mi].dead) {
                monsters[mi].ai(monsters[mi]);
                move(monsters[mi]);
                maybe_slap(monsters[mi]);
            }
        }
    };

    var level = {
        'width': 0,
    };

    var load_level = function(level_data) {
        //console.log("%o", level_data);
        var max_column = 0;
        for (var row = 0; row < level_data.length; ++row) {
            for (var column = 0; column < level_data[row].length; ++column) {
                if (column > max_column) {
                    max_column = column;
                }
                switch (level_data[row][column]) {
                    case 'x':
                        platforms.push(new_platform(column, row, false));
                        break;
                    case '*':
                        spawn_player(column, row);
                        break;
                    case 'A':
                        spawnpoints.push(new_spawnpoint(column, row, function () { return true }, new_blob));
                        break;
                    case 'B':
                        spawnpoints.push(new_spawnpoint(column, row, function () { return true }, new_flyer));
                        break;
                    case 'C':
                        spawnpoints.push(new_spawnpoint(column, row, function () { return true }, new_whacker));
                        break;
                    case '^':
                        platforms.push(new_platform(column, row, true));
                        break;
                    case '|':
                        level_end.push(new_level_end(column, row));
                        break;
                    case ' ':
                        // nothing to see here
                        break;
                    default:
                        console.log("????");
                        break;
                }
            }
        }
        level.width = (max_column + 1) * BLOCK_WIDTH;
    };

    var ctx = c.getContext("2d");
    ctx.translate(0, 0);
    var render = function() {
        var offset_x = player.x - (c.width / 2);
        if (offset_x < 0) {
            offset_x = 0;
        }
        if (offset_x > level.width - c.width) {
            offset_x = level.width - c.width;
        }

        for (var tilei = 0; tilei * 30 <= level.width; ++tilei) {
            ctx.drawImage(bg_layer1, tilei * 30 - (offset_x / 8), 0, 30, bg_layer1.height);
        }
        for (var tilei = 0; tilei * 320 <= level.width; ++tilei) {
            ctx.drawImage(bg_layer2, tilei * 320 - (offset_x / 4), 0, 320, bg_layer2.height);
        }
        for (var tilei = 0; tilei * 320 <= level.width; ++tilei) {
            ctx.drawImage(bg_layer3, tilei * 320 - (offset_x / 2), 0, 320, bg_layer3.height);
        }

        ctx.drawImage(life_sprites[player.health], c.width - 100, 20, 80, 80);

        var ds = function(obj, sprite_name) {
            var sinfo  = obj.sprites[sprite_name];
            if (sinfo) {
                var sprite = sinfo.s(obj);
                if ((obj.invincible_until > frameno) && (frameno % 9 == 0)) {
                    return;
                }
                ctx.save();
                if (obj.facing == 1) {
                    ctx.scale(1, 1);
                    ctx.drawImage(sprite, obj.x - offset_x - sinfo.dx, obj.y + sinfo.dy);
                } else {
                    ctx.scale(-1, 1);
                    ctx.drawImage(sprite, -1 * (obj.x - offset_x + sinfo.dx) - obj.width, obj.y + sinfo.dy);
                }
                ctx.restore();
            }
        }


        if (! player.dead) {
            ds(player, 'player');
            if (player.slap_frame == -1) {
                ds(player, 'arm');
            } else {
                ds(player, 'slap');
            }
        }

        for (var pi = 0; pi < platforms.length; ++pi) {
            ds(platforms[pi], 'platform');
        }

        for (var mi = 0; mi < monsters.length; ++mi) {
            if (! monsters[mi].dead) {
                ds(monsters[mi], 'monster');
                if (monsters[mi].slap_frame === -1) {
                    ds(monsters[mi], 'arm');
                } else {
                    ds(monsters[mi], 'slap');
                }
                if (monsters[mi].slap_frame !== -1) {
                    var s = slap_obj(monsters[mi]);
                    ctx.strokeStyle = "#FF0000";
                    ctx.strokeRect(s.x - offset_x, s.y, s.width, s.height);
                }
            }
        }
    };
    var render_game_over = function() {
        if (victory) {
            ctx.fillStyle = "#000000";
            ctx.font = "100px Impact";
            ctx.fillText("VICTORY!!!!!!!!!!!!!!", c.width/2 - 270, c.height/2);
        } else {
            ctx.fillStyle = "#000000";
            ctx.font = "100px Impact";
            ctx.fillText("GAME", c.width/2 - 270, c.height/2 - 100);
            ctx.fillText("OVER", c.width/2 - 270, c.height/2);
        }
        return;
    };
    var STEP = 1/60;
    var delta = 0;
    var last = window.performance.now();
    var frame = function() {
        if (! game_over) {
            var now = window.performance.now();
            delta = delta + Math.min(1, (now - last) / 1000);
            while (delta > STEP) {
                delta = delta - STEP;
                update();
            }
            render();
            last = now;
            requestAnimationFrame(frame);
        } else {
            render_game_over();
        }
    };

    $.getJSON("level-1.json", load_level).then(function () {
        requestAnimationFrame(frame);
    });
})(document.getElementById("pizza-slap"));
