import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';

import { KeyDisplay} from '/js/KeyboardUtility.js';
import { Player } from '/js/Player.js';
import { Enemy } from '/js/Enemy.js';
import {Water} from '/Resources/objects/Water2.js';
import * as CANNON from '/js/Helpers/cannon-es.js';

/*
Maze Theme: Ancient Caves
*/

/*
Notes: time is commented out
Rotating skybox using a cube
Made wall height short to be able to see the dynamic skybox
Would like to add flash light feature
*/

//Level2 setup
export function Level2() {
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

    //for flashlight
    let spotLight;


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
    const sphereMat = new THREE.MeshBasicMaterial(
        {
        map:boulder,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo,sphereMat);
    scene.add(sphereMesh);

    //adding physics to the boulder
    const sphereBody = new CANNON.Body(
        {
            mass:30,
            shape: new CANNON.Sphere(2),
            position : new CANNON.Vec3(38,15,45),
            material:boulder
        }
    );
    sphereBody.linearDamping = 0.31;
    world.addBody(sphereBody);



    //Skybox

    //Used cube geometry to be able to rotate the skybox
    var skyGeo = new THREE.CubeGeometry(1000 ,1000 ,1000);

    //loading images for the skybox
    var skyMat =[

        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("Resources/textures/skyboxes/Level2/wrath_ft.jpg"),side:THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("Resources/textures/skyboxes/Level2/wrath_bk.jpg"),side:THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("Resources/textures/skyboxes/Level2/wrath_up.jpg"),side:THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("Resources/textures/skyboxes/Level2/wrath_dn.jpg"),side:THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("Resources/textures/skyboxes/Level2/wrath_rt.jpg"),side:THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("Resources/textures/skyboxes/Level2/wrath_lf.jpg"),side:THREE.DoubleSide}),
    ];
    var skyMaterial = new THREE.MeshFaceMaterial(skyMat);
    var sky = new THREE.Mesh(skyGeo,skyMaterial);
    scene.add(sky);

  
    //CAMERA
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    //camera.position.set(25,10,25);

    //camera.position.set(-30, 20, 40); //for player
    camera.position.set(0, 200, 0);   //for level editing

    //sound
    

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

