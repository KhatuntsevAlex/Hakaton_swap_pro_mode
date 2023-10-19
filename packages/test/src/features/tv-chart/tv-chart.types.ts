import type { ITokenData } from '@app/framework';

export type TVChartProps = Record<'tokenA' | 'tokenB', ITokenData> & {
    className?: string;
};
