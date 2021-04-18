interface grecaptcha {
    ready(callback: Function): void;
    execute(sitekey: string, options: { action: string }): Promise<string>;
}
declare var grecaptcha: grecaptcha | undefined;
