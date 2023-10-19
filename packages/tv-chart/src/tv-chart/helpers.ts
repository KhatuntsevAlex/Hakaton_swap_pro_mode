import type {
    ChartingLibraryWidgetOptions,
    LanguageCode,
    ResolutionString,
    Timezone,
} from '../@types/charting_library';
import { resolutions } from '../datafeed';
import { TVChartProps } from './tv-chart.interface';

export const getCurrentTimezone = (): string => {
    const date = new Date();
    const offset = (date.getTimezoneOffset() / 60) * -1;
    return `UTC${offset > 0 ? '+' : ''}${offset}`;
};

export const getLanguageFromURL = (): LanguageCode | null => {
    const regex = /[?&]lang=([^&#]*)/;
    const results = regex.exec(window.location.search);
    return results === null
        ? null
        : (decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode);
};

export const downloadImage = (data: string, filename = 'untitled.jpeg') => {
    const a = document.createElement('a');
    a.href = data;
    a.download = filename;
    a.click();
};

export const getFileNameToSave = (symbol?: string) => {
    const date = new Date();
    const dateString = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
        ),
    )
        .toISOString()
        .slice(0, -5)
        .replaceAll(':', '-')
        .replace('T', '_');
    return `${symbol ? `${symbol}_` : ''}${dateString}.png`;
};

const getChartOverridesByCustomColors = (
    {
        background,
        up,
        down,
        upTransparent,
        downTransparent,
        gridLine,
        axis,
    }: NonNullable<TVChartProps['chartColors']>,
): NonNullable<ChartingLibraryWidgetOptions['overrides']> => ({
    // chart background
    'paneProperties.background': background,
    'paneProperties.backgroundGradientStartColor': background,
    'paneProperties.backgroundGradientEndColor': background,
    'paneProperties.backgroundType': 'solid',
    // chart grid
    'paneProperties.vertGridProperties.color': gridLine,
    'paneProperties.vertGridProperties.style': 0,
    'paneProperties.horzGridProperties.color': gridLine,
    'paneProperties.horzGridProperties.style': 0,
    // candle
    'mainSeriesProperties.candleStyle.upColor': up,
    'mainSeriesProperties.candleStyle.downColor': down,
    'mainSeriesProperties.candleStyle.borderUpColor': up,
    'mainSeriesProperties.candleStyle.borderDownColor': down,
    'mainSeriesProperties.candleStyle.wickUpColor': up,
    'mainSeriesProperties.candleStyle.wickDownColor': down,
    // hollow candle
    'mainSeriesProperties.hollowCandleStyle.upColor': up,
    'mainSeriesProperties.hollowCandleStyle.downColor': down,
    'mainSeriesProperties.hollowCandleStyle.borderUpColor': up,
    'mainSeriesProperties.hollowCandleStyle.borderDownColor': down,
    'mainSeriesProperties.hollowCandleStyle.wickUpColor': up,
    'mainSeriesProperties.hollowCandleStyle.wickDownColor': down,
    // bar
    'mainSeriesProperties.barStyle.upColor': up,
    'mainSeriesProperties.barStyle.downColor': down,
    // column
    'mainSeriesProperties.columnStyle.upColor': upTransparent,
    'mainSeriesProperties.columnStyle.downColor': downTransparent,
    // hlcArea
    'mainSeriesProperties.hlcAreaStyle.closeLowFillColor': downTransparent,
    'mainSeriesProperties.hlcAreaStyle.highLineColor': up,
    'mainSeriesProperties.hlcAreaStyle.lowLineColor': down,
    'mainSeriesProperties.hlcAreaStyle.highCloseFillColor': upTransparent,
    // baseLine
    'mainSeriesProperties.baselineStyle.bottomFillColor1': downTransparent,
    'mainSeriesProperties.baselineStyle.bottomFillColor2': down,
    'mainSeriesProperties.baselineStyle.bottomLineColor': down,
    'mainSeriesProperties.baselineStyle.topFillColor1': upTransparent,
    'mainSeriesProperties.baselineStyle.topFillColor2': up,
    'mainSeriesProperties.baselineStyle.topLineColor': up,
    // Heikin Ashi
    'mainSeriesProperties.haStyle.borderUpColor': up,
    'mainSeriesProperties.haStyle.borderDownColor': down,
    'mainSeriesProperties.haStyle.upColor': up,
    'mainSeriesProperties.haStyle.downColor': down,
    'mainSeriesProperties.haStyle.wickUpColor': up,
    'mainSeriesProperties.haStyle.wickDownColor': down,
    // axis
    'scalesProperties.axisHighlightColor': axis,
    'scalesProperties.textColor': axis,
});

const getChartStudiesOverridesByCustomColors = (
    {
        background,
        up,
        down,
        upTransparent,
        downTransparent,
        gridLine,
        axis,
    }: NonNullable<TVChartProps['chartColors']>,
): NonNullable<ChartingLibraryWidgetOptions['studies_overrides']> => ({
    'volume.volume.color.0': down,
    'volume.volume.color.1': up,
});

export const getChartOverrides = (
    { overrides, chartColors }: Pick<TVChartProps, 'overrides' | 'chartColors'>,
): ChartingLibraryWidgetOptions['overrides'] => {
    if (!overrides && !chartColors) return undefined;

    return {
        ...(chartColors ? getChartOverridesByCustomColors(chartColors) : {}),
        ...(overrides || {}),
    };
};

export const getChartStudiesOverrides = (
    { studiesOverrides, chartColors }: Pick<TVChartProps, 'studiesOverrides' | 'chartColors'>,
): ChartingLibraryWidgetOptions['studies_overrides'] => {
    if (!studiesOverrides && !chartColors) return undefined;

    return {
        ...(chartColors ? getChartStudiesOverridesByCustomColors(chartColors) : {}),
        ...(studiesOverrides || {}),
    };
};

export const getWidgetOptions = ({
    symbol,
    theme,
    customCssUrl,
    libraryPath,
    overrides,
    studiesOverrides,
    chartColors,
}: TVChartProps): Omit<ChartingLibraryWidgetOptions, 'datafeed' | 'container'> => ({
    interval: '15' as ResolutionString,
    symbol,
    theme,
    library_path: libraryPath,
    custom_css_url: customCssUrl,
    overrides: getChartOverrides({ overrides, chartColors }),
    studies_overrides: getChartStudiesOverrides({ studiesOverrides, chartColors }),
    autosize: true,
    debug: false,
    disabled_features: [
        'use_localstorage_for_settings',
        'symbol_info',
        'source_selection_markers',
        'header_symbol_search',
        'symbol_search_hot_key',
        'header_compare',
        'header_undo_redo',
        'header_screenshot',
        'header_saveload',
        'popup_hints',
        'show_interval_dialog_on_key_press',
        'timeframes_toolbar',
    ],
    enabled_features: [
        'end_of_period_timescale_marks',
        'items_favoriting',
        'header_fullscreen_button',
    ],
    favorites: {
        intervals: resolutions,
        chartTypes: ['Candles', 'Bars', 'Line', 'Area'],
    },
    fullscreen: false,
    locale: 'en',
    study_count_limit: 2,
    symbol_search_request_delay: 500,
    timezone: getCurrentTimezone() as Timezone,
    header_widget_buttons_mode: 'fullsize',
});
