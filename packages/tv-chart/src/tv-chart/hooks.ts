import { useCallback } from 'react';
import { downloadImage, getFileNameToSave } from './helpers';
import type { NullableWidgetT, WidgetRefT } from './tv-chart.interface';

const noop = () => undefined;

export const saveChartAsImg = (widget?: NullableWidgetT) => {
    if (!widget) return;
    widget.headerReady().then(() => {
        widget.takeClientScreenshot().then((canvas) => {
            const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            downloadImage(image, getFileNameToSave(widget.activeChart().symbol()));
        });
    });
};

export const useSaveChartAsImg = (widgetRef?: WidgetRefT) => useCallback(() => {
    saveChartAsImg(widgetRef?.current);
}, [widgetRef]);

export const takeChartScreenshot = (widget?: NullableWidgetT) => {
    if (!widget) return;
    widget.headerReady().then(() => {
        widget.takeClientScreenshot().then((canvas) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const data = [new ClipboardItem({ [blob.type]: blob })];
                    navigator.clipboard.write(data).then(() => {
                        widget.showNoticeDialog({
                            title: 'Copying',
                            body: 'Chart image copied to clipboard',
                            callback: noop,
                        });
                    });
                }
            });
        });
    });
};

export const useTakeChartScreenshot = (widgetRef?: WidgetRefT) => useCallback(() => {
    takeChartScreenshot(widgetRef?.current);
}, [widgetRef]);

export const openChartSettings = (widget?: NullableWidgetT) => {
    if (!widget) return;
    widget.headerReady().then(() => {
        widget.chart().executeActionById('chartProperties');
    });
};

export const useOpenChartSettings = (widgetRef?: WidgetRefT) => useCallback(() => {
    openChartSettings(widgetRef?.current);
}, [widgetRef]);

export const makeChartFullScreen = (widget?: NullableWidgetT) => {
    if (!widget) return;
    widget.headerReady().then(() => {
        widget.startFullscreen();
    });
};

export const useMakeChartFullScreen = (widgetRef?: WidgetRefT) => useCallback(() => {
    makeChartFullScreen(widgetRef?.current);
}, [widgetRef]);

export const setNewSymbolToChart = (newSymbol: string, widget?: NullableWidgetT) => {
    if (!widget || !newSymbol) return;
    const { symbol, interval } = widget.symbolInterval();

    if (!symbol.toLowerCase().endsWith(newSymbol.toLowerCase())) {
        widget.setSymbol(newSymbol, interval, noop);
    }
};

export const useSetNewSymbolToChart = (widgetRef?: WidgetRefT) => useCallback(
    (newSymbol: string) => {
        setNewSymbolToChart(newSymbol, widgetRef?.current);
    },
    [widgetRef],
);
