const GAME_SPEED = 1.0;
const RUN_SPEED = 3.5;
const TERMINAL_V = 10.0;
const WORLD_SIZE = 2400;
const KEY_UP = 38;
const KEY_SPACE = 32;
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_A = 65;
const KEY_D = 68;
const KEY_W = 87;
const KEY_S = 83;
const OBJ_ABOVE = 1;
const OBJ_BELOW = 2;
const OBJ_LEFT = 3;
const OBJ_RIGHT = 4;
const GROUNDED_TIMER = 500;
const BOUNCE_FACTOR = 2;
const MOTION_LEFT = 0;
const MOTION_RIGHT = 1;
var GRAPHICS = {};
var AUDIO = {};

var update_interval;
var posX, posY = 200;
var current_speed = 3.0;
var jump_height = 20.0;
var vertialV = 1.0;
var bOnSurface = true;
var bCanJump = true;
var bAttemptingToWarp = false;
var stage, mario, coin_counter, stats_pane_coin, debug;
var keysDown = [];
var collidables = [];
var elevators = [];
var coins = [];
var hitables = [];
var coinboxes = [];
var mushroomboxes = [];
var warppipes = [];
var mushrooms = [];
var theta = 0;
var hoizontal_motion_direction = MOTION_RIGHT;
var collideCount = 0;

function update() {

    //gravity
    if (!bOnSurface) {
        posY += vertialV/2.0;
    }
    vertialV = vertialV + 1.0;
    if (vertialV > TERMINAL_V) vertialV = TERMINAL_V;

    if (bOnSurface && keysDown.length === 0) {
        vertialV = 0.0;
        setSprite(mario, hoizontal_motion_direction === MOTION_RIGHT ? GRAPHICS.standing_right : GRAPHICS.standing_left);
    }

    bAttemptingToWarp = !(keysDown.indexOf(KEY_DOWN) < 0 && keysDown.indexOf(KEY_S) < 0);

    //falling to death
    if (!bAttemptingToWarp && mario.offsetTop > stage.offsetHeight) {
        clearTimeout(update_interval);
        AUDIO.died();
        AUDIO.overworld().pause();
        setTimeout(function () {
            window.location.reload();
        }, 3000 / GAME_SPEED);
        return true;
    }

	//move character based on what keys are pressed
	for (key in keysDown){
		switch (keysDown[key]){
			case KEY_RIGHT:
			case KEY_D:
				posX += current_speed;
				if (stage.scrollLeft < WORLD_SIZE)
                    stage.scrollLeft = mario.offsetLeft - stage.offsetWidth / 2 + mario.offsetWidth / 2;
                if (bOnSurface)
                    setSprite(mario, GRAPHICS.running_right);
				hoizontal_motion_direction = MOTION_RIGHT;
				break;
            case KEY_UP:
            case KEY_SPACE:
            case KEY_W:
				if (bOnSurface && bCanJump){
                    bCanJump = false;
                    AUDIO.jump();
					setTimeout(function(){bCanJump=true;},GROUNDED_TIMER);
					vertialV = -jump_height;
					posY -= jump_height;
					bOnSurface = false;
                    setSprite(mario, hoizontal_motion_direction===MOTION_RIGHT ? GRAPHICS.jumping_right : GRAPHICS.jumping_left);
				}
				break;
			case KEY_LEFT:
			case KEY_A:
				if (bOnSurface)
                    setSprite(mario, GRAPHICS.running_left);
				posX -= current_speed;
                stage.scrollLeft = mario.offsetLeft - stage.offsetWidth / 2 + mario.offsetWidth/2;
				hoizontal_motion_direction = MOTION_LEFT;
				break;
			case KEY_DOWN:
			case KEY_S:
                if (bOnSurface)
                    bAttemptingToWarp = true;
				break;
			default:
		}
	}
	
	//update movable objects. elevators, bullets.
	theta++;
    for (e in elevators) {
        let _ePos = 165 + 45 * Math.sin(theta / 80);
        elevators[e].style.top = _ePos + "px";
	}
	
	//correct character position if hes colliding with objects
	collisionAdjust();
	
    mario.style.left = posX + "px";
    mario.style.top = posY + "px";
}

function isObtainable(obj){
	if (mushrooms.indexOf(obj) > -1){
		removeFromCollection(mushrooms,obj);
        animateFormChange(mario, mario.className, "mario_big", 8);
        AUDIO.powerup();
		return true;
	}
		
	if (coins.indexOf(obj) > -1){
		removeFromCollection(coins,obj);
		removeFromCollection(collidables, obj);
		animatePoints(obj,200);
		stage.removeChild(obj);
		
        takeCoin();
		return true;
	}
	return false;
}

