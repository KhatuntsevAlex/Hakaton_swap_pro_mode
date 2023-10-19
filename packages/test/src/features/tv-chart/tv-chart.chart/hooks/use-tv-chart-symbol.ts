import {
    ITokenData, ITokenStore, Stores, useInject,
} from '@app/framework';
import { getChartSymbolFromTokens } from '@app/tv-chart';

export const useTVChartSymbol = ({ tokenA, tokenB }: Record<'tokenA' | 'tokenB', ITokenData>) => {
    const { nativeToWrappedContract } = useInject<ITokenStore>(Stores.TOKEN);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getChartSymbolFromTokens([tokenA, tokenB], nativeToWrappedContract)!;
};
