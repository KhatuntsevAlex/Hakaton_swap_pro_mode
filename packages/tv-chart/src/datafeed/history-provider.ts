/* eslint-disable max-len */
import type {
    IChartSpotPriceCandle, IChartTokensPairVolume, ILiquidityApi,
} from '@app/framework';
import type {
    Bar, HistoryMetadata, LibrarySymbolInfo, PeriodParams,
} from '../@types/datafeed-api';

import {
    getErrorMessage, getTimeFrameFromResolution, getTokenSymbolsContractsFromChartSymbol, LogMessage, parseNewBar, TokensChartSymbol,
} from './helpers';

export type PeriodParamsWithOptionalCountback = Omit<PeriodParams, 'countBack'> & { countBack?: number };

export interface GetBarsResult {
  bars: Bar[];
  meta: HistoryMetadata;
}

export interface LimitedResponseConfiguration {
  /**
   * Set this value to the maximum number of bars which
   * the data backend server can supply in a single response.
   * This doesn't affect or change the library behavior regarding
   * how many bars it will request. It just allows this Datafeed
   * implementation to correctly handle this situation.
   */
  maxResponseLength: number;
  /**
   * If the server can't return all the required bars in a single
   * response then `expectedOrder` specifies whether the server
   * will send the latest (newest) or earliest (older) data first.
   */
  expectedOrder: 'latestFirst' | 'earliestFirst';
}

export interface HistoryProviderApi {
    getCandles: ILiquidityApi['getChartSpotPriceCandles'];
    getVolumes: ILiquidityApi['getChartTokensPairVolumeByTimeFrame'];
}

export class HistoryProvider {
    private readonly _limitedServerResponse: LimitedResponseConfiguration = { maxResponseLength: 1000, expectedOrder: 'latestFirst' };

    private readonly _lastBarsCache: Record<string, Bar> = {};

    public constructor(
        private readonly _api: HistoryProviderApi,
        limitedServerResponse?: Partial<LimitedResponseConfiguration>,
        private readonly _logMessage?: LogMessage,
    ) {
        if (limitedServerResponse?.expectedOrder) {
            this._limitedServerResponse.expectedOrder = limitedServerResponse.expectedOrder;
        }

        if (limitedServerResponse?.maxResponseLength) {
            this._limitedServerResponse.maxResponseLength = limitedServerResponse.maxResponseLength;
        }
    }

    public getLastBar = (symbolInfo: LibrarySymbolInfo) => this._lastBarsCache[symbolInfo.full_name];

    public setLastBar = (symbolInfo: LibrarySymbolInfo, bar: Bar) => {
        this._lastBarsCache[symbolInfo.full_name] = { ...bar };
    };

    public async getBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: string,
        periodParams: PeriodParamsWithOptionalCountback,
    ): Promise<GetBarsResult> {
        if (!periodParams.firstDataRequest) {
            return { bars: [], meta: { noData: true } };
        }

        const { getCandles, getVolumes } = this._api;

        const [tokenA, tokenB] = getTokenSymbolsContractsFromChartSymbol(symbolInfo.ticker as TokensChartSymbol);

        const requestParams = {
            token_a: tokenA.contract,
            token_b: tokenB.contract,
            timeframe: getTimeFrameFromResolution(resolution).toLowerCase(),
            timestamp: 0,
            limit: 1000,
        };

        try {
            const response = await Promise.all([
                getCandles(requestParams).catch(() => undefined),
                getVolumes(requestParams).catch(() => undefined),
            ])
                .then(([c, v]) => (
                    [c?.chart || [], v?.chart || []] as [IChartSpotPriceCandle[], IChartTokensPairVolume[]]
                ));

            return this._processHistoryResponse(response, symbolInfo);
        } catch (e) {
            if (e instanceof Error || typeof e === 'string') {
                const reasonString = getErrorMessage(e);
                console.warn(`HistoryProvider: getBars() failed, error=${reasonString}`);
                return Promise.reject(reasonString);
            }

            return Promise.reject(e);
        }
    }

    private _processHistoryResponse([candles, volumes]: [IChartSpotPriceCandle[], IChartTokensPairVolume[]], symbolInfo: LibrarySymbolInfo): GetBarsResult {
        if (!candles.length) {
            return { bars: [], meta: { noData: true } };
        }

        const bars = candles.reduce<Bar[]>((acc, bar, idx) => {
            const newBar = parseNewBar(bar);
            if (newBar) {
                const volumeData = volumes[idx];
                // eslint-disable-next-line max-len
                newBar.volume = volumeData && volumeData.value && volumeData.time_label * 1000 === newBar.time ? parseFloat(volumeData.value) : undefined;
                // INFO: for correct chart need reverse array if API response starts with latest candle
                return this._limitedServerResponse.expectedOrder === 'latestFirst' ? [newBar, ...acc] : [...acc, newBar];
            }
            return acc;
        }, []);

        const barsLength = bars.length;

        if (barsLength) {
            this.setLastBar(symbolInfo, bars[barsLength - 1]);
        }

        return {
            bars,
            meta: { noData: !barsLength, nextTime: barsLength ? -1 : undefined },
        };
    }
}
