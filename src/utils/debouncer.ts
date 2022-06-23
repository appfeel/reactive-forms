export class Debouncer {
    private debouncerTimeout: any = 0;

    debounce(fn: () => void, debounceTime = 500) {
        clearTimeout(this.debouncerTimeout);
        this.debouncerTimeout = setTimeout(fn, debounceTime);
    }
}
