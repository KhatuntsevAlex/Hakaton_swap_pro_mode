import { TVChart as TVChartCommon } from '@app/tv-chart';
import { FC } from 'react';
import { TVChartProps } from '../tv-chart.types';
import { useTVChartApi, useTVChartSymbol } from './hooks';
import { chartConfig } from './tv-chart.chart.config';

import s from './tv-chart.chart.module.scss';

const TVChart: FC<TVChartProps> = (props) => {
    const symbol = useTVChartSymbol(props);
    const api = useTVChartApi();

    return (
        <TVChartCommon
            symbol={symbol}
            api={api}
            className={s.tv_chart}
            {...chartConfig}
        />
    );
};

export default TVChart;
