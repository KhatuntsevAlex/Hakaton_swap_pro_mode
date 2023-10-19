import type { ChartingLibraryWidgetOptions, IChartingLibraryWidget } from '../@types/charting_library';
import type { MutableRefObject } from 'react';
import type { TVChartDexConfiguration } from '../datafeed';
import type { TokensChartSymbol } from '../datafeed/helpers';
import type { HistoryProviderApi, LimitedResponseConfiguration } from '../datafeed/history-provider';

export type NullableWidgetT = IChartingLibraryWidget | null;
export type WidgetRefT = MutableRefObject<NullableWidgetT>;

export type ChartColors = Record<'background' | 'up' | 'down' | 'upTransparent' | 'downTransparent' | 'gridLine' | 'axis', string>;

export interface TVChartProps {
    symbol: TokensChartSymbol;
    dexConfig: TVChartDexConfiguration;
    api: HistoryProviderApi;
    serverResponseConfig?: LimitedResponseConfiguration
    theme?: ChartingLibraryWidgetOptions['theme'];
    className?: string;
    tvWidgetRef?: WidgetRefT;
    customCssUrl?: string;
    libraryPath: string;
    overrides?: ChartingLibraryWidgetOptions['overrides'];
    studiesOverrides?: ChartingLibraryWidgetOptions['studies_overrides'];
    chartColors?: ChartColors;
}
