import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

import { KeyDisplay} from '/js/KeyboardUtility.js';
import { Player } from '/js/Player.js';
import { Enemy } from '/js/Enemy.js';
import {Water} from '/Resources/objects/Water2.js';
import * as CANNON from '/js/Helpers/cannon-es.js';
/*
Maze Theme: Stone 
*/
/*
Notes: time is commented out
Change skybox
Water feature
Rain
Thunder sound
Thunder flashes
*/

//Level1 setup
export function Level1() 
{
    //INIT UI ELEMENTS
    var ps = document.getElementById('Pause');
    ps.textContent = "";
    var rt = document.getElementById('Restart');
    ps.textContent = "";
    var lt = document.getElementById('LevelTimer');
    lt.textContent = "";
    const dub = document.getElementById('Win');
    dub.textContent = "";
    const loss = document.getElementById('Lose');
    loss.textContent = "";

    //TIMER
    var timeLeft = 20;
    var str = "Time remaining: " + timeLeft;
    lt.textContent = str;
    
    function decrementSeconds(){
        //timeLeft = timeLeft - 1;
        str = "Time remaining: " + timeLeft;
        lt.textContent = str;
    }
    var intervalID;
    function startLevelTimer() {
        intervalID = setInterval(decrementSeconds, 1000);
    }
    
    function stopLevelTimer(){
        clearInterval(intervalID);
    }

    const world = new CANNON.World(
        {
            gravity : new CANNON.Vec3(0,-9.81,0)
        }
    );

    const timeStep =1/60;
    
    //SCENE
    const scene = new THREE.Scene();

    //creating a boulder
    //loading boulder texture, boulder material properties
    const textureLoader = new THREE.TextureLoader();
    const boulder = textureLoader.load("Resources/textures/boulder/boulder.jpg");
    boulder.wrapS = THREE.RepeatWrapping;
    boulder.wrapT = THREE.RepeatWrapping;
    boulder.repeat.x =1;
    boulder.repeat.y =1;
    boulder.needsUpdate= true;

    //adding the texture to the boulder mesh
    const boulderMaterial = new THREE.MeshBasicMaterial({map:boulder});
    const boulderGeo = new THREE.SphereGeometry(2);
    const boulderMesh = new THREE.Mesh(boulderGeo,boulderMaterial)
    scene.add(boulderMesh);

    //creating sphere for boulder
    const sphereGeo = new THREE.SphereGeometry(2);
    const sphereMat = new THREE.MeshBasicMaterial({
        map:boulder,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo,sphereMat);
    scene.add(sphereMesh);

    //adding physics to the boulder
    const sphereBody = new CANNON.Body(
        {
            mass:10,
            shape: new CANNON.Sphere(2),
            position : new CANNON.Vec3(38,15,45),
            material:boulder
        }
    );
    sphereBody.linearDamping = 0.31;
    world.addBody(sphereBody);

    //RAIN & FLASH FEATURE
    let rain, rainGeo, rainCount =500000, flash;

    rainGeo = new THREE.Geometry();     //geometry of rain drops
    for (let i=0;i<rainCount;i++)
    {
        const raindrop = new THREE.Vector3(
            Math.random()*400-200,
            Math.random()*500-250,
            Math.random()*400-200,
        );
        raindrop.velocity ={};
        raindrop.velocity =0;
        rainGeo.vertices.push(raindrop);
    }
    
    const rainMaterial = new THREE.PointsMaterial({
        color:0xaaaaaa,
        size:0.1,
        transparent:true,
    });

    //combine rain material and rain shape
    rain = new THREE.Points(rainGeo,rainMaterial);
    scene.add(rain);

    //random flash using point light to create lightning
    flash = new THREE.PointLight(0x062d89,30,500,1.7);
    flash.position.set(200,300,100);
    scene.add(flash);

    //Skybox
    var loaderSky = new THREE.CubeTextureLoader();
    //loading images for the skybox
    loaderSky.setPath('./Resources/textures/skyboxes/Level1/'); 
    const texture = loaderSky.load([
        'divine_ft.jpg',
        'divine_bk.jpg',
        'divine_up.jpg',
        'divine_dn.jpg',
        'divine_rt.jpg',
        'divine_lf.jpg',
    ]);
    scene.background = texture;

  
    //CAMERA
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(-30, 20, 40); //for player
    //camera.position.set(0, 200, 0);   //for level editing

    //THUNDER SOUND FEATURE
    let soundThunder;
    function Thunder(){
        const listener = new THREE.AudioListener();
        camera.add(listener);
        
        soundThunder = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load("Resources/media/Thunder.mp3",function(buffer){
            soundThunder.setBuffer(buffer);
            soundThunder.setLoop(true);
            soundThunder.setVolume(0.5);
            soundThunder.play();
        });
    }

    //RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    //CONTROLS
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    /*orbitControls.enableDamping = true; //leave these lines commented and set the position of the player model to (0, 0, 0)
    orbitControls.minDistance = 5;         //to have a full view of the level
    orbitControls.maxDistance = 5;
    orbitControls.enablePan = false;
    orbitControls.maxPolarAngle = Math.PI / 1.9;*/
    orbitControls.update();

    //RAMP
    createRamp();
 
    //THUNDER
    Thunder();

    //LIGHTS
    lighting();

    //FLOOR
    floor();

    //WATER
    waterFeature();

    //ground shape
    const groundGeometry = new THREE.PlaneGeometry( 200, 200, 10, 10 );
    const groundMaterial = new THREE.MeshBasicMaterial( { color: 0xcccccc } );
    const ground = new THREE.Mesh( groundGeometry, groundMaterial );
    ground.rotation.x = Math.PI * - 0.5;
    scene.add( ground );

    //physics for ground
    const groundBody = new CANNON.Body({
        shape: new CANNON.Plane(),
        type: CANNON.Body.STATIC
    });
    world.addBody(groundBody);
    groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);


    //OBJECTS
    var boundingBoxes = [];     //any object that's not the player and needs collision detection should be in here

    //Walls
    //texture
    const marble = textureLoader.load("./resources/textures/walls/marble.jpg");
    const materialWall = new THREE.MeshStandardMaterial(
        {
            map: marble
        })
    wrapAndRepeatTextureWall(materialWall.map);

    //surrounding walls
    wall(new THREE.Vector3(-100, 0, -100), new THREE.Vector3(100, 16, -99));
    wall(new THREE.Vector3(100, 0, -99), new THREE.Vector3(99, 16, 100));
    wall(new THREE.Vector3(99, 0, 100), new THREE.Vector3(-100, 16, 99));
    wall(new THREE.Vector3(-100, 0, 99), new THREE.Vector3(-99, 16, -99));
    
    
    //maze walls
    //outer
    wall(new THREE.Vector3(-50, 0, -50), new THREE.Vector3(50, 10, -49));
    wall(new THREE.Vector3(50, 0, -49), new THREE.Vector3(49, 10, 50));
    wall(new THREE.Vector3(49, 0, 50), new THREE.Vector3(-50, 10, 49));
    wall(new THREE.Vector3(-50, 0, 49), new THREE.Vector3(-49, 10, -49));
    
    //inner
    wall(new THREE.Vector3(-34, 0, -33), new THREE.Vector3(-33, 10, 33));
    wall(new THREE.Vector3(16, 0, 9), new THREE.Vector3(1, 10, 8));
    wall(new THREE.Vector3(33, 0, -33), new THREE.Vector3(32, 10, 50));
    
    wall(new THREE.Vector3(17, 0, -50), new THREE.Vector3(16, 10, 33));

    wall(new THREE.Vector3(0, 0, -33), new THREE.Vector3(1, 10, 9));
    wall(new THREE.Vector3(-33, 0, -33), new THREE.Vector3(0, 10, -32));
    wall(new THREE.Vector3(-17, 0, -17), new THREE.Vector3(-16, 10, 33));

    wall(new THREE.Vector3(-17, 0, 33), new THREE.Vector3(0, 10, 32));
    
    
    //Win Circle
    //mesh
    const geoCircle = new THREE.CircleGeometry(5, 32 );
    const matCircle = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
    const meshCircle = new THREE.Mesh( geoCircle, matCircle );
    meshCircle.rotation.x = -Math.PI / 2;
    meshCircle.position.set(8.5, 0.05, 0);
    meshCircle.receiveShadow = true;
    scene.add(meshCircle);

    //bounding sphere
    const bsCircle = new THREE.Sphere(meshCircle.position, 5);

    //TORCHES
    var torchModel;

    const managerTorch = new THREE.LoadingManager();
    managerTorch.onLoad = function() { //when torch model has been loaded. Can clone a bunch of torches in here

        torch(new THREE.Vector3( -40, 5, -48.5));
        //can't exceed 16 torches
    }

    const loaderTorch = new FBXLoader(managerTorch);
    loaderTorch.setPath('./Resources/models/Torch/');
    loaderTorch.load('Torch.fbx', (fbx) => {
      const model = fbx;
      fbx.scale.setScalar(0.02);

      torchModel = model;
    });

    //MODEL WITH ANIMATIONS
    var player;

    const playerMaterial = new CANNON.Material("material");
    const playerBodyShape = new CANNON.Box(new CANNON.Vec3(1,0.5,1.5));
    const playerBody = new CANNON.Body({mass:1,material:playerMaterial,shape:playerBodyShape});
    playerBody.position = new CANNON.Vec3(40,0,40);
    world.addBody(playerBody);

    const loaderPlayer = new FBXLoader();
    loaderPlayer.setPath('./Resources/models/Rosales/');
    loaderPlayer.load('Kachujin_G_Rosales.fbx', (fbx) => {
      //load main model
      const model = fbx;
      fbx.scale.setScalar(0.01);
      fbx.traverse(c => {
        c.castShadow = true;
      });
      model.position.copy(playerBody.position);
      model.quaternion.copy(playerBody.quaternion);

      model.rotation.y = -Math.PI;
      model.position.set(40, 0, 30);
       
      scene.add(model);


      //load animations, store in map and add to mixer
      const mixer = new THREE.AnimationMixer(model);
      const animationsMap = new Map();

      const manager = new THREE.LoadingManager();
      manager.onLoad = function() { //when all animations have been loaded
          //pass model, mixer and animations to character controller
          player = new Player(model, mixer, animationsMap, orbitControls, camera, boundingBoxes);
          
          startLevelTimer();
      }


      //load animations
      const loaderAnimations = new FBXLoader(manager);
      loaderAnimations.setPath('./Resources/models/Rosales/');
      loaderAnimations.load('Walk.fbx', (a) => { OnLoad('Walk', a); });
      loaderAnimations.load('Run.fbx', (a) => { OnLoad('Run', a); });
      loaderAnimations.load('Idle.fbx', (a) => { OnLoad('Idle', a); });
      loaderAnimations.load('Punch.fbx', (a) => { OnLoad('Punch', a); });
      loaderAnimations.load('OnHit.fbx', (a) => { OnLoad('OnHit', a); });
      loaderAnimations.load('Death.fbx', (a) => { OnLoad('Death', a); });

      
      const OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const animAction = mixer.clipAction(clip);
        
        //make death animation not loop when its done
        if (animName == 'Death') {
            animAction.loop = THREE.LoopOnce;
            animAction.clampWhenFinished=true;
        }

        animationsMap.set(animName, animAction);
      };

    });

    //PLAYER CONTROLS
    const keysPressed = {'w': false, 'a': false, 's': false, 'd': false, 'q': false, 'e': false};
    const keyDisplayQueue = new KeyDisplay();
    document.addEventListener('keydown', (event) => {
        keyDisplayQueue.down(event.key)                 //just used for displaying
        keysPressed[event.key.toLowerCase()] = true     //used for actual calculations
        
    }, false);
    document.addEventListener('keyup', (event) => {
        keyDisplayQueue.up(event.key);                  //just used for displaying
        keysPressed[event.key.toLowerCase()] = false    //used for actual calculations

    }, false);


    //PAUSE CONTROLS AND CLOCK INITIALIZATION
    const clock = new THREE.Clock();
    var paused = false;
    document.addEventListener('keypress', (event) => {
        if (event.key.toLowerCase()=='p') {
            paused = !paused;

            if(paused) {
                stopLevelTimer();
                clock.stop();
                ps.textContent="PAUSED";
                
            }
            else {
                startLevelTimer();
                clock.start();
                ps.textContent="";
            }
        }
        
    }, false);


    //WHAT HAPPENS ON EACH UPDATE
    function animate() {
        world.step(timeStep); 

        if (!paused) {
            var mixerUpdateDelta = clock.getDelta();
        
            if (player) {
                player.update(mixerUpdateDelta, keysPressed);
                var bbPlayer = player.bbPlayer;

                if(bbPlayer.intersectsSphere(bsCircle)) {                        //if player gets to circle, they win and are invincible
                    stopLevelTimer();
                    dub.textContent = "YOU WIN!";

                    player.win = true;

                }

               

                if (timeLeft<=0 || player.death==true) {                         //if time runs out they die
                    stopLevelTimer();
                    player.death=true; //if timer runs out need to do this

                    loss.textContent = 'YOU DIED';
                }
            }
        }
    
        ////physics for spherre
        sphereMesh.position.copy(sphereBody.position);
        sphereMesh.quaternion.copy(sphereBody.quaternion);

        //physics for boulder mesh
        boulderMesh.position.copy(sphereBody.position);
        boulderMesh.quaternion.copy(sphereBody.quaternion);

        //physics for ground
        ground.position.copy(groundBody.position);
        ground.quaternion.copy(groundBody.quaternion);


        //simulating rain and gravity, rain partticles randomize
        rainGeo.vertices.forEach(p => {
            p.velocity -=0.1+ Math.random()*0.1;
            p.y += p.velocity;
            if (p.y<-200){
                p.y =200;
                p.velocity =0;
            }
        });

        rainGeo.verticesNeedUpdate =true;       //rain animation

        //flash and thundering
        if(Math.random()<0.93 ||flash.power >100)
        {
            if (flash.power <100){
                flash.position.set(Math.random()*400,300+Math.random()*200,100);
            }
            flash.power = 50 + Math.random()*500;
        }

        orbitControls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    document.body.appendChild(renderer.domElement);
    animate();



    //RESIZE HANDLER
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onWindowResize);

    

    //THE FLOOR IS MADE OUT OF FLOOR
    function floor() {

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load( 'Resources/textures/floors/gravel.jpg', function ( map ) {

            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.anisotropy = 16;
            map.repeat.set( 4, 4 );
            groundMaterial.map = map;
            groundMaterial.needsUpdate = true;

        });

        //camera.position.set( 0, 25, 0 );
        //camera.lookAt( scene.position );

    }

    //Water feature
    function waterFeature()
    {
        //water geometry shape
        const waterGeometry = new THREE.CircleGeometry( 6, 32 );

        //flow map used to navigate the direction on water flow
        const flowMap = textureLoader.load( 'Resources/textures/water/flowmap.jpeg' );

        //properties for water feature
        const water1 = new Water( waterGeometry, {
            scale: 1,
            color:0x14c4ff,
            textureWidth: 512,
            textureHeight: 512,
            flowMap: flowMap,

        } );

        //setting featurre position//setting featurre position
        water1.position.y = 0.2;
        water1.position.x = -8;
        water1.position.z = 23;
        water1.rotation.x = Math.PI * - 0.5;

        const water2 = new Water( waterGeometry, {
            scale: 1,
            color:0x14c4ff,
            textureWidth: 512,
            textureHeight: 512,
            flowMap: flowMap,

        } );

        water2.position.y = 0.2;
        water2.position.x = 40;
        water2.position.z = -40;
        water2.rotation.x = Math.PI * - 0.5;
        
        scene.add( water1 );
        scene.add( water2 );
    }

     //create ramp
     function createRamp(){
        const rampShape = new CANNON.Box(new CANNON.Vec3(5,1,10));  //create a box for the ramp
        const rampBody = new CANNON.Body({mass:0, shape:rampShape});

        rampBody.position = new CANNON.Vec3(40,1,40);
        rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/12); //rotating the box at an angle to create ramp
        world.addBody(rampBody);

        const rampMat = new THREE.MeshBasicMaterial({color:0xffffff});
        const rampGeo = new THREE.BoxGeometry(10,2,20);     //ramp position
        const rampMesh = new THREE.Mesh(rampGeo,rampMat);
        scene.add(rampMesh);

        //physics for ramp
        rampMesh.position.copy(rampBody.position);
        rampMesh.quaternion.copy(rampBody.quaternion);

    }

    function wrapAndRepeatTextureFloor (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = map.repeat.y = 20;
    }
    scene.add(camera);
    
    //LIGHTS
    function lighting() {
        //ambient light
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));

        //directional light
        const dirLight = new THREE.DirectionalLight(0xDD8B41, 0.8);
        dirLight.position.set(-120, 80, 0);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = - 50;
        dirLight.shadow.camera.left = - 50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);        

    }
    

    //MORE LIGHTS
    function torch(lightPos) {
        //mesh
        var model = torchModel.clone();
        model.position.set(lightPos.x, lightPos.y-1, lightPos.z);   //struggling to generalize z so the light is always inside the torch
        //model.position.set(0, 4, 30);
        scene.add(model);

        //light
        const light = new THREE.PointLight( 'orange', 2, 20, 2);
        light.castShadow = true;
        light.position.copy(lightPos);
        scene.add(light); 
    }


    //WALL MAKER
    function wall(startPoint, endPoint) {
        const wallSize = new THREE.Vector3(Math.abs(endPoint.x-startPoint.x), Math.abs(endPoint.y-startPoint.y), Math.abs(endPoint.z-startPoint.z));
        const wallPos = new THREE.Vector3((endPoint.x+startPoint.x)/2, (endPoint.y+startPoint.y)/2, (endPoint.z+startPoint.z)/2);


        const geometry = new THREE.BoxGeometry(wallSize.x, wallSize.y, wallSize.z);
        //const materialWall = new THREE.MeshBasicMaterial( { color: 0x404040} ); //placeholder if no texture
        
        //mesh
        const meshWall = new THREE.Mesh(geometry, materialWall);
        meshWall.position.copy(wallPos);
        meshWall.castShadow = true;
        meshWall.receiveShadow = true;
        scene.add(meshWall);

        //bounding box
        const bbWall = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        bbWall.setFromObject(meshWall);

        boundingBoxes.push({mesh: meshWall, boundingBox: bbWall});
    }


    function wrapAndRepeatTextureWall (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = 3;
        map.repeat.y = 1;
    }
    function wrapAndRepeatTextureWall (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = 3;
        map.repeat.y = 3;
    }
}