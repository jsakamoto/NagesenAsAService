"use strict";
var NaaS;
(function (NaaS) {
    class WorkerTimer {
        constructor() {
            this.timerID = null;
        }
        onMessage(e) {
            switch (e.data.cmd) {
                case 'Start':
                    this.start(e.data.fps);
                    break;
                case 'Stop':
                    this.stop();
                    break;
                case 'Enqueue':
                    this.enqueue(e.data.args);
                    break;
            }
        }
        start(fps) {
            if (this.timerID === null) {
                this.timerID = self.setInterval(() => {
                    self.postMessage({ cmd: 'Interval' });
                }, 1000 / fps);
            }
        }
        stop() {
            if (this.timerID !== null) {
                self.clearInterval(this.timerID);
                this.timerID = null;
            }
        }
        enqueue(args) {
            self.postMessage({ cmd: 'Enqueue', args });
        }
    }
    var workerTimer = new WorkerTimer();
    self.addEventListener('message', e => workerTimer.onMessage(e));
})(NaaS || (NaaS = {}));
