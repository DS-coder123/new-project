// === INPUT SYSTEM ===
// Keyboard + Mouse + Gamepad abstraction

import { INPUT } from './config.js';

class InputSystem {
  constructor() {
    this.keys = {};
    this.keysJustPressed = {};
    this.keysJustReleased = {};
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, buttons: {} };
    this._mjp = {};
    this._mjr = {};
    this.gamepad = null;
    this.gamepadAxes = [0,0,0,0];
    this.gamepadButtons = {};
    this.gamepadJustPressed = {};
    this._prevKeys = {};
    this._prevMouse = {};
    this._prevGamepad = {};

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    this._init();
  }

  _init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  _onKeyDown(e) {
    if (!this.keys[e.code]) this.keysJustPressed[e.code] = true;
    this.keys[e.code] = true;
    // Prevent browser shortcuts
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    if (this.keys[e.code]) this.keysJustReleased[e.code] = true;
    this.keys[e.code] = false;
  }

  _onMouseMove(e) {
    this.mouse.dx += e.movementX;
    this.mouse.dy += e.movementY;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  _onMouseDown(e) {
    this.mouse.buttons[e.button] = true;
    this._mjp[e.button] = true;
  }

  _onMouseUp(e) {
    this.mouse.buttons[e.button] = false;
    this._mjr[e.button] = true;
  }

  _onContextMenu(e) { e.preventDefault(); }

  // Called once per frame AFTER all logic has consumed the frame's inputs
  endFrame() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.keysJustPressed = {};
    this.keysJustReleased = {};
    this._mjp = {};
    this._mjr = {};
    this.gamepadJustPressed = {};
    this._prevKeys = { ...this.keys };
    this._prevMouse = { ...this.mouse.buttons };
    this._prevGamepad = { ...this.gamepadButtons };
  }

  updateGamepad() {
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    if (!gp) { this.gamepad = null; return; }
    this.gamepad = gp;
    this.gamepadAxes = [gp.axes[0], gp.axes[1], gp.axes[2], gp.axes[3]];
    const prev = this._prevGamepad;
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed;
      this.gamepadButtons[i] = pressed;
      if (pressed && !prev[i]) this.gamepadJustPressed[i] = true;
    }
  }

  // Convenience queries
  isDown(code) { return !!this.keys[code] || !!this.gamepadButtons[this._gpMap(code)]; }
  justPressed(code) {
    return !!this.keysJustPressed[code] || !!this.gamepadJustPressed[this._gpMap(code)];
  }
  justReleased(code) {
    return !!this.keysJustReleased[code] || false;
  }
  mouseDown(btn) { return !!this.mouse.buttons[btn]; }
  mouseJustPressed(btn) { return !!this._mjp[btn]; }
  mouseJustReleased(btn) { return !!this._mjr[btn]; }

  // Movement input (normalized)
  getMove() {
    let x = 0, z = 0;
    // Keyboard
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) z -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) z += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    // Gamepad left stick
    if (this.gamepad) {
      const gx = this.gamepadAxes[0], gz = this.gamepadAxes[1];
      if (Math.abs(gx) > INPUT.GAMEPAD_DEADZONE) x = gx;
      if (Math.abs(gz) > INPUT.GAMEPAD_DEADZONE) z = gz;
    }
    // Normalize
    const len = Math.sqrt(x*x + z*z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z, magnitude: Math.min(len, 1) };
  }

  isSprinting() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight') ||
           (this.gamepad && this.gamepadButtons[8]); // L-stick click
  }

  jumpPressed() { return this.justPressed('Space') || (this.gamepad && this.gamepadJustPressed[0]); }
  dodgePressed() { return this.justPressed('AltLeft') || this.justPressed('AltRight') ||
                         (this.gamepad && this.gamepadJustPressed[2]); }
  lightAttack() { return this.mouseJustPressed(0) || (this.gamepad && this.gamepadJustPressed[5]); }
  heavyAttack() { return this.mouseJustPressed(2) || (this.gamepad && this.gamepadJustPressed[4]); }
  blockHeld() { return this.isDown('KeyQ') || (this.gamepad && this.gamepadButtons[4]); }
  lockOnPressed() { return this.justPressed('Tab') || (this.gamepad && this.gamepadJustPressed[9]); }
  interactPressed() { return this.justPressed('KeyE') || (this.gamepad && this.gamepadJustPressed[1]); }

  // Echo controls
  recordPressed() { return this.justPressed('KeyR'); }
  spawnEchoPressed(slot) {
    const keys = ['Digit1','Digit2','Digit3','Digit4','KeyF','KeyG','KeyH','KeyJ'];
    return this.justPressed(keys[slot]) || this.justPressed(keys[slot+4]);
  }

  pausePressed() { return this.justPressed('Escape') || (this.gamepad && this.gamepadJustPressed[11]); }

  _gpMap(code) {
    const map = {
      'Space': 0, 'KeyE': 1, 'AltLeft': 2, 'KeyQ': 4,
      'ShiftLeft': 8, 'Tab': 9, 'Escape': 11,
    };
    return map[code] ?? -1;
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('contextmenu', this._onContextMenu);
  }
}

export { InputSystem };
