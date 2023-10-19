import { useEffect, useState } from 'react';
import { IChartHeaderResponse, ILiquidityApi, ITokenData } from '../../../api';
import { Apis, Stores } from '../../../constants';
import { useInject } from '../../../ioc';
import { ITokenStore } from '../../token';

interface UseTVChartHeaderDataProps {
    tokenA: ITokenData;
    tokenB: ITokenData;
}

const useWrappedToNativeToken = ({ tokenA, tokenB }: UseTVChartHeaderDataProps) => {
    const { nativeToken, wrappedTokenContract } = useInject<ITokenStore>(Stores.TOKEN);

    return {
        tokenA: tokenA.contract === wrappedTokenContract ? nativeToken! : tokenA,
        tokenB: tokenB.contract === wrappedTokenContract ? nativeToken! : tokenB,
    };
};

export const useTVChartPoolData = (
    props: UseTVChartHeaderDataProps,
) => {
    const { tokenA, tokenB } = useWrappedToNativeToken(props);
    const { getChartHeader } = useInject<ILiquidityApi>(Apis.LIQUIDITY_API);
    const { nativeToWrappedContract } = useInject<ITokenStore>(Stores.TOKEN);
    const [data, setData] = useState<IChartHeaderResponse | null>(null);

    useEffect(() => {
        let isMounted = true;
        const contractA = nativeToWrappedContract(tokenA.contract);
        const contractB = nativeToWrappedContract(tokenB.contract);
        const fetch = async () => {
            const resp = await getChartHeader({ token_a: contractA, token_b: contractB }).catch(
                () => undefined,
            );
            if (isMounted) {
                setData(resp || null);
            }
        };
        fetch();
        const interval = setInterval(fetch, 5000);
        return () => {
            isMounted = false;
            clearInterval(interval);
            setData(null);
        };
    }, [getChartHeader, nativeToWrappedContract, tokenA, tokenB]);

    return data;
};
