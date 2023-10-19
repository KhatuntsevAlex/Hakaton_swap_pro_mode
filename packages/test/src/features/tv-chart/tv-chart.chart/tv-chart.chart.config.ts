import { TVChartProps } from '@app/tv-chart';
import { ENV } from '../../../config';
import { WS_URL } from '../../../store/api.config';

export const chartConfig: NonNullable<Pick<TVChartProps, 'chartColors' | 'dexConfig' | 'libraryPath' | 'customCssUrl' | 'studiesOverrides'>> = {
    dexConfig: {
        wsUrl: WS_URL,
        dexName: 'test',
        dexDescription: 'THE FUTURE OF DECENTRALIZED TRADING',
        allowLogger: ENV === 'dev' || ENV === 'qa',
        currencyCode: '$',
    },
    chartColors: {
        background: 'rgba(21, 21, 21, 1)',
        up: '#23F7DD',
        down: '#FF0058',
        upTransparent: 'rgba(35, 247, 221, 0.2)',
        downTransparent: 'rgba(255, 0, 88, 0.2)',
        gridLine: 'rgba(255, 255, 255, 0.1)',
        axis: 'rgba(255, 255, 255, 0.50)',
    },
    libraryPath: 'path to tv charting library',
    customCssUrl: 'tv-chart-library.css',
};
