var scene,renderer,grid,objects,camera,xAxis,yAxis,zAxis,raycaster,lookAtCenter,preX,preY,container,car_model,flag
var cameras=new Array
var pickedObj=null
var mouse = new THREE.Vector2()
var origin=new THREE.Vector3(0,0,0)
var activeViewPort=0
init();
animate();

function init() {
    xAxis=new THREE.Vector3(1,0,0)
    yAxis=new THREE.Vector3(0,1,0)
    zAxis=new THREE.Vector3(0,0,1)

    raycaster = new THREE.Raycaster()
    raycaster.near=5
    raycaster.far=100
    raycaster.params.Points.threshold=1

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    container = document.getElementById("canvas")
    renderer.setSize( container.offsetWidth, container.offsetHeight);
    renderer.autoClear=false
    container.appendChild(renderer.domElement)

    scene = new THREE.Scene()
    LoadCar()

    cameras[0] = new THREE.PerspectiveCamera( 60, container.offsetWidth*0.5 / container.offsetHeight, 0.01, 6000 )
    cameras[0].up.set(0,0,1)
    cameras[0].position.set(-4,0,2)
    lookAtCenter=new Axis(0.2,1)
    lookAtCenter.position.set(0,0,-cameras[0].position.length())
    cameras[0].add(lookAtCenter)
    cameras[0].lookAt(0,0,0)
    cameras[0].zoom=1

    cameras[1] = new THREE.OrthographicCamera( container.offsetWidth/-4, container.offsetWidth/4, container.offsetHeight/2, container.offsetHeight/-2, 0.01, 6000 )
    cameras[1].up.set(1,0,0)
    cameras[1].position.set(0,0,60)
    cameras[1].lookAt(origin)
    cameras[1].zoom=5
    cameras[1].updateProjectionMatrix()

    var light_ambient = new THREE.AmbientLight( 0xffffff )
    var light_directional = new THREE.DirectionalLight( 0xffffff, 0.5 );
    scene.add(light_ambient,light_directional)

    objects=new THREE.Object3D()
    grid=new Grid(1000,200)
    plane=new Plane(1000)
    scene.add(objects,new Axis(2,2),grid)

    activeViewPort=1
    camera=cameras[1]

    window.addEventListener( 'resize', onContainerResize, false );
}

function animate() {
    requestAnimationFrame( animate )
    render()
}

function onContainerResize() {
    var aspect=container.offsetWidth / container.offsetHeight
    cameras[0].aspect = aspect*0.5
    cameras[0].updateProjectionMatrix()
    cameras[1].aspect = aspect*0.5
    cameras[1].updateProjectionMatrix()
    renderer.setPixelRatio(aspect);
    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function render() {
    renderer.clear()
    renderer.setViewport( 0, 0, container.offsetWidth/2, container.offsetHeight)
    renderer.render(scene, cameras[0])
    renderer.setViewport( container.offsetWidth/2, 0, container.offsetWidth/2, container.offsetHeight )
    renderer.render(scene, cameras[1])
}

function pickObj(mouse,camera){
    raycaster.setFromCamera( mouse, camera )
    var intersects = raycaster.intersectObjects(objects.children,true)
    if(intersects.length>0){
        var obj=intersects[0].object.parent
        obj.add(cameras[0])
        cameras[0].position.set(-4,0,2)
        lookAtCenter.position.set(0,0,-cameras[0].position.length())
        cameras[0].lookAt(obj.position)
        return obj
    }
    else
        return null
}

function pickPoint(mouse,camera){
    raycaster.setFromCamera( mouse, camera )
    var intersects = raycaster.intersectObject(plane)
    if(intersects.length>0)
        return intersects[0].point
    return null
}
function setClass(type){
    if(pickedObj!==null){
        pickedObj.material.color=colors[type]
        pickedObj.class=type
    }
}

function currentViewPort(x,y){
    if(x<container.offsetWidth/2)
    {
        mouse.x = 4*x / container.offsetWidth - 1;
        mouse.y = - 2*y / container.offsetHeight + 1
        camera=cameras[0]
        return 0
    }
    else
    {
        mouse.x = ( 4*x-2*container.offsetWidth)/ container.offsetWidth - 1;
        mouse.y = - 2*y / container.offsetHeight + 1
        camera=cameras[1]
        return 1
    }
}
function directionFromMouse(mouse,camera){
    return new THREE.Vector3(mouse.x,mouse.y,0.5).unproject(camera)
}

function Plane(size){
    var geometry = new THREE.PlaneGeometry( size, size );
    geometry.computeBoundingBox()
    var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide,transparent:true,opacity:0} );
    var plane = new THREE.Mesh( geometry, material );
    return plane
}
function Grid(size,divs){
    var obj= new THREE.GridHelper( size, divs, "#828282", "#333333" );
    obj.rotation.x=Math.PI/2
    return obj
}

