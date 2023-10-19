import { LocalStorageService } from './local-storage.service';

enum ProModeStoreValue {
    ON = 'ON',
    OFF = 'OFF',
}

export class SwapProModeLocalStorageService {
    private static _key = 'swapProMode';

    private static _defaultValue = ProModeStoreValue.ON;

    // eslint-disable-next-line max-len
    private static _value: ProModeStoreValue = LocalStorageService.getItem(SwapProModeLocalStorageService._key) || this._defaultValue;

    private static set value(value: ProModeStoreValue) {
        this._value = value;
        LocalStorageService.setItem(SwapProModeLocalStorageService._key, value);
    }

    static off() {
        this.value = ProModeStoreValue.OFF;
        return !SwapProModeLocalStorageService.isOn;
    }

    static on() {
        this.value = ProModeStoreValue.ON;
        return SwapProModeLocalStorageService.isOn;
    }

    static get isOn() {
        return this._value !== ProModeStoreValue.OFF;
    }

    static clear() {
        this._value = this._defaultValue;
        LocalStorageService.remove(this._key);
        return SwapProModeLocalStorageService.isOn;
    }
}
