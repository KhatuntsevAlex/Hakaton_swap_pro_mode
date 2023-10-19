import classNames from 'classnames';
import type { FC } from 'react';

import useResponsive from '../../hooks/use-responsive';
import TVChart from './tv-chart.chart/tv-chart.chart.component';
import TVChartHeader, { TVChartHeaderProps } from './tv-chart.header/tv-chart.header.component';

import s from './tv-chart.module.scss';

const TVChartContainer: FC<Partial<TVChartHeaderProps>> = ({
    tokenA,
    tokenB,
    className,
    onSelectPool,
}) => {
    const { isDesktop } = useResponsive();

    if (!tokenA || !tokenB || !isDesktop) return null;

    return (
        <div className={classNames(s.tv_chart_container, className)}>
            <TVChartHeader
                tokenA={tokenA}
                tokenB={tokenB}
                onSelectPool={onSelectPool}
            />
            <TVChart
                tokenA={tokenA}
                tokenB={tokenB}
            />
        </div>
    );
};

export default TVChartContainer;