function playHitAnimation(obj){
	if (hitables.indexOf(obj) > -1){
		let currY = obj.offsetTop;
		obj.style.top = currY-5+"px";
        setTimeout(function () { obj.style.top = currY + "px"; }, 200 / GAME_SPEED);
        AUDIO.bump();
	}
	if (coinboxes.indexOf(obj) > -1){
		let c = document.createElement("img");
		stage.appendChild(c);
        setSprite(c, GRAPHICS.coin);
		c.style.position = "absolute";
		c.style.top = obj.offsetTop + "px";
		c.style.left = obj.offsetLeft + obj.offsetWidth/2 - c.offsetWidth/2 + "px";
		obj.style.zIndex = 1000;
		
        takeCoin();

		animateUp(c, 5,1,function(){stage.removeChild(c);});
	}
	if (mushroomboxes.indexOf(obj) > -1){
		removeFromCollection(mushroomboxes, obj);
		let c = document.createElement("img");
		stage.appendChild(c);
        setSprite(c, GRAPHICS.mushroom_head);
		c.style.position = "absolute";
		c.style.top = obj.offsetTop + "px";
		c.style.left = obj.offsetLeft + obj.offsetWidth/2 - c.offsetWidth/2 + "px";
		obj.style.zIndex = 1000;
		mushrooms.push(c);

        AUDIO.mushroom();
		collidables.push(c);
		coins.push(c);
		
		animateUp(c, 3.4,1.0);
	}
}

function animatePoints(obj,pointsValue){
	let p = document.createElement("div");
	p.className = "points";
	stage.appendChild(p);
    p.innerHTML = pointsValue;
	p.style.top = obj.offsetTop + "px";
    p.style.left = obj.offsetLeft + "px";
	animateUp(p, 4, 1.0, function(){
						stage.removeChild(p);
					});
}

function animateFormChange(obj, originalClassName, newClassName, times){
	if (times === 0) return;
	obj.className = times % 2 === 0 ? originalClassName : newClassName;
    setTimeout(function () { animateFormChange(obj, originalClassName, newClassName, --times); }, 100 / GAME_SPEED);
}

function animateUp(obj,amount,incY,endCallBack){
	if (incY >= amount) {
        if (endCallBack) endCallBack();
		return;
	}
	obj.style.top = obj.offsetTop - incY + "px";
    setTimeout(function () { animateUp(obj, amount, incY + 0.2, endCallBack); }, 30 / GAME_SPEED);
}

function animateDown(obj,amount,incY,endCallBack){
	if (incY >= amount) {
		endCallBack();
		return;
	}
	obj.style.top = obj.offsetTop + incY + "px";
    setTimeout(function () { animateDown(obj, amount, incY + 1, endCallBack); }, 70 / GAME_SPEED);
}

function animateHorizontal(obj,incX){
	obj.style.left = obj.offsetLeft + incX + "px";
    setTimeout(function () { animateHorizontal(obj, incX); }, 30 / GAME_SPEED);
}

function isWarpPipe(obj){
	if (warppipes.indexOf(obj) > -1 && bAttemptingToWarp){
        clearTimeout(update_interval);
        mario.className = mario.className + " mario_warping";
        AUDIO.pipe();
		animateDown(mario,15,1,function(){
			window.location.reload();						  
		});
	}
}

function takeCoin(){
    coin_counter.innerHTML = parseInt(coin_counter.innerHTML) + 1;	
    AUDIO.coin();
}

function collisionAdjust() {
    if (posX < 0) posX = 0;
	if (posX + mario.offsetWidth > WORLD_SIZE) posX = WORLD_SIZE - mario.offsetWidth;
	
	bOnSurface = false;
	collideCount = 0;
    let isFalling = vertialV > 1.0;

	for (c in collidables){
			if (!isCloseToMario(collidables[c])) continue;
			collideCount++;
			
        switch (getSideColliding(collidables[c])) {
                case OBJ_BELOW:
                    if (!isFalling) playHitAnimation(collidables[c]);
                    if (isObtainable(collidables[c])) break;
                    if (bOnSurface) break;
                    posY = collidables[c].offsetTop + collidables[c].offsetHeight;
                    if (!isFalling) vertialV = 0.0;
                    bOnSurface = true;
                    break;
				case OBJ_ABOVE:
					if (isObtainable(collidables[c])) break;
					posY = collidables[c].offsetTop-mario.offsetHeight;
                    bOnSurface = true;
                    vertialV = 0.0;
					if (isWarpPipe(collidables[c])) break;
                    current_speed = RUN_SPEED;
					break;
				case OBJ_LEFT:
					if (isObtainable(collidables[c])) break;
					posX = collidables[c].offsetLeft-mario.offsetWidth;
					if (!bCanJump)
                        current_speed = 0.8;
					break;
				case OBJ_RIGHT:
					if (isObtainable(collidables[c])) break;
					posX = collidables[c].offsetLeft+collidables[c].offsetWidth;
					if (!bCanJump)
                        current_speed = 0.8;
					break;

				default:
			}
	}
}

