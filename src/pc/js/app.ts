/// <reference path="../../../typings/bundle.d.ts" />

import Marker = require('./Marker');

var $video, $canvas, $context;
var renderer;
var scene3, scene4;
var camera3, camera4;
var hidarigu = creategu();
var hidaripa = createpa();
var hidarityoki = createtyoki();
var migigu = creategu();
var migipa = createpa();
var migityoki = createtyoki();
var texture;
var step = 0.0;
var modelSize = 35.0; //millimeters

/* 画面初期化 */
function onLoad() {

  // dom取得
  $video = document.getElementById("video");
  $canvas = document.getElementById("canvas");
  $context = $canvas.getContext("2d");

  // styleからcanvasのサイズを設定
  $canvas.width = 640;
  $canvas.height = 480;

  // webカメラの設定
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (navigator.getUserMedia) {

    // webカメラの映像を取得し、videoのDomに流し込む
    navigator.getUserMedia({ video: true, audio: false },
      /* webcamera取得成功時のコールバック */
      function(stream) {
        if (window['URL']) {
          $video.src = window['URL'].createObjectURL(stream);
        } else if ($video.mozSrcObject !== undefined) {
          $video.mozSrcObject = stream;
        } else {
          $video.src = stream;
        }
      },
      /* webカメラ取得失敗時のコールバック */
      function(error) {
        console.log(error);
      });

    // AR初期化
    var detector = new AR.Detector();
    var posit = new POS.Posit(modelSize, $canvas.width);
    createRenderers();
    createScenes();

    // 描画開始
    start(detector, posit);
  }
};

function start(detector, posit) {

  /* 各反復の処理 */
  var result = null;
  function tick() {
    requestAnimationFrame(tick);

    if ($video.readyState === $video.HAVE_ENOUGH_DATA) {
      $context.drawImage($video, 0, 0, $canvas.width, $canvas.height);
      var imageData = $context.getImageData(0, 0, $canvas.width, $canvas.height);
      var markers = detector.detect(imageData);
      drawCorners(markers);
      updateScenes(markers);

      if (markers.length === 2 && !result) {
        result = judge(markers);
        console.log(result);
      }

      render();
    }
  };

  function updateScenes(markers) {
    var corners, corner, pose, i, j;

    if (markers.length > 0) {
      for (i = 0; i < markers.length; i++) {
        corners = markers[i].corners;

        for (j = 0; j < corners.length; ++j) {
          corner = corners[j];

          corner.x = corner.x - ($canvas.width / 2);
          corner.y = ($canvas.height / 2) - corner.y;
        }

        pose = posit.pose(corners);

        if(i == 0){
          updateObject(migipa, pose.bestRotation, pose.bestTranslation);
        }else if(i == 1){
          updateObject(migityoki, pose.bestRotation, pose.bestTranslation);
        }else{
          updateObject(migigu, pose.bestRotation, pose.bestTranslation);
        }

      }
    }

    texture.children[0].material.map.needsUpdate = true;
  };

  // ブラウザ描画に合わせてtickを実行
  requestAnimationFrame(tick);
}


function drawCorners(markers) {
  var corners, corner, i, j;

  $context.lineWidth = 3;
  for (i = 0; i < markers.length; ++i) {
    corners = markers[i].corners;

    $context.strokeStyle = "red";
    $context.beginPath();

    for (j = 0; j < corners.length; ++j) {
      corner = corners[j];
      $context.moveTo(corner.x, corner.y);
      corner = corners[(j + 1) % corners.length];
      $context.lineTo(corner.x, corner.y);
    }
    $context.stroke();
    $context.closePath();

    $context.strokeStyle = "green";
    $context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
  }
};

function createRenderers() {
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff, 1);
  renderer.setSize($canvas.width, $canvas.height);
  document.getElementById("container").appendChild(renderer.domElement);

  scene3 = new THREE.Scene();
  camera3 = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5);
  scene3.add(camera3);

  scene4 = new THREE.Scene();
  camera4 = new THREE.PerspectiveCamera(40, $canvas.width / $canvas.height, 1, 1000);
  scene4.add(camera4);
};

function render() {
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene3, camera3);
  renderer.render(scene4, camera4);
};

function createScenes() {

  texture = createTexture();
  scene3.add(texture);

  var light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1).normalize();
  scene4.add(migigu);
  scene4.add(migityoki);
  scene4.add(migipa);
  scene4.add(hidarigu);
  scene4.add(hidarityoki);
  scene4.add(hidaripa);
  scene4.add(light);
};

function createPlane() {
  var object = new THREE.Object3D(),
    geometry = new THREE.PlaneGeometry(1.0, 1.0, 0.0),
    material = new THREE.MeshNormalMaterial(),
    mesh = new THREE.Mesh(geometry, material);

  object.add(mesh);

  return object;
};

function createTexture() {
  var texture = new THREE.Texture($video),
    object = new THREE.Object3D(),
    geometry = new THREE.PlaneGeometry(1.0, 1.0, 0.0),
    material = new THREE.MeshBasicMaterial({ map: texture, depthTest: false, depthWrite: false }),
    mesh = new THREE.Mesh(geometry, material);

  object.position.z = -1;

  object.add(mesh);

  return object;
};

function updateObject(object, rotation, translation) {
  object.scale.x = modelSize;
  object.scale.y = modelSize;
  object.scale.z = modelSize;

  object.rotation.x = -Math.asin(-rotation[1][2]);
  object.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
  object.rotation.z = Math.atan2(rotation[1][0], rotation[1][1]);
  object.position.x = translation[0];
  object.position.y = translation[1];
  object.position.z = -translation[2];
};

