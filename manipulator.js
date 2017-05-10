var vektor = require('vektor'),
  h = vektor.homog,
  v = vektor.vector,
  r = vektor.rotate;
var five = require('johnny-five');
var board = new five.Board({
  repl: false,
});
var arm = require('./Arm');
var armData = {};

module.exports = function (server) {
  var io = require('socket.io')(server);

  var LINK_LENGTHS = [84, 103],
    MAX_LENGTH = 200,
    ORIGIN = new v([250, 250, 0]),
    endEff,
    currentAngleSlider1 = 90,
    currentAngleSlider2 = 0;

  io.on('connection', function (socket) {
    var deg2rad = Math.PI / 180, rad2deg = 180 / Math.PI;
    var angles = [90 * deg2rad, 0 * deg2rad];

    socket.emit('init', forwardKinematics(angles, ORIGIN)); // forward kinematics

    board.on('ready', function () {
      arm.init(five);
      arm.monitor = function (data) {
        armData = data;
        socket.emit('orderArrLength', armData.movesWaiting);
        socket.emit('draw', forwardKinematics([armData.stepper1*deg2rad, armData.stepper2*deg2rad]))
      }
    });

    socket.on('slider1', function (val) {
      currentAngleSlider1 = val;
      if (arm.orderArr > 0) {
        arm.addOrder([+val - 90, (arm.orderArr[arm.orderArr.length - 1][1])])
      } else {
        arm.addOrder([+val - 90, currentAngleSlider2])
      }
      angles[0] = val * deg2rad;
    });

    socket.on('slider2', function (val) {
      currentAngleSlider2 = val;
      if (arm.orderArr > 0) {
        arm.addOrder([(arm.orderArr[arm.orderArr.length - 1][0]), val])
      } else {
        arm.addOrder([currentAngleSlider1 - 90, val])
      }
      angles[1] = val * deg2rad;
    });

    socket.on('click', inverseKinematics);

    socket.on('moveArm', function () {
      arm.draw();
    })

    socket.on('click', function (pt) {
      var anglesInDegrees = [angles[0] * rad2deg, angles[1] * rad2deg];
      arm.addOrder(anglesInDegrees);
      socket.emit('orderArrLength', arm.orderArr.length);
      socket.emit('setSlide', angles);
    })

    socket.on('reset', function () {
      arm.orderArr = [[0, 0]];
      arm.draw();
      console.log('rest');
    })

    function inverseKinematics(pt) { // inverse kinematics
      var
        x = ORIGIN.x - pt.x,
        y = ORIGIN.y - pt.y,
        x_sq = x * x,
        y_sq = y * y,
        l1 = LINK_LENGTHS[0],
        l2 = LINK_LENGTHS[1],
        l1_sq = l1 * l1,
        l2_sq = l2 * l2,
        th1, th2, cth2, sth2;

      // ignore any attempts to move the arm outside of its own physical boundaries
      if (Math.sqrt(x_sq + y_sq) > MAX_LENGTH || y < 0) {
        return false;
      }

      // value of th2 from http://www.cescg.org/CESCG-2002/LBarinka/paper.pdf
      th2 = angles[1] = Math.acos((x_sq + y_sq - l1_sq - l2_sq) / (2 * l1 * l2));

      cth2 = Math.cos(th2);
      sth2 = Math.sin(th2);

      // value of th1 from www.site.uottawa.ca/~petriu/generalrobotics.org-ppp-Kinematics_final.ppt‎
      th1 = angles[0] = Math.asin((y * (l1 + l2 * cth2) - x * l2 * sth2) / (x_sq + y_sq));

    }

    function forwardKinematics(angles) { // forward kinematics
      var joints = [],
        Tx = h(r.RotX(Math.PI), ORIGIN),
        Tzx = Tx.dot(h(r.RotZ(Math.PI), 0)),
        Txzx = Tzx.dot(h(r.RotX(Math.PI), 0)),
        T1 = Txzx.dot(h(r.RotZ(angles[0]), 0)),
        T2 = T1.dot(h(r.RotZ(angles[1]), new v([LINK_LENGTHS[0], 0, 0]))),
        T3 = T2.dot(h(0, new v([LINK_LENGTHS[1], 0, 0]))),
        endEff = T3.getPoint();
      joints.push(T1.getPoint(), T2.getPoint(), endEff);
      return joints;
    }
  });
};