function isCloseToMario(obj){
	return Math.abs(obj.offsetLeft - mario.offsetLeft) < 100 && Math.abs(obj.offsetTop - mario.offsetTop) < 100;
}

function getSideColliding(obj){
	if (posY + mario.offsetHeight > obj.offsetTop && 
		posX + mario.offsetWidth / 2 > obj.offsetLeft &&
		posX + mario.offsetWidth / 2 < obj.offsetLeft + obj.offsetWidth &&
		posY < obj.offsetTop &&
		posY + mario.offsetHeight < obj.offsetTop + obj.offsetHeight)
        return OBJ_ABOVE;
    if (posY > obj.offsetTop &&
        posY < obj.offsetTop + obj.offsetHeight &&
        posX + mario.offsetWidth / 2 > obj.offsetLeft &&
        posX + mario.offsetWidth / 2 < obj.offsetLeft + obj.offsetWidth)
        return OBJ_BELOW;
	if (posX + mario.offsetWidth > obj.offsetLeft && 
		posY + mario.offsetHeight / 2 < obj.offsetTop + obj.offsetHeight && 
		posX < obj.offsetLeft && 
		posY + mario.offsetHeight / 2 > obj.offsetTop)
		return OBJ_LEFT;
	if (posX < obj.offsetLeft + obj.offsetWidth && 
		posX + mario.offsetWidth > obj.offsetLeft + obj.offsetWidth &&
		posY + mario.offsetHeight / 2 > obj.offsetTop &&
		posY + mario.offsetHeight / 2 < obj.offsetTop + obj.offsetHeight)
		return OBJ_RIGHT;

	return 0;
}

function setSprite(obj, src) {
    if (obj.src.indexOf(src) < 0) {
        obj.src = src;
    }
}

function hideSprite(obj) {
    obj.className = obj.className + " hide";
}

function renderWorld(oncomplete){
    stage.style.backgroundImage = "url('" + GRAPHICS.clouds + "')";
    setSprite(stats_pane_coin, GRAPHICS.coin);

    //the floor of the entire level
	let ground_bricks = [];
    for (let i = 0; i < 24; i++){
        let gU = dropUnit(null, GRAPHICS.ground_brick, i * 100, stage.offsetHeight - 32);
        ground_bricks.push(gU);
        if ([3,18,19].indexOf(i) > -1) {
            hideSprite(gU);
        } else {
            collidables.push(ground_bricks[i]);
        }

    }

    let p1 = dropUnit(ground_bricks[0], GRAPHICS.ground_pipe);
    collidables.push(p1);

    dropUnit(ground_bricks[1], GRAPHICS.bush,50);
    dropUnit(ground_bricks[5], GRAPHICS.bush);
    dropUnit(ground_bricks[7], GRAPHICS.bush);
    dropUnit(ground_bricks[10], GRAPHICS.bush);
    dropUnit(ground_bricks[15], GRAPHICS.bush);

    let cb1 = dropUnit(ground_bricks[14], GRAPHICS.question_block, null, -64);
    coinboxes.push(cb1);
    hitables.push(cb1);
    collidables.push(cb1);

    let b4 = dropUnit(ground_bricks[9], GRAPHICS.ground_pipe);
    let b5 = dropUnit(ground_bricks[8], GRAPHICS.question_block, -30, -150);

	hitables.push(b5);
    coinboxes.push(b5);

    let bb1;
    for (let i = 0; i<3; i++){
		bb1 = dropUnit(ground_bricks[5], GRAPHICS.block_brick,i*32,-64);
		hitables.push(bb1);
		collidables.push(bb1);
		if (i===1){
			mushroomboxes.push(bb1);
		}
	}
    for (let i = 0; i<3; i++){
        bb1 = dropUnit(ground_bricks[7], GRAPHICS.block_brick, i * 32, -64);
		hitables.push(bb1);
		collidables.push(bb1);
	}
    let b6 = dropUnit(ground_bricks[10], GRAPHICS.moving_block);
    let b7 = dropUnit(ground_bricks[17], GRAPHICS.moving_block,120);
    let mu1 = dropUnit(ground_bricks[17], GRAPHICS.moving_block,220,50);

	elevators.push(b6);
    elevators.push(b7);
    elevators.push(mu1);

    collidables.push(b6);
    collidables.push(b7);
    collidables.push(mu1);

    for (let i = 0; i<3; i++){
        let c1 = dropUnit(ground_bricks[7], GRAPHICS.coin, i*32,-10);
		collidables.push(c1);
		coins.push(c1);
	}
    for (let i = 0; i<4; i++){
        let c1 = dropUnit(ground_bricks[6], GRAPHICS.coin, i*32+5, -100-i*32);
		collidables.push(c1);
		coins.push(c1);
	}
    for (let i = 0; i<3; i++){
        let c1 = dropUnit(ground_bricks[10], GRAPHICS.coin, i*32, -232);
		collidables.push(c1);
		coins.push(c1);
	}
		
    for (let i = 1; i<4; i++){
		if (i === 3) {
			bb1 = dropUnit(ground_bricks[15], GRAPHICS.question_block,i*32,-i*32);
			mushroomboxes.push(bb1);
		}
		else bb1 = dropUnit(ground_bricks[15], GRAPHICS.block_brick,i*32,-2*32);
		hitables.push(bb1);
		collidables.push(bb1);
			
        let c1 = dropUnit(b7, GRAPHICS.coin, 60,-i*32-140);
		collidables.push(c1);
		coins.push(c1);
	}

    //end of level stairs
    for (let j = 0; j < 9; j++){
        for (let i = 0; i<11; i++){
			if (i <= j) continue;
            let c1 = dropUnit(ground_bricks[20], GRAPHICS.small_brick, i*20, -j*20);
			collidables.push(c1);
		}
	}
		
    let b8 = dropUnit(ground_bricks[12], GRAPHICS.ground_pipe);
	collidables.push(b8);
		
    let b9 = dropUnit(ground_bricks[23], GRAPHICS.ground_pipe);
	warppipes.push(b9);
	collidables.push(b9);
		
	collidables.push(b4);
    collidables.push(b5);

    oncomplete();
}

