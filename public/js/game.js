function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000033);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 30);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight2.position.set(-20, 20, -20);
    scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0xffff00, 2, 100);
    pointLight3.position.set(0, 30, 0);
    scene.add(pointLight3);
    
    const platformGeometry = new THREE.BoxGeometry(100, 2, 100);
    const platformMaterial = new THREE.MeshPhongMaterial({
        color: 0x0a0a0a,
        emissive: 0x00ffff,
        emissiveIntensity: 0.3
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0;
    scene.add(platform);
    
    const gridHelper = new THREE.GridHelper(100, 20, 0x00ffff, 0x00ffff);
    gridHelper.position.y = 1.1;
    scene.add(gridHelper);
    
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createPlayerMesh(playerData, isMe) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({
        color: isMe ? 0x00ffff : 0xff00ff,
        emissive: isMe ? 0x00ffff : 0xff00ff,
        emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.crown = null;
    if (playerData.isFirst) {
        const crownGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
        const crownMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 2;
        mesh.add(crown);
        mesh.crown = crown;
    }
    
    mesh.position.set(playerData.x, playerData.y, playerData.z);
    return mesh;
}

function updatePlayerCrown(player, isFirst) {
    if (player.data.isFirst !== isFirst) {
        player.data.isFirst = isFirst;
        if (player.mesh.crown) {
            player.mesh.remove(player.mesh.crown);
            player.mesh.crown = null;
        }
        if (isFirst) {
            const crownGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
            const crownMaterial = new THREE.MeshPhongMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.8
            });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = 2;
            player.mesh.add(crown);
            player.mesh.crown = crown;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!scene || !camera || !renderer) return;
    
    if (myPlayer) {
        const speed = 0.5;
        if (keys['w']) myPlayer.data.z -= speed;
        if (keys['s']) myPlayer.data.z += speed;
        if (keys['a']) myPlayer.data.x -= speed;
        if (keys['d']) myPlayer.data.x += speed;
        
        if (keys[' '] && !isJumping && myPlayer.data.y <= 2) {
            jumpStartY = myPlayer.data.y;
            maxJumpHeight = myPlayer.data.y;
            velY = currentUser.jump_power / 10;
            isJumping = true;
        }
        
        velY -= 0.3;
        myPlayer.data.y += velY;
        
        if (isJumping && myPlayer.data.y > maxJumpHeight) {
            maxJumpHeight = myPlayer.data.y;
        }
        
        if (myPlayer.data.y <= 2) {
            myPlayer.data.y = 2;
            if (isJumping && jumpStartY !== null) {
                const jumpHeight = maxJumpHeight - jumpStartY;
                if (jumpHeight > 0) {
                    socket.emit('jumpLand', jumpHeight);
                }
                jumpStartY = null;
                maxJumpHeight = 0;
            }
            velY = 0;
            isJumping = false;
        }
        
        myPlayer.mesh.position.set(myPlayer.data.x, myPlayer.data.y, myPlayer.data.z);
        
        if (keys['w'] || keys['s'] || keys['a'] || keys['d']) {
            myPlayer.mesh.rotation.y += 0.05;
        }
        
        camera.position.set(
            myPlayer.data.x,
            myPlayer.data.y + 15,
            myPlayer.data.z + 25
        );
        camera.lookAt(myPlayer.data.x, myPlayer.data.y, myPlayer.data.z);
        
        socket.emit('move', {
            x: myPlayer.data.x,
            y: myPlayer.data.y,
            z: myPlayer.data.z
        });
    }
    
    renderer.render(scene, camera);
}

animate();
