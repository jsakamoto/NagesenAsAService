var NaaS;
(function (NaaS) {
    var WorkerTimer = (function () {
        function WorkerTimer() {
        }
        WorkerTimer.prototype.OnMessage = function (e) {
            switch (e.data.cmd) {
                case 'Start':
                    this.Start(e.data.fps);
                    break;
                case 'Stop':
                    this.Stop();
                    break;
                case 'Enqueue':
                    this.Enqueue(e.data.data);
                    break;
            }
        };
        WorkerTimer.prototype.Start = function (fps) {
            if (this.timerID == null) {
                this.timerID = self.setInterval(function () {
                    self.postMessage({ cmd: 'Interval' });
                }, 1000 / fps);
            }
        };
        WorkerTimer.prototype.Stop = function () {
            if (this.timerID != null) {
                self.clearInterval(this.timerID);
                this.timerID = null;
            }
        };
        WorkerTimer.prototype.Enqueue = function (data) {
            self.postMessage({ cmd: 'Enqueue', data: data });
        };
        return WorkerTimer;
    }());
    var workerTimer = new WorkerTimer();
    self.addEventListener('message', workerTimer.OnMessage.bind(workerTimer));
})(NaaS || (NaaS = {}));
//# sourceMappingURL=BoxWorker.js.map