function dropUnit(referenceSprite ,graphic_src ,left, bottom){
    let new_unit = document.createElement("img");
    stage.appendChild(new_unit);
    setSprite(new_unit, graphic_src);
    new_unit.style.position = "absolute";
    new_unit.style.top = (referenceSprite !== null ? referenceSprite.offsetTop-new_unit.clientHeight + (bottom||0) : bottom) + "px";
    new_unit.style.left = (referenceSprite !== null ? referenceSprite.offsetLeft + (left||0) : left) + "px";
    return new_unit;
}

function removeFromCollection(arr,obj){
	if (arr.indexOf(obj) > -1) arr.splice(arr.indexOf(obj),1);
}

function onkeyDown(e){
    let evt = window.event || e;
    let keyunicode=e.charCode || e.keyCode;
	if (evt.preventDefault)
		evt.preventDefault();
	else{
		evt.returnValue = false;
    }
    if (keysDown.indexOf(keyunicode) > -1) return;

	keysDown.push(keyunicode);
    AUDIO.overworld();
	return false;
}

function onKeyUp(e){
    let evt = window.event || e;
    let keyunicode=e.charCode || e.keyCode;
	removeFromCollection(keysDown, keyunicode);
}

function debugUpdate(){
    let str =  "Collision space: " + collideCount + "\n";
    str += "Collidable: " + collidables.length + "\n";
    str += "Keys: " + keysDown.join().toString() + "\n";
    //str += "Mario: " + mario.src.replace(/^.*[\\\/]/, '').replace('.gif','') + "\n";
	debug.value = str;
}

function run() {
    posX = mario.offsetLeft;
    posY = mario.offsetTop;
    update_interval = setInterval(update, 1000 / (60 * GAME_SPEED));

    setInterval(debugUpdate, 100);

    $(this).keydown(onkeyDown);
    $(this).keyup(onKeyUp);


}

$(document).ready(function(){
	
	debug = document.getElementById('debug');
    stage = document.getElementById('stage');
    mario = document.getElementById('sprite');
    coin_counter = document.getElementById('coin_counter');
    stats_pane_coin = document.getElementById('stats_pane_coin');

    $("audio").each(function() {
        AUDIO[this.id.replace('audio_', '')] = (function (a) {
            return function () {
                if (a.duration > 0 && !a.paused) {
                    if (a.id === "audio_coin") AUDIO.coin2();
                    else if (a.id === "audio_coin2") AUDIO.coin3();
                    else if (a.id === "audio_coin3") AUDIO.coin4();
                } else {
                    a.play();
                }
                return a;
            };
        })(this);
    });

    let _spriteCount = $(".sprite").length;
    let _spriteLoaded = 0;
    $(".sprite").each(function (i, s) {
        let preload = new Image();
        preload.src = s.value;
        preload.onload = function () {
            GRAPHICS[s.id] = this.src;
            if (++_spriteLoaded === _spriteCount) {
                renderWorld(run);
            }
        };
    });
});
		