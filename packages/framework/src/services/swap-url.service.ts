/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SwapProModeLocalStorageService } from './swap-pro-mode-local-storage.service';

export enum SwapUrlMode {
    PRO = 'pro',
    PRO_INVERTED = 'pro-inverted',
    SIMPLE = 'simple',
}

export class SwapUrlService {
    private static _modeKey = 'mode';

    private static _tokensKey = 'tokens';

    private static _tokenSeparator = '%';

    private static _currentMode?: SwapUrlMode | null;

    private static _currentTokens = '';

    private static _modeChangedSubscribers: VoidFunction[] = [];

    static get modeUrlKey() {
        return this._modeKey;
    }

    static get tokensUrlKey() {
        return this._tokensKey;
    }

    static get tokensUrlSeparator() {
        return this._tokenSeparator;
    }

    static setProMode() {
        this.mode = SwapUrlMode.PRO;
    }

    static setProInvertedMode() {
        this.mode = SwapUrlMode.PRO_INVERTED;
    }

    static setSimpleMode() {
        this.mode = SwapUrlMode.SIMPLE;
    }

    static onModeChanged(cb: VoidFunction) {
        SwapUrlService._modeChangedSubscribers.push(cb);
        return () => {
            SwapUrlService._modeChangedSubscribers.filter((item) => item !== cb);
        };
    }

    static resetState() {
        SwapUrlService._currentTokens = '';
        SwapUrlService._currentMode = undefined;
        SwapUrlService._modeChangedSubscribers = [];
    }

    static get isProMode() {
        return this.mode !== SwapUrlMode.SIMPLE;
    }

    static get isProInvertedMode() {
        return this.mode === SwapUrlMode.PRO_INVERTED;
    }

    static set tokens(data: [string, string]) {
        this._currentTokens = data.join(this._tokenSeparator);
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set(this._tokensKey, this._currentTokens);
        this.updateUrlSearchParams(searchParams);
    }

    static get tokens(): [string, string] {
        if (this._currentTokens) {
            const [tokenA = '', tokenB = ''] = this._currentTokens.split(this._tokenSeparator);
            return [tokenA, tokenB];
        }
        const searchParams = new URLSearchParams(window.location.search);
        const [tokenA = '', tokenB = ''] = (searchParams.get(this._tokensKey) || '').split(this._tokenSeparator);

        return [tokenA, tokenB];
    }

    static generateSearchParams(data: [string, string]) {
        this._currentTokens = data.join(this._tokenSeparator);
        // eslint-disable-next-line max-len
        this._currentMode = SwapProModeLocalStorageService.isOn ? SwapUrlMode.PRO : SwapUrlMode.SIMPLE;
        const searchParams = new URLSearchParams();
        searchParams.set(this._modeKey, this._currentMode!);
        searchParams.set(this._tokensKey, this._currentTokens);
        searchParams.sort();
        const result = searchParams.toString();
        return result ? `?${result}` : '';
    }

    private static changeCurrentModeAndTriggerSubscribers(mode: SwapUrlMode | null | undefined) {
        if ((!mode && !this._currentMode) || mode === this._currentMode) return;

        this._currentMode = mode;
        this._modeChangedSubscribers.forEach((item) => item());
    }

    private static get mode() {
        const currentMode = this._currentMode;

        if (currentMode) {
            return currentMode;
        }

        const params = new URLSearchParams(window.location.search);

        let newMode = params.get(SwapUrlService._modeKey) as SwapUrlMode;

        if (!newMode) {
            newMode = SwapProModeLocalStorageService.isOn ? SwapUrlMode.PRO : SwapUrlMode.SIMPLE;
        }

        if (newMode === SwapUrlMode.SIMPLE && SwapProModeLocalStorageService.isOn) {
            SwapProModeLocalStorageService.off();
        }

        this.mode = newMode;

        return newMode;
    }

    private static set mode(mode: SwapUrlMode) {
        this.changeCurrentModeAndTriggerSubscribers(mode);
        const searchParams = new URLSearchParams(window.location.search);
        SwapProModeLocalStorageService[this._currentMode === SwapUrlMode.SIMPLE ? 'off' : 'on']();
        searchParams.set(this._modeKey, this._currentMode!);
        this.updateUrlSearchParams(searchParams);
    }

    private static updateUrlSearchParams(searchParams: URLSearchParams) {
        searchParams.sort();
        const search = searchParams.toString();
        const newUrl = `${window.location.origin}${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
    }
}
