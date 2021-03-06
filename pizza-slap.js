(function pizza_slap(c) {
    'use strict';
    var BLOCK_HEIGHT = 16;
    var BLOCK_WIDTH = 16;

    var TERMINAL_VELOCITY = 19;
    var GRAVITY = 0.9;
    var FRICTION = 0.9;

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

    var sounds = {
        "slap": new Audio("slap.mp3"),
        "monster_hit": new Audio("monster-hit.mp3"),
        "monster_kill": new Audio("monster_kill.mp3"),
        "player_hit": new Audio("player_hit.mp3"),
        "player_kill": new Audio("player_kill.mp3"),
        "jump": new Audio("jump.mp3"),
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
    var boss_sprites = sprites("boss", 8);

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
        var spike_count = 0;
        var plat_count = 0;
        for (var i = 0; i < platforms.length; ++i) {
            if (collides(under, platforms[i], true)) {
                if (platforms[i].spike) {
                    ++spike_count;
                } else {
                    ++plat_count;
                }
            }
        }
        return (spike_count > plat_count);
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
            sounds.player_kill.load();
            sounds.player_kill.volume = 0.1;
            sounds.player_kill.play();
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
        'acceleration': 5,
        'deceleration': 5,
        'top_speed': 6,
        'jump': -12.5,
        'unjump': -5.5,
        'invincible_until': frameno + 120,
        'hit': function (p, facing) {
            p.yspeed = -5;
            if (facing) {
                p.xspeed = 10 * facing;
            };
            p.invincible_until = frameno + 80;
            --p.health;
            if (p.health <= 0) {
                p.kill(p);
            } else {
                sounds.player_hit.load();
                sounds.player_hit.volume = 0.1;
                sounds.player_hit.play();
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
                obj.xspeed -= obj.deceleration;
            } else if (obj.xspeed >= (-obj.top_speed + obj.acceleration)) {
                obj.xspeed = obj.xspeed - obj.acceleration;
            } else {
                obj.xspeed = -obj.top_speed;
            }
        } else if (obj.press_right) {
            obj.facing = 1;
            if (obj.xspeed < 0) {
                obj.xspeed += obj.deceleration;
            } else if (obj.xspeed <= (obj.top_speed - obj.acceleration)) {
                obj.xspeed = obj.xspeed + obj.acceleration;
            } else {
                obj.xspeed = obj.top_speed;
            }
        } else {
            if (obj.xspeed > 0) {
                obj.xspeed = Math.max(0, obj.xspeed - FRICTION);
            } else {
                obj.xspeed = Math.min(0, obj.xspeed + FRICTION);
            }
        }

        if ((! in_the_air) && (obj.press_jump)) {
            sounds.jump.load();
            sounds.jump.volume = 0.1;
            sounds.jump.play();
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
                sounds.slap.load();
                sounds.slap.volume = 0.08;
                sounds.slap.play();
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
                next_level = true;
            }
        }
        for (var mi = 0; mi < monsters.length; ++mi) {
            if (! monsters[mi].dead) {
                if (collides(player, monsters[mi], true)) {
                    player.hit(player);
                } else if (collides(player, slap_obj(monsters[mi]), true)) {
                    player.hit(player, monsters[mi].facing);
                }

                if (collides(slap_obj(player), monsters[mi], true)) {
                    monsters[mi].hit(monsters[mi], player.facing);
                    sounds.monster_hit.load();
                    sounds.monster_hit.volume = 0.3;
                    sounds.monster_hit.play();
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

    var monster_hit = function (m, facing) {
        m.yspeed = -5;
        m.xspeed = 15 * facing;
        m.invincible_until = frameno + 30;
        --m.health;
        if (m.health <= 0) {
            m.kill(m);
        }
    };

    var monster_kill = function (m) {
        sounds.monster_kill.load();
        sounds.monster_kill.volume = 0.04;
        sounds.monster_kill.play();
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
            'acceleration': 3,
            'deceleration': 3,
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
                if (Math.abs(player.y - m.y) < 150) {
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
                }
            },
            'health': 3,
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
            'acceleration': 3,
            'deceleration': 3,
            'top_speed': 3.0,
            'jump': -1,
            'unjump': -1,
            'invincible_until': 0,
            'slap_frame': -1,
            'slap': [],
            'ai': function (m) {
                m.press_right = false;
                m.press_left = false;

                if (player.x > m.x) {
                    m.press_right = true;
                } else if (player.x < m.x) {
                    m.press_left = true;
                }
                if (Math.abs(player.x - m.x) < 300) {
                    if (player.y > m.y) {
                        m.yspeed = 5;
                    } else {
                        m.yspeed = 0;
                    }
                } else if (m.y > 100) {
                    m.yspeed = -2;
                } else {
                    m.yspeed = 0;
                }
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
            'acceleration': 3,
            'deceleration': 3,
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
                if (Math.abs(player.y - m.y) < 150) {
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

    var new_boss = function(x, y) {
        return {
            'facing': 1,
            'x': x,
            'y': y,
            'height': 140,
            'width': 180,
            'xspeed': 0,
            'yspeed': 0,
            'acceleration': 1,
            'deceleration': 1,
            'top_speed': 7,
            'jump': -30,
            'unjump': -30,
            'invincible_until': 0,
            'slap_frame': -1,
            'slap': [],
            'state': 0,
            'ai': function (m) {
                m.press_left  = false;
                m.press_right = false;
                m.press_jump  = false;

                switch (m.state) {
                    case 0: // chase!
                        if (m.invincible_until > frameno) {
                            // I'm hit, run away!!!
                            m.state = 1;
                            m.run_health = m.health;
                            if (player.x < (level.width / 2)) {
                                m.flee_facing = 1;
                            } else {
                                m.flee_facing = -1;
                            }
                        } else {
                            if (m.xspeed === 0) {
                                m.press_jump = true;
                            } else {
                                if ((Math.random() * 180) < 1) {
                                    m.press_jump = true;
                                }
                            }
                            if (m.y < 400) {
                                if (m.x > (level.width / 2)) {
                                    m.press_left = true;
                                } else {
                                    m.press_right = true;
                                }
                            } else {
                                if ((player.x + player.width) < m.x) {
                                    m.press_left = true;
                                } else if (player.x > (m.x + m.width)) {
                                    m.press_right = true;
                                }
                            }
                        }
                        break;
                    case 1: // run away
                        if ((m.yspeed === 0) && (m.y < 300)) {
                            // I'm safe up here.
                            m.state = 2;
                            m.hide_until = frameno + 180;
                        } else {
                            if (m.run_health != m.health) {
                                m.flee_facing *= -1;
                                m.run_health = m.health;
                            }
                            if (m.flee_facing === 1) {
                                if ((level.width - (m.x + m.width)) < (level.width / 5.5)) {
                                    m.press_jump = true;
                                    m.press_right = true;
                                } else if ((level.width - (m.x + m.width)) > (level.width / 7.6)) {
                                    m.press_right = true;
                                } else {
                                    m.flee_facing *= -1;
                                }
                            } else {
                                if (m.x < (level.width / 5.5)) {
                                    m.press_jump = true;
                                    m.press_left = true;
                                } else if (m.x > (level.width / 7.6)) {
                                    m.press_left = true;
                                } else {
                                    m.flee_facing *= -1;
                                }
                            }
                        }
                        break;
                    case 2: // stay away
                        if (frameno > m.hide_until) {
                            // CHAAARGE
                            m.state = 0;
                        } else {
                            // huff, puff
                        }
                        break;
                };
            },
            'health': 10,
            'hit': monster_hit,
            'kill': function (m) {
                monster_kill(m);
                game_over = true;
                victory = true;
            },
            'sprites': {
                'monster': { 's': function(p) { return animated_sprite(p, 'monster') },
                             'dx': 0,
                             'dy': 0,
                             'ss': boss_sprites,
                             'sprite_index': 0,
                             'sprite_speed': 3,
                             'predicate': function (p) { return true },
                },
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
        'id': 0,
        'width': 0,
    };

    var from_ahead = function (column) {
        var x = column * BLOCK_WIDTH;
        return function () {
            return (player.x > (x - c.width / 2));
        }
    };
    var from_behind = function (column) {
        var x = column * BLOCK_WIDTH;
        return function () {
            return (player.x > (x + c.width / 2));
        }
    };

    var load_level = function(level_data) {
        // le reset
        platforms = [];
        spawnpoints = [];
        monsters = [];
        level_end = [];
        player.health = 8;

        console.log("LOAD");

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
                    case '%':
                        monsters.push(new_boss(column * BLOCK_WIDTH, row * BLOCK_HEIGHT));
                        break;
                    case 'A':
                        spawnpoints.push(new_spawnpoint(column, row, from_ahead(column), new_blob));
                        break;
                    case 'a':
                        spawnpoints.push(new_spawnpoint(column, row, from_behind(column), new_blob));
                        break;
                    case 'B':
                        spawnpoints.push(new_spawnpoint(column, row, from_ahead(column), new_flyer));
                        break;
                    case 'b':
                        spawnpoints.push(new_spawnpoint(column, row, from_behind(column), new_flyer));
                        break;
                    case 'C':
                        spawnpoints.push(new_spawnpoint(column, row, from_ahead(column), new_whacker));
                        break;
                    case 'c':
                        spawnpoints.push(new_spawnpoint(column, row, from_behind(column), new_whacker));
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

        level_ready = true;
        requestAnimationFrame(frame);
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
    var next_level = true;
    var level_ready = false;
    var frame = function() {
        if ((! game_over) && (level_ready)) {
            var now = window.performance.now();
            delta = delta + Math.min(1, (now - last) / 1000);
            while (delta > STEP) {
                delta = delta - STEP;
                update();
            }
            render();
            last = now;
            requestAnimationFrame(frame);
        }
        if (next_level) {
            level_ready = false;
            next_level = false;
            ++level.id;
            $.getJSON("level-" + level.id + ".json", load_level);
        }
        if (game_over) {
            render_game_over();
        }
    };

    requestAnimationFrame(frame);
})(document.getElementById("pizza-slap"));
