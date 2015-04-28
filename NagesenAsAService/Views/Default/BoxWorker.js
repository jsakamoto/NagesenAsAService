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
                case 'Enqueue':
                    this.Enqueue(e.data.data);
                    break;
            }
        };
        WorkerTimer.prototype.Start = function (fps) {
            self.setInterval(function () {
                self.postMessage({ cmd: 'Interval' }, null);
            }, 1000 / fps);
        };
        WorkerTimer.prototype.Enqueue = function (data) {
            self.postMessage({ cmd: 'Enqueue', data: data }, null);
        };
        return WorkerTimer;
    })();
    var workerTimer = new WorkerTimer();
    self.addEventListener('message', workerTimer.OnMessage.bind(workerTimer));
})(NaaS || (NaaS = {}));
//# sourceMappingURL=BoxWorker.js.map