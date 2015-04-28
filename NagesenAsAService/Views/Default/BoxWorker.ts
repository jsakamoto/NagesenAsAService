module NaaS {
    class WorkerTimer {

        public OnMessage(e: MessageEvent): void {
            //console.dir(e.data);
            switch (e.data.cmd) {
                case 'Start': this.Start(e.data.fps);
                    break;
                case 'Enqueue': this.Enqueue(e.data.data);
                    break;
            }
        }

        private Start(fps: number): void {
            self.setInterval(() => {
                self.postMessage({ cmd: 'Interval' }, null);
            }, 1000 / fps);
        }

        private Enqueue(data: any): void {
            self.postMessage({ cmd: 'Enqueue', data }, null);
        }
    }

    var workerTimer = new WorkerTimer();
    self.addEventListener('message', workerTimer.OnMessage.bind(workerTimer));
}