function updatePose(id, error, rotation, translation) {
  var yaw = -Math.atan2(rotation[0][2], rotation[2][2]);
  var pitch = -Math.asin(-rotation[1][2]);
  var roll = Math.atan2(rotation[1][0], rotation[1][1]);

  var d = document.getElementById(id);
  d.innerHTML = " error: " + error
  + "<br/>"
  + " x: " + (translation[0] | 0)
  + " y: " + (translation[1] | 0)
  + " z: " + (translation[2] | 0)
  + "<br/>"
  + " yaw: " + Math.round(-yaw * 180.0 / Math.PI)
  + " pitch: " + Math.round(-pitch * 180.0 / Math.PI)
  + " roll: " + Math.round(roll * 180.0 / Math.PI);
};

window.onload = onLoad;

/* Janken */

function judge(markers: Marker[]) {
  var tmp1 = markers[0].corners.reduce(addCornerX, 0); // marker1の座標
  var tmp2 = markers[1].corners.reduce(addCornerX, 0); // marker2の座標

  var left = tmp1 < tmp2 ? markers[0].id : markers[1].id;　// 画面左側の人の手
  var right = tmp1 > tmp2 ? markers[0].id : markers[1].id; // 画面右側の人の手

  return 'left:' + left + ', right:' + right;
}

function addCornerX(x, corner) {
  return x + corner.x;
}

function creategu(){
    var model = new THREE.Object3D();
    var geometry = new THREE.SphereGeometry(1, 40, 40, Math.PI);
    var material = new THREE.MeshPhongMaterial({ color: 0xfff1cf });
    var cube = new THREE.Mesh( geometry, material );
    model.add( cube );

    var circleGeometry = new THREE.CylinderGeometry( 0.7, 0.7, 1,32 );
    var circle = new THREE.Mesh( circleGeometry, material );
    model.add( circle );
    circle.position.x = -1
    circle.rotation.x = 0
    circle.rotation.y = 0
    circle.rotation.z = 1.6

    return model;
};

function createpa(){
  var model = new THREE.Object3D();
  var geometry = new THREE.SphereGeometry(1, 40, 40, Math.PI);
  var material = new THREE.MeshPhongMaterial({ color: 0xfff1cf });
  var cube = new THREE.Mesh( geometry, material );
  model.add( cube );

  var circleGeometry = new THREE.CylinderGeometry( 0.7, 0.7, 1,32 );
  var circle = new THREE.Mesh( circleGeometry, material );
  model.add( circle );
  circle.position.x = -1
  circle.rotation.x = 0
  circle.rotation.y = 0
  circle.rotation.z = 1.6

  var oyayubiGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 1.3, 32 );
  var oyayubi = new THREE.Mesh( oyayubiGeometry, material );
  model.add( oyayubi );
  oyayubi.position.x = 0.4
  oyayubi.position.y = 0
  oyayubi.position.z = 1.2
  oyayubi.rotation.y = -1.0
  oyayubi.rotation.z = 1.6

  var hitosasiyubiGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 2.3, 32 );
  var hitosasiyubi = new THREE.Mesh( hitosasiyubiGeometry, material );
  model.add( hitosasiyubi );
  hitosasiyubi.position.x = 1
  hitosasiyubi.position.y = 0
  hitosasiyubi.position.z = 0.6
  hitosasiyubi.rotation.y = -0.4
  hitosasiyubi.rotation.z = 1.6

  var nakayubiGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 3, 32 );
  var nakayubi = new THREE.Mesh( nakayubiGeometry, material );
  model.add( nakayubi );
  nakayubi.position.x = 1
  nakayubi.position.y = 0
  nakayubi.position.z = 0
  nakayubi.rotation.z = 1.6

  var kusuriyubiGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 2.3, 32 );
  var kusuriyubi = new THREE.Mesh( kusuriyubiGeometry, material );
  model.add( kusuriyubi );
  kusuriyubi.position.x = 1
  kusuriyubi.position.y = 0
  kusuriyubi.position.z = -0.6
  kusuriyubi.rotation.y = 0.6
  kusuriyubi.rotation.z = 1.6

  var koyubiiGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 2.3, 32 );
  var koyubii = new THREE.Mesh( koyubiiGeometry, material );
  model.add( koyubii );
  koyubii.position.x = 0.2
  koyubii.position.y = 0
  koyubii.position.z = -0.6
  koyubii.rotation.y = 1.0
  koyubii.rotation.z = 1.6

  return model;
}

function createtyoki(){
    var model = new THREE.Object3D();
    var geometry = new THREE.SphereGeometry(1, 40, 40, Math.PI);
    var material = new THREE.MeshPhongMaterial({ color: 0xfff1cf });
    var cube = new THREE.Mesh( geometry, material );
    model.add( cube );

    var circleGeometry = new THREE.CylinderGeometry( 0.7, 0.7, 1,32 );
    var circle = new THREE.Mesh( circleGeometry, material );
    model.add( circle );
    circle.position.x = -1
    circle.rotation.x = 0
    circle.rotation.y = 0
    circle.rotation.z = 1.6

    var hitosasiyubiGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 2.3, 32 );
    var hitosasiyubi = new THREE.Mesh( hitosasiyubiGeometry, material );
    model.add( hitosasiyubi );
    hitosasiyubi.position.x = 1
    hitosasiyubi.position.y = 0
    hitosasiyubi.position.z = 0.6
    hitosasiyubi.rotation.y = -0.4
    hitosasiyubi.rotation.z = 1.6

    var nakayubiGeometry = new THREE.CylinderGeometry( 0.2, 0.2, 3, 32 );
    var nakayubi = new THREE.Mesh( nakayubiGeometry, material );
    model.add( nakayubi );
    nakayubi.position.x = 1
    nakayubi.position.y = 0
    nakayubi.position.z = 0
    nakayubi.rotation.z = 1.6

    return model;
}
