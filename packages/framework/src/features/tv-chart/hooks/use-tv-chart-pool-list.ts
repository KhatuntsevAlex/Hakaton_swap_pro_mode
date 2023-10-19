import { useEffect, useMemo } from 'react';
import { Stores } from '../../../constants';
import { useInject } from '../../../ioc';
import { IAnalyticsStore, ISimplePoolData } from '../../analytics';

const useSimplePoolsWithLiquidity = (pools: ISimplePoolData[]) =>
    useMemo(() => pools.filter((pool) => !!Number(pool.spotPrice || 0)), [pools]);

export const useTVCharPoolList = () => {
    const { simplePools } = useInject<IAnalyticsStore>(Stores.ANALYTICS);

    return useSimplePoolsWithLiquidity(simplePools);
};

export const useFetchTVCharPoolList = (autoRefresh = true) => {
    const { getSimplePools, simplePools } = useInject<IAnalyticsStore>(Stores.ANALYTICS);

    useEffect(() => {
        const fetch = async () => getSimplePools().catch(() => undefined);
        fetch();

        if (!autoRefresh) return () => undefined;

        const interval = setInterval(fetch, 5000);
        return () => {
            clearInterval(interval);
        };
    }, [getSimplePools, autoRefresh]);

    return useSimplePoolsWithLiquidity(simplePools);
};
