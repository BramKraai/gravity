var DISTANCE = 200;
var VELOCITY = 20;
var N = 350;
var G = 6.674E-2;
var DT = 1/60;

var canvas = $('canvas')[0];

var renderer = new THREE.WebGLRenderer({canvas: canvas});
var composer = new THREE.EffectComposer(renderer);
var camera = new THREE.PerspectiveCamera(100, 1, 0.1, 10000);
var controls = new THREE.OrbitControls(camera);
var scene = new THREE.Scene();

$(window).resize(function(){
    var width = window.innerWidth, height = window.innerHeight;
    canvas.width = width; canvas.height = height;
    renderer.setSize(width, height);
    composer.setSize(width*2, height*2);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

$(function(){
    $(window).trigger('resize');

    controls.enablePan = false;
    controls.enableDamping = true;
    controls.autoRotateSpeed = .5;
    controls.autoRotate = true;

    camera.position.z = 200;
    scene.background = new THREE.Color().setHSL(0, 0, 0.05);

    // Create Sphere Data
    spheres = [], radii = [], mass = [], velocity = [];
    for (var i=0; i<N; i++){
        var radius = Math.min(Math.max(1-Math.log(Math.random()), 1), 10);
        var color = new THREE.Color().setHSL(Math.random(), .1*Math.random()+.45, .1*Math.random()+.55)

        sphere = Sphere(radius, color);

        // Set Starting Location
        var phi = 2*Math.random()*Math.PI;
        var theta = Math.acos(2*Math.random()-1);
        var r = Math.sqrt(Math.random()) * DISTANCE;

        sphere.position.set(
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.sin(theta) * Math.sin(phi),
            r * Math.cos(theta)
        );

        // Set Starting Velocity
        var phi = 2*Math.random()*Math.PI;
        var theta = Math.acos(2*Math.random()-1);
        var r = Math.sqrt(Math.random()) * VELOCITY;

        velocity.push(new THREE.Vector3(
            r * Math.sin(theta) * Math.cos(phi),
            r * Math.sin(theta) * Math.sin(phi),
            r * Math.cos(theta)
        ));
        
        spheres.push(sphere); scene.add(sphere);
        radii.push(radius); mass.push((4./3.) * Math.PI * Math.pow(radius, 3));  
    }

    // Simulate Gravity
    var update = function() {
        // Calculate Velocities
        for (var i=0; i<N; i++) {
            // Add force to center of 'world'
            var force = spheres[i].position.clone().multiplyScalar(-spheres[i].position.length()).normalize().multiplyScalar(N*mass[i]/10);

            for (var j=0; j<N; j++) {
                if (i!=j){

                    var diff = spheres[i].position.clone().sub(spheres[j].position);
                    var distance = diff.length();
                    var direction = diff.normalize();
                    
                    // Collision
                    if (i < j && distance <= radii[i] + radii[j]) {
                        
                        // Reset Spheres to their Collision Boundary
                        // (Prevent intersections and glitches because of it)
                        var offset = (distance - (radii[i] + radii[j])) / 2;
                        spheres[i].position.sub(direction.clone().multiplyScalar(offset));
                        spheres[j].position.add(direction.clone().multiplyScalar(offset));
                        
                        // Calculate Outgoing Velocity
                        var ai = velocity[i].dot(direction);
                        var aj = velocity[j].dot(direction);
                        var optimized = 2.0 * (ai - aj) / (mass[i] + mass[j]);
                        velocity[i].sub(direction.clone().multiplyScalar(optimized * mass[j]));
                        velocity[j].add(direction.clone().multiplyScalar(optimized * mass[i]));
                    }

                    // Gravity
                    force.add(direction.clone().multiplyScalar(- mass[i] * mass[j] / distance)); 
                }
            }
            velocity[i].add(force.multiplyScalar(G / mass[i] * DT));
        }

        // Apply Velocities
        for (var i=0; i<N; i++){
            spheres[i].position.add(velocity[i].clone().multiplyScalar(DT));
        }
    }

    // Effects
    composer.addPass(new THREE.RenderPass(scene, camera));
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(32, 32), .25, .75, .25));

    // Animation Loop
    var animate = function() {
        requestAnimationFrame(animate);
        update();
        controls.update();
        composer.render();
    }
    animate();
});

var Sphere = function(radius, color) {
    var geometry = new THREE.SphereGeometry(radius,
        Math.min(Math.max(Math.round(radius*8), 8), 32),
        Math.min(Math.max(Math.round(radius*4), 4), 16))
    var material = new THREE.MeshBasicMaterial({color: color});
    return new THREE.Mesh(geometry, material);
}