//configure Makeblock Auriga with MyFirmata (configurable firmate without Onewire, I2C and Scheduler)
var arm = {
    scale: 44,
    orderArr: [],
    currentPos: [],
    servo: {},
    stepper1: {},
    stepper2: {},
    steppersReady: [true, true],
    boardReady: false,
    monitor: function (data) { },
    init: function (five) {
        this.servo = new five.Servo(13);
        this.stepper1 = new five.Stepper({
            type: five.Stepper.TYPE.DRIVER,
            stepsPerRev: 200,
            pins: [10, 11]
        });
        this.stepper2 = new five.Stepper({
            type: five.Stepper.TYPE.DRIVER,
            stepsPerRev: 200,
            pins: [9, 3]
        });
        console.log('arm initialized');
        this.boardReady = true;
    },
    runSteppers: function () {
        if (this.boardReady) {
            var that = this;
            var dir1 = 1, dir2 = 1;
            var steps1 = this.currentPos[0] - this.orderArr[0][0];
            if (steps1 < 0) {
                dir1 = 0
                steps1 *= -1
            }
            var steps2 = this.currentPos[1] - this.orderArr[0][1];
            if (steps2 < 0) {
                dir2 = 0
                steps2 *= -1
            }
            this.steppersReady = [false, false];
            this.stepper1.step({ steps: steps1 * this.scale, direction: dir1 }, function () {
                console.log("Done stepping 1");
                that.steppersReady[0] = true;
                if (that.steppersReady[1] === true) {
                    that.currentPos = that.orderArr[0];
                    that.orderArr.splice(0, 1);
                    that.draw();
                }
            });
            this.stepper2.step({ steps: steps2 * this.scale, direction: dir2 }, function () {
                console.log("Done stepping 2");
                that.steppersReady[1] = true;
                if (that.steppersReady[0] === true) {
                    that.currentPos = that.orderArr[0];
                    that.orderArr.splice(0, 1);
                    that.draw();
                }
            });
        }
    },
    draw: function () {
        if (this.orderArr.length > 0 && this.steppersReady[0] === true && this.steppersReady[1] === true) {
            this.monitor({ stepper1: this.currentPos[0], stepper2: this.currentPos[1], movesWaiting: this.orderArr.length })
            this.runSteppers()
        } else {
            this.monitor({ stepper1: this.currentPos[0], stepper2: this.currentPos[1], movesWaiting: this.orderArr.length })
            console.log('no more orders');
            return 'no orders'
        }
    },
    addOrder: function (angles) {
        this.orderArr.push(angles);
        this.monitor({ stepper1: angles[0], stepper2: angles[1], movesWaiting: this.orderArr.length })
    }
}

module.exports = arm
