namespace NaaS {
    class WorkerTimer {
        private timerID: number | null = null;

        public onMessage(e: MessageEvent): void {
            switch (e.data.cmd) {
                case 'Start': this.start(e.data.fps);
                    break;
                case 'Stop': this.stop();
                    break;
                case 'Enqueue': this.enqueue(e.data.args);
                    break;
            }
        }

        private start(fps: number): void {
            if (this.timerID === null) {
                this.timerID = self.setInterval(() => {
                    (self as any).postMessage({ cmd: 'Interval' });
                }, 1000 / fps);
            }
        }

        private stop(): void {
            if (this.timerID !== null) {
                self.clearInterval(this.timerID);
                this.timerID = null;
            }
        }

        private enqueue(args: ThrowCoinEventArgs): void {
            (self as any).postMessage({ cmd: 'Enqueue', args });
        }
    }

    var workerTimer = new WorkerTimer();
    self.addEventListener('message', e => workerTimer.onMessage(e));
}