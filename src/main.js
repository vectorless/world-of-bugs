import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HudScene } from './scenes/HudScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { WinScene } from './scenes/WinScene.js';
import { MapScene } from './scenes/MapScene.js';
import { initState } from './state.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#110d08',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1400 },
      debug: false
    }
  },
  input: {
    activePointers: 4,   // multi-touch: hold direction + jump simultaneously
  },
  scene: [BootScene, TitleScene, GameScene, HudScene, PauseScene, WinScene, MapScene]
});

initState(game.registry);
