interface Window {
    postMessage(data: any): void;
}

namespace NaaS {
    class WorkerTimer {
        private timerID: number;

        public OnMessage(e: MessageEvent): void {
            switch (e.data.cmd) {
                case 'Start': this.Start(e.data.fps);
                    break;
                case 'Stop': this.Stop();
                    break;
                case 'Enqueue': this.Enqueue(e.data.data);
                    break;
            }
        }

        private Start(fps: number): void {
            if (this.timerID == null) {
                this.timerID = self.setInterval(() => {
                    self.postMessage({ cmd: 'Interval' });
                }, 1000 / fps);
            }
        }

        private Stop(): void {
            if (this.timerID != null) {
                self.clearInterval(this.timerID);
                this.timerID = null;
            }
        }

        private Enqueue(data: any): void {
            self.postMessage({ cmd: 'Enqueue', data });
        }
    }

    var workerTimer = new WorkerTimer();
    self.addEventListener('message', workerTimer.OnMessage.bind(workerTimer));
}