/* eslint-disable max-len */
import type {
    DatafeedConfiguration, IDatafeedChartApi, IExternalDatafeed,
    LibrarySymbolInfo, ResolutionString,
} from '../@types/datafeed-api';

import { getTokenSymbolsContractsFromChartSymbol, logMessage, type TokensChartSymbol } from './helpers';

import {
    HistoryProvider,
    type HistoryProviderApi,
    type LimitedResponseConfiguration,
} from './history-provider';

import { DataPulseProvider } from './data-pulse-provider';

export interface TVChartDexConfiguration {
    dexName: string;
    dexDescription: string;
    wsUrl: string;
    allowLogger?: boolean;
    currencyCode?: string;
}

export const resolutions = ['15', '60', '240', '1D'] as ResolutionString[];

const defaultConfiguration = (config: TVChartDexConfiguration): DatafeedConfiguration => ({
    supported_resolutions: resolutions,
    supports_marks: true,
    supports_time: true,
    supports_timescale_marks: true,
    exchanges: [
        {
            value: config.dexName,
            name: config.dexName,
            desc: config.dexDescription,
        },
    ],
    symbols_types: [
        {
            name: 'crypto',
            value: 'crypto',
        },
    ],
});

export class Datafeed implements IExternalDatafeed, IDatafeedChartApi {
    protected _configuration: DatafeedConfiguration;

    private _logMessage?: (v: string) => void;

    private readonly _historyProvider: HistoryProvider;

    private readonly _dataPulseProvider: DataPulseProvider;

    private readonly _TVChartDexConfiguration: TVChartDexConfiguration;

    public constructor(
        TVChartDexConfiguration: TVChartDexConfiguration,
        datafeedApi: HistoryProviderApi,
        limitedServerResponse?: LimitedResponseConfiguration,
    ) {
        this._TVChartDexConfiguration = TVChartDexConfiguration;
        if (TVChartDexConfiguration.allowLogger) {
            this._logMessage = logMessage;
        }
        this._configuration = defaultConfiguration(this._TVChartDexConfiguration);
        this._historyProvider = new HistoryProvider(datafeedApi, limitedServerResponse, this._logMessage);
        this._dataPulseProvider = new DataPulseProvider(TVChartDexConfiguration.wsUrl, this._historyProvider, this._logMessage);
        this._logMessage?.('Datafeed initialized');
    }

    public onReady: IExternalDatafeed['onReady'] = (callback) => {
        setTimeout(() => callback(this._configuration));
    };

    // eslint-disable-next-line class-methods-use-this
    public searchSymbols: IDatafeedChartApi['searchSymbols'] = () => {
        //
    };

    public resolveSymbol: IDatafeedChartApi['resolveSymbol'] = (
        symbolName,
        onResolve,
        // onError,
        // extension,
    ) => {
        const { dexName, currencyCode } = this._TVChartDexConfiguration;
        const { supported_resolutions: supportedResolutions } = this._configuration;
        setTimeout(() => {
            this._logMessage?.(`Resolve requested - ${symbolName}`);
            const [tokenA, tokenB] = getTokenSymbolsContractsFromChartSymbol(symbolName as TokensChartSymbol);

            const fullName = `${dexName}:${symbolName}`;
            const name = `${tokenA.symbol}/${tokenB.symbol}`;
            const symbolInfo = {
                ticker: symbolName,
                name,
                currency_code: currencyCode,
                base_name: [fullName],
                full_name: fullName,
                description: name,
                type: 'crypto',
                session: '24x7',
                timezone: 'Etc/UTC',
                exchange: dexName,
                minmov: 1,
                pricescale: 100,
                has_intraday: true,
                has_no_volume: false,
                has_weekly_and_monthly: true,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                supported_resolutions: supportedResolutions!,
                volume_precision: 2,
                data_status: 'streaming',
                visible_plots_set: 'ohlcv',
            } as LibrarySymbolInfo;

            onResolve(symbolInfo);
        });
    };

    public getBars: IDatafeedChartApi['getBars'] = (
        symbolInfo,
        resolution,
        periodParams,
        onResult,
        onError,
    ) => {
        this._logMessage?.(`Get bars requested - ${symbolInfo.full_name}, ${resolution}`);
        this._historyProvider
            .getBars(symbolInfo, resolution, periodParams)
            .then(({ bars, meta }) => {
                onResult(bars, meta);
            })
            .catch(onError);
    };

    public subscribeBars: IDatafeedChartApi['subscribeBars'] = (
        symbolInfo,
        resolution,
        onTick,
        listenerGuid,
        // _onResetCacheNeededCallback,
    ) => {
        this._dataPulseProvider.subscribeBars(symbolInfo, resolution, onTick, listenerGuid);
    };

    public unsubscribeBars: IDatafeedChartApi['unsubscribeBars'] = (listenerGuid: string) => {
        this._dataPulseProvider.unsubscribeBars(listenerGuid);
    };

    public clearSubscriptions(): void {
        this._dataPulseProvider.clearSubscriptions();
    }
}
