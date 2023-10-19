import { IChartSpotPriceCandle, ITokenData } from '@app/framework';
import type { Bar } from '../@types/datafeed-api';

export interface RequestParams {
  [paramName: string]: string | string[] | number;
}

export interface UdfResponse {
  s: string;
}

export interface UdfOkResponse extends UdfResponse {
  s: 'ok';
}

export interface UdfErrorResponse {
  s: 'error';
  errmsg: string;
}

export type LogMessage = (message: string, data?: any) => void;

export const logMessage: LogMessage = (message, data) => {
    const now = new Date();
    // eslint-disable-next-line no-console
    console.log(`${now.toLocaleTimeString()}.${now.getMilliseconds()}> ${message}`, data);
};

export function getErrorMessage(error: string | Error | undefined): string {
    if (error === undefined) {
        return '';
    } if (typeof error === 'string') {
        return error;
    }

    return error.message;
}

export const getTimeFrameFromResolution = (resolution: string): string => {
    switch (resolution) {
    case '15': return '15m';
    case '60': return '1h';
    case '240': return '4h';
    case '1D': return '1d';
    default: return resolution;
    }
};

const chartTokenSeparator = '|' as const;
const chartTokenSymbolAndContractSeparator = '/' as const;

type TokenChartSymbol = `${ITokenData['contract']}${typeof chartTokenSymbolAndContractSeparator}${ITokenData['symbol']}`

export type TokensChartSymbol = `${TokenChartSymbol}${typeof chartTokenSeparator}${TokenChartSymbol}`;

export const getChartSymbolFromTokens = (
    data: [ITokenData | undefined | null, ITokenData | undefined | null],
    nativeToWrappedContract: (token: ITokenData['contract']) => ITokenData['contract'],
): TokensChartSymbol | null => {
    if (!data[0] || !data[1]) return null;
    const [a, b] = data;
    return `${nativeToWrappedContract(a.contract)}${chartTokenSymbolAndContractSeparator}${a.symbol}${chartTokenSeparator}${nativeToWrappedContract(b.contract)}${chartTokenSymbolAndContractSeparator}${b.symbol}`;
};

type TokenSymbolAndContract = Record<'contract' | 'symbol', string>;

// eslint-disable-next-line max-len
export const getTokenSymbolsContractsFromChartSymbol = (symbol: TokensChartSymbol) => {
    const tokensStr = symbol.split(chartTokenSeparator) as [TokenChartSymbol, TokenChartSymbol];
    return tokensStr.map<TokenSymbolAndContract>((item) => {
        const [contract, symbol] = item.split(chartTokenSymbolAndContractSeparator) as [ITokenData['contract'], ITokenData['symbol']];
        return { contract, symbol };
    }) as [TokenSymbolAndContract, TokenSymbolAndContract];
};

export const getUTCTimeFromISOString = (str: string): number => new Date(str).getTime();

export const parseNewBar = (bar?: IChartSpotPriceCandle | null): Bar | null => {
    if (bar?.time_open) {
        const barTime = getUTCTimeFromISOString(bar.time_open);
        return {
            time: barTime,
            low: parseFloat(bar.low),
            high: parseFloat(bar.high),
            open: parseFloat(bar.open),
            close: parseFloat(bar.close),
            volume: undefined,
        };
    }
    return null;
};
