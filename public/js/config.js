const socket = io();

let scene, camera, renderer;
let myPlayer = null;
let players = new Map();
let currentUser = null;
let token = null;
let keys = {};
let jumpStartY = null;
let maxJumpHeight = 0;
let velY = 0;
let isJumping = false;
