/// <reference path="../../../typings/bundle.d.ts" />

var $video, $canvas, $context, posit, detector;
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
    $context.drawImage($video, 0, 0, $canvas.width, $canvas.height); // 画面にwebカメラの映像を描画
    var imageData = $context.getImageData(0, 0, $canvas.width, $canvas.height); // 描画したイメージデータを取得
    var markers = detector.detect(imageData); // イメージデータを解析。マーカを取得。
    drawToMarkers(markers); // マーカーに対し描画を行う
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

/* マーカーに描画する */
function drawToMarkers(markers) {

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

window.onload = onLoad;
