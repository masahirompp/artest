/// <reference path="../../../typings/bundle.d.ts" />

var $video, $canvas, $context, imageData, detector, posit;
var modelSize = 35.0; //millimeters

/* 画面初期化 */
function onLoad() {

  // dom取得
  $video = document.getElementById("video");
  $canvas = document.getElementById("canvas");
  $context = $canvas.getContext("2d");

  // canvasのサイズを設定
  $canvas.width = 640;
  $canvas.height = 480;

  // webカメラの設定
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (navigator.getUserMedia) {

    // webカメラの映像を取得し、videoのDomに流し込む
    navigator.getUserMedia({ video: true, audio: false }, webCameraSuccessCallback, console.log.bind(console));

    // AR初期化
    detector = new AR.Detector();
    posit = new POS.Posit(modelSize, $canvas.width);

    // ブラウザ描画に合わせてtickを実行
    requestAnimationFrame(tick);
  }
};

/* 描画処理 */
function tick() {
  requestAnimationFrame(tick);

  if ($video.readyState === $video.HAVE_ENOUGH_DATA) {
    snapshot();
    var markers = detector.detect(imageData);
    drawCorners(markers);
  }
};

/* webカメラのストリームをdomに流し込む */
function webCameraSuccessCallback(stream) {
  if (window['URL']) {
    $video.src = window['URL'].createObjectURL(stream);
  } else if ($video.mozSrcObject !== undefined) {
    $video.mozSrcObject = stream;
  } else {
    $video.src = stream;
  }
};

function snapshot() {
  $context.drawImage($video, 0, 0, $canvas.width, $canvas.height);
  imageData = $context.getImageData(0, 0, $canvas.width, $canvas.height);
};

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

function createModel() {
  var object = new THREE.Object3D(),
    geometry = new THREE.SphereGeometry(0.5, 15, 15, Math.PI),
    texture = THREE.ImageUtils.loadTexture("/images/frontainer.png"),
    material = new THREE.MeshBasicMaterial({ map: texture }),
    mesh = new THREE.Mesh(geometry, material);

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
