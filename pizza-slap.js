(function pizza_slap(c) {
    'use strict';
    var BLOCK_HEIGHT = 16;
    var BLOCK_WIDTH = 16;

    var TERMINAL_VELOCITY = 19;
    var GRAVITY = 0.9;

    c.width = BLOCK_WIDTH * 53;
    c.height = BLOCK_HEIGHT * 46;

    var bg_layer1 = new Image();
    var bg_layer2 = new Image();
    var bg_layer3 = new Image();
    var player_sprite = new Image();
    var arm_sprite = new Image();
    var brick_sprite = new Image();
    var slap_sprites = [ new Image(), new Image(), new Image(), new Image(), new Image(), new Image(), new Image(), new Image(), new Image(), new Image()];

    bg_layer1.src = "bg-layer1.png";
    bg_layer2.src = "bg-layer2.png";
    bg_layer3.src = "bg-layer3.png";
    player_sprite.src = "player.png";
    arm_sprite.src = "arm.png";
    brick_sprite.src = "brick.png";
    slap_sprites[0].src = "slap1.png";
    slap_sprites[1].src = "slap2.png";
    slap_sprites[2].src = "slap3.png";
    slap_sprites[3].src = "slap4.png";
    slap_sprites[4].src = "slap5.png";
    slap_sprites[5].src = "slap6.png";
    slap_sprites[6].src = "slap7.png";
    slap_sprites[7].src = "slap8.png";
    slap_sprites[8].src = "slap9.png";
    slap_sprites[9].src = "slap10.png";

    var frameno = 0;

    var platforms = [];

    var collides = function(o1, o2) {
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
            'x': new_x,
            'y': new_y,
            'height': obj.height,
            'width': obj.width,
        };
    };
    var under_feet = function(obj) {
        return new_obj_at(obj, obj.x, obj.y + 1);
    };

    var player = {
        'dead': true,
        'facing': 1,
        'height': 120,
        'width': 80,
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
            'player': { 's': function (p) { return player_sprite },               'dx': 0, 'dy': 0   },
            'arm':    { 's': function (p) { return arm_sprite },                  'dx': 0, 'dy': 0   },
            'slap':   { 's': function (p) { return slap_sprites[p.slap_frame] },  'dx': 0, 'dy': -30 },
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
            while (collides_with_platforms(new_obj_at(obj, new_x, obj.y))) {
                obj.xspeed = 0;
                ++new_x;
            }
        }

        //console.log("obj.x = " + obj.x + ", obj.y = " + obj.y);
        obj.x = new_x;
        obj.y = new_y;
        //console.log("obj.x = " + obj.x + ", obj.y = " + obj.y);
    };

    var maybe_slap = function() {
        if (player.slap_frame == -1) {
            if (player.press_slap) {
                player.slap_frame = 0;
                player.press_slap = false;
            }
        } else {
            console.log("slapping");
            ++player.slap_frame;
            if (player.slap_frame == player.slap.length) {
                player.slap_frame = -1;
            }
        }
    };

    var update = function() {
        ++frameno;
        move(player);
        maybe_slap();
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

    var new_platform = function(bx, by) {
        return {
            'x': bx * BLOCK_WIDTH,
            'y': by * BLOCK_HEIGHT,
            'height': BLOCK_HEIGHT,
            'width': BLOCK_WIDTH
        };
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
                        platforms.push(new_platform(column, row));
                        break;
                    case '*':
                        spawn_player(column, row);
                        break;
                    case ' ':
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

        for (var tilei = 0; tilei * bg_layer1.width <= level.width; ++tilei) {
            ctx.drawImage(bg_layer1, tilei * bg_layer1.width - (offset_x / 8), 0, bg_layer1.width, bg_layer1.height);
        }
        for (var tilei = 0; tilei * bg_layer2.width <= level.width; ++tilei) {
            ctx.drawImage(bg_layer2, tilei * bg_layer2.width - (offset_x / 4), 0, bg_layer2.width, bg_layer2.height);
        }
        for (var tilei = 0; tilei * bg_layer3.width <= level.width; ++tilei) {
            ctx.drawImage(bg_layer3, tilei * bg_layer3.width - (offset_x / 2), 0, bg_layer3.width, bg_layer3.height);
        }

        var ds = function(obj, sprite_name) {
            var sinfo  = obj.sprites[sprite_name];
            var sprite = sinfo.s(obj);
            ctx.save();
            if (obj.facing == 1) {
                ctx.scale(1, 1);
                ctx.drawImage(sprite, obj.x - offset_x + sinfo.dx, obj.y + sinfo.dy);
            } else {
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, -1 * (obj.x - offset_x + sinfo.dx) - obj.width, obj.y + sinfo.dy);
            }
            ctx.restore();
        }


        if (! player.dead) {
            //ctx.globalAlpha = 1.0;
            //ctx.strokeStyle = "#00FF00";
            //ctx.strokeRect(player.x - offset_x, player.y, player.width, player.height);
            ds(player, 'player');
            if (player.slap_frame == -1) {
                ds(player, 'arm');
            } else {
                ds(player, 'slap');
                //ctx.strokeStyle = "#FF0000";
                //ctx.strokeRect(player.x + (player.width / 2) + (player.slap[player.slap_frame].dx * player.facing) - offset_x,
                               //player.y + (player.height / 2) + player.slap[player.slap_frame].dy,
                               //player.slap[player.slap_frame].w * player.facing,
                               //player.slap[player.slap_frame].h);
            }
        }

        for (var pi = 0; pi < platforms.length; ++pi) {
            ctx.drawImage(brick_sprite, platforms[pi].x - offset_x, platforms[pi].y, platforms[pi].width, platforms[pi].height);
        }
    };
    var STEP = 1/60;
    var delta = 0;
    var last = window.performance.now();
    var frame = function() {
        var now = window.performance.now();
        delta = delta + Math.min(1, (now - last) / 1000);
        while (delta > STEP) {
            delta = delta - STEP;
            update();
        }
        render();
        last = now;
        requestAnimationFrame(frame);
    };

    $.getJSON("level-1.json", load_level);

    requestAnimationFrame(frame);
})(document.getElementById("pizza-slap"));
