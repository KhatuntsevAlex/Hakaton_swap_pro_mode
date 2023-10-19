import { memo, type FC } from 'react';
import type { TVChartProps } from './tv-chart.interface';
import { useTVChart } from './use-tv-chart';

const TVChart: FC<TVChartProps> = memo(
    ({
        className, ...props
    }) => {
        const { containerRef } = useTVChart(props);

        return (
            <div
                ref={containerRef}
                className={className}
            />
        );
    },
);

TVChart.displayName = 'TVChart';

export default TVChart;
