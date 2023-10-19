export class LocalStorageService {
    static setItem(key: string, value: unknown) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static getItem(key: string) {
        const value = localStorage.getItem(key);

        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    }

    static remove(key: string) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }
}
