import Marker = require('./Marker');

function judge(markers: Marker[]) {
  var tmp1 = markers[0].corners.reduce(addCornerX, 0); // marker1の座標
  var tmp2 = markers[1].corners.reduce(addCornerX, 0); // marker2の座標

  var left = tmp1 < tmp2 ? markers[0].id : markers[1].id;　// 画面左側の人の手
  var right = tmp1 > tmp2 ? markers[0].id : markers[1].id; // 画面右側の人の手

  console.log('left:' + left, + ', right:' + right);
}

function addCornerX(x, corner) {
  return x + corner.x;
}