//Water
    waterFeature();

    //LIGHTS
    lighting();

    //FLOOR
    floor();

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
    groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);    //rotating the ground

    //OBJECTS
    var boundingBoxes = [];     //any object that's not the player and needs collision detection should be in here

    //Walls
    //texture
    const ancient = textureLoader.load("./resources/textures/walls/ancient.jpg");
    const materialWall = new THREE.MeshStandardMaterial(
        {
            map: ancient
        })
    wrapAndRepeatTextureWall(materialWall.map);

    //surrounding walls
    wall(new THREE.Vector3(-100, 0, -100), new THREE.Vector3(100, 10, -99));
    wall(new THREE.Vector3(100, 0, -99), new THREE.Vector3(99, 10, 100));
    wall(new THREE.Vector3(99, 0, 100), new THREE.Vector3(-100, 10, 99));
    wall(new THREE.Vector3(-100, 0, 99), new THREE.Vector3(-99, 10, -99));
    
    
    // //maze walls
    // //outer
    wall(new THREE.Vector3(-50, 0, -50), new THREE.Vector3(50, 5, -49));
    wall(new THREE.Vector3(50, 0, -49), new THREE.Vector3(49,5, 50));
    wall(new THREE.Vector3(49, 0, 50), new THREE.Vector3(-50, 5, 49));
    wall(new THREE.Vector3(-50, 0, 49), new THREE.Vector3(-49, 5, -49));
    
    // //inner

    //vertical
    
    wall(new THREE.Vector3(35, 0, -40), new THREE.Vector3(34, 5, 40));

    wall(new THREE.Vector3(20, 0, -25), new THREE.Vector3(19, 5, 20));
    wall(new THREE.Vector3(20, 0, 40), new THREE.Vector3(19, 5, 50));

    wall(new THREE.Vector3(5, 0, 20), new THREE.Vector3(4, 5, 31));

    wall(new THREE.Vector3(-10, 0, -5), new THREE.Vector3(-11, 5, 20));

    wall(new THREE.Vector3(-25, 0, 20), new THREE.Vector3(-26, 5, 40));
    wall(new THREE.Vector3(-25, 0, -40), new THREE.Vector3(-26, 5, -5));

    wall(new THREE.Vector3(-37, 0, 30), new THREE.Vector3(-38, 5, 40));
    wall(new THREE.Vector3(-37, 0, -40), new THREE.Vector3(-38, 5, -30));

    //horizontal walls

    wall(new THREE.Vector3(-25, 0, -40), new THREE.Vector3(35, 5, -39));

    //zig zag
    wall(new THREE.Vector3(50, 0, -25), new THREE.Vector3(40, 5, -24));
    wall(new THREE.Vector3(30, 0, -5), new THREE.Vector3(40, 5, -4));
    wall(new THREE.Vector3(50, 0, 10), new THREE.Vector3(40, 5, 11));
    wall(new THREE.Vector3(30, 0, 30), new THREE.Vector3(40, 5, 31));

    wall(new THREE.Vector3(20, 0, -25), new THREE.Vector3(10, 5, -24));
    wall(new THREE.Vector3(-25, 0, -25), new THREE.Vector3(-15, 5, -24));

    wall(new THREE.Vector3(-25, 0, -5), new THREE.Vector3(-36, 5, -4));
    wall(new THREE.Vector3(-10, 0, -5), new THREE.Vector3(34, 5, -4));

    wall(new THREE.Vector3(-36, 0, 20), new THREE.Vector3(-10, 5, 21));

    wall(new THREE.Vector3(35, 0, 30), new THREE.Vector3(5, 5, 31));

    wall(new THREE.Vector3(-5, 0, 40), new THREE.Vector3(20, 5, 41));
    wall(new THREE.Vector3(-38, 0, 40), new THREE.Vector3(-25, 5, 41));    


    
    //Win Circle
    //mesh
    const geoCircle = new THREE.CircleGeometry(5, 32 );
    const matCircle = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
    const meshCircle = new THREE.Mesh( geoCircle, matCircle );
    meshCircle.rotation.x = -Math.PI / 2;
    meshCircle.position.set(27, 0.05, 4);
    meshCircle.receiveShadow = true;
    scene.add(meshCircle);

    //bounding sphere
    const bsCircle = new THREE.Sphere(meshCircle.position, 5);

    //TORCHES
    var torchModel;

    const managerTorch = new THREE.LoadingManager();
    managerTorch.onLoad = function() {               //when torch model has been loaded. Can clone a bunch of torches in here
        torch(new THREE.Vector3( -40, 5, -48.5));
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

    const loaderPlayer = new FBXLoader();
    loaderPlayer.setPath('./Resources/models/Rosales/');
    loaderPlayer.load('Kachujin_G_Rosales.fbx', (fbx) => {
      //load main model
      const model = fbx;
      fbx.scale.setScalar(0.01);
      fbx.traverse(c => {
        c.castShadow = true;
      });

      model.rotation.y = -Math.PI;
      model.position.set(40, 0, 40);
       
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

        if (event.key.toLowerCase()=='r') {
            location.reload();
        }
        
    }, false);



        //WHAT HAPPENS ON EACH UPDATE
        function animate
        () {    
                world.step(timeStep); 
                sky.rotation.y += 0.002;
         
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
        //physics for sphere to update
        sphereMesh.position.copy(sphereBody.position);
        sphereMesh.quaternion.copy(sphereBody.quaternion);

            //physics for boulder material to update
        boulderMesh.position.copy(sphereBody.position);
        boulderMesh.quaternion.copy(sphereBody.quaternion);

        //physics for ground
        ground.position.copy(groundBody.position);
        ground.quaternion.copy(groundBody.quaternion);
        
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
        textureLoader.load( 'Resources/textures/floors/clay.jpg', function ( map ) {

            map.wrapS = THREE.RepeatWrapping;
            map.wrapT = THREE.RepeatWrapping;
            map.anisotropy = 16;
            map.repeat.set( 4, 4 );
            groundMaterial.map = map;
            groundMaterial.needsUpdate = true;

        });

    }

    //Water feature
    function waterFeature() {
        //water geometry shape
        const waterGeometry = new THREE.BoxGeometry( 20, 19, 1 );

        //flow map used to navigate the direction on water flow
        const flowMap = textureLoader.load( 'Resources/textures/flowmap.jpeg' );

        //properties for water feature
        const water = new Water( waterGeometry, {
            scale: 1,
            color:0x09F9F0,
            textureWidth: 512,
            textureHeight: 512,
            flowMap: flowMap,

        } );

        //setting featurre position
        water.position.y = 0.2;
        water.position.x = -15;
        water.position.z = 31;
        water.rotation.x = Math.PI * - 0.5;
        
        scene.add( water );
    }

    function wrapAndRepeatTextureFloor (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = map.repeat.y = 20;
    }
    scene.add(camera);
    
    //LIGHTS
    function lighting() {
        //ambient light
        scene.add(new THREE.AmbientLight(0xffff00, 0.4));

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

         //spotlight

        spotLight = new THREE.SpotLight( 0xffffff);
        spotLight.intensity = 5; 
        spotLight.angle = Math.PI/8;
        spotLight.penumbra = 0.1;
        spotLight.decay = 20;
        spotLight.distance = 500;
        
        // spotLight.castShadow = true;
        // // spotLight.shadow.mapSize.width = 20;
        // // spotLight.shadow.mapSize.height = 20;
        // // spotLight.shadow.camera.near = 1;
        // // spotLight.shadow.camera.far = 0.1;
        // // spotLight.shadow.camera.fov = 3;
        // // spotLight.shadow.focus = 1;

        // // spotLight.shadow.camera.near = 10;
        // // spotLight.shadow.camera.far = 1;
        // // spotLight.shadow.camera.fov = 1;

        //spotLight.position.set(0,0,0);
        // spotLight.position.copy(camera.position);
        // scene.add(camera); 

        // spotLight.target.position.set( 0, 0, 1);
       
        // //controls = new PointerLockControls( camera, document.body );
      
    //     camera.add(spotLight);
    //     camera.add(spotLight.target);
    //     //scene.add(camera);
    //    //scene.add(spotLight.target);

        // const group = new THREE.Group();
        // group.add(camera);
        // group.add(spotLight);
        // scene.add(group);
        //scene.add(spotLight.target);
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
        map.repeat.x = 4;
        map.repeat.y = 1;
    }
    function wrapAndRepeatTextureWall (map) {
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.x = 4;
        map.repeat.y = 1;
    }
}
