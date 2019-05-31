var SIZE = 1;
var N = 750;
var G = 6.674E-2;
var DT = 1/60;
var V = .1*N;

var canvas = $('canvas')[0];

var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
var composer = new THREE.EffectComposer(renderer);
var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
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

    camera.position.z = 100;
    scene.background = new THREE.Color().setHSL(0, 0, 0.05);

    // Create Sphere Data
    spheres = [], radii = [], mass = [], velocity = [];
    for (var i=0; i<N; i++){
        var radius = Math.max(0.5, -Math.log(Math.random()));
        var color = new THREE.Color().setHSL(Math.random(), .5, .6)

        sphere = Sphere(radius, color);
        sphere.position.set((Math.random()*2-1) * SIZE,
                            (Math.random()*2-1) * SIZE,
                            (Math.random()*2-1) * SIZE)
        
        spheres.push(sphere); scene.add(sphere);
        radii.push(radius);
        mass.push((4./3.) * Math.PI * Math.pow(radius, 3));
        velocity.push(new THREE.Vector3(
            V * (Math.random()*2-1),
            V * (Math.random()*2-1),
            V * (Math.random()*2-1)));
        
    }

    // Simulate Gravity
    var update = function() {
        // Calculate Velocities
        for (var i=0; i<N; i++) {
            // Add force to center of 'world'
            var force = spheres[i].position.clone().multiplyScalar(-spheres[i].position.length()).normalize().multiplyScalar(N*mass[i]/10);

            for (var j=0; j<N; j++) {
                if (i!=j){
                    var radius = spheres[i].position.distanceTo(spheres[j].position);
                    var direction = spheres[j].position.clone().sub(spheres[i].position).normalize();
                    force.add(direction.clone().multiplyScalar(mass[i] * mass[j] / radius));
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
    composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(1024, 102), .25, .75, .25));

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
        Math.min(Math.max(Math.round(radius*6), 6), 32),
        Math.min(Math.max(Math.round(radius*3), 3), 16))
    var material = new THREE.MeshBasicMaterial({color: color});
    return new THREE.Mesh(geometry, material);
}