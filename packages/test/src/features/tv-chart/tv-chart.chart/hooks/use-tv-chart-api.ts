import { Apis, ILiquidityApi, useInject } from '@app/framework';
import { useMemo } from 'react';

export const useTVChartApi = () => {
    const {
        getChartSpotPriceCandles,
        getChartTokensPairVolumeByTimeFrame,
    } = useInject<ILiquidityApi>(Apis.LIQUIDITY_API);

    return useMemo(() => ({
        getCandles: getChartSpotPriceCandles,
        getVolumes: getChartTokensPairVolumeByTimeFrame,
    }), [getChartSpotPriceCandles, getChartTokensPairVolumeByTimeFrame]);
};