function Line(vertices,color){
    var geometry=new THREE.Geometry()
    geometry.vertices=vertices
    var material=new THREE.LineBasicMaterial({color:color,linewidth:2})
    var obj=new THREE.Line(geometry,material)
    obj.type="line"
    console.log("new Line",obj.id)
    return obj
}

function LineSegment(p1,p2,materialJson){
    var g=new THREE.Geometry()
    var m=new THREE.LineBasicMaterial(materialJson)
    g.vertices.push(new THREE.Vector3(p1[0],p1[1],p1[2]),new THREE.Vector3(p2[0],p2[1],p2[2]))
    return new THREE.Line(g,m)
}

function LoadCar(position){
    var loader = new THREE.ObjectLoader();
    loader.load(
        "static/res/car.json",
        function ( obj ) {
            car_model=obj
            pickedObj = new Car()
        },
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
        function ( err ) {
            console.error( 'An error happened' );
        }
    );
}

function Flag(radius){
    var obj=new THREE.Object3D()
    var m_cylinder=new THREE.MeshStandardMaterial({color:"#E9967A"})
    var g_cylinder=new THREE.CylinderGeometry(0.05,0.5,2,32)
    obj.cylinder=new THREE.Mesh(g_cylinder,m_cylinder)
    obj.cylinder.rotation.x=Math.PI/2
    obj.cylinder.position.z=1
    var geometry = new THREE.CircleGeometry( radius, 32 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffff00 , opacity:0.2, transparent:true} );
    obj.circle = new THREE.Mesh( geometry, material );
    obj.add(obj.cylinder,obj.circle)
    objects.add(obj)
    return obj
}

function Sphere(){
    var material=new THREE.MeshStandardMaterial({color:"green"})
    var geometry=new THREE.SphereGeometry(0.1,0.1,32,32)
    var obj=new THREE.Mesh(geometry,material)
    return obj
}

function Axis(size,width){
    var line_x=new LineSegment(
        [-size/2, 0, 0],
        [size, 0, 0],
        {color: "red",linewidth:width}
        )
    var line_y = new LineSegment(
        [0, -size/2, 0],
        [0, size, 0],
        {color: "green",linewidth:width}
        )
    var line_z=new LineSegment(
        [0, 0, -size/2],
        [0, 0, size],
        {color: "blue",linewidth:width}
        )
    var obj=new THREE.Object3D()
    obj.add(line_x,line_y,line_z)
    return obj
}

function Car(){
    var obj=car_model.clone()
    obj.type="Car"
    obj.v=0
    obj.vx=0
    obj.vy=0
    obj.a=0
    obj.w=0
    obj.wheel_base=2.7
    obj.ai=true
    obj.step=function(dt){
        dt=dt/1000
        obj.a=Math.max(obj.a,-1)
        obj.a=Math.min(obj.a,1)
        obj.w=Math.max(obj.w,-0.6)
        obj.w=Math.min(obj.w,0.6)
        obj.vx=obj.v*Math.cos(obj.rotation.z)
        obj.vy=obj.v*Math.sin(obj.rotation.z)
        obj.position.x+=obj.vx*dt
        obj.position.y+=obj.vy*dt
        obj.v+=obj.a*dt
        obj.rotation.z+=obj.v/obj.wheel_base*Math.tan(obj.w)*dt
    }
    obj.reset=function(){
        obj.v=0
        obj.vx=0
        obj.vy=0
        obj.a=0
        obj.w=0
        obj.position.x=0
        obj.position.y=0
        obj.rotation.z=0
    }
    obj.add(cameras[0])
    objects.add(obj)
    return obj
}