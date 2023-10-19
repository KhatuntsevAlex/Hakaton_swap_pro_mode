import { widget as Widget, type IChartingLibraryWidget } from '../@types/charting_library';
import { useEffect, useRef } from 'react';
import { Datafeed } from '../datafeed';
import { getWidgetOptions } from './helpers';
import { TVChartProps } from './tv-chart.interface';

export const useTVChart = ({ theme = 'Dark', ...props }: TVChartProps) => {
    const initialPropsRef = useRef({ theme, ...props });
    const containerRef = useRef<HTMLDivElement>(null);
    const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return () => undefined;
        }

        const {
            dexConfig,
            api,
            serverResponseConfig,
            tvWidgetRef: tvWidgetRefProp,
        } = initialPropsRef.current;

        const datafeed = new Datafeed(dexConfig, api, serverResponseConfig);

        const tvWidget = new Widget({
            container: containerRef.current,
            datafeed,
            ...getWidgetOptions(initialPropsRef.current),
        });

        tvWidgetRef.current = tvWidget;
        if (tvWidgetRefProp) {
            tvWidgetRefProp.current = tvWidget;
        }

        return () => {
            datafeed.clearSubscriptions();
            if (tvWidgetRef.current) {
                tvWidgetRef.current.remove();
                tvWidgetRef.current = null;
                if (tvWidgetRefProp?.current) {
                    tvWidgetRefProp.current = null;
                }
            }
        };
    }, []);

    const { symbol } = props;

    useEffect(() => {
        const { symbol: prevSymbol } = initialPropsRef.current;
        const widget = tvWidgetRef.current;
        if (widget && symbol && prevSymbol !== symbol) {
            initialPropsRef.current.symbol = symbol;
            widget.headerReady().then(() => {
                widget.activeChart().setSymbol(symbol);
                widget.clearUndoHistory();
            });
        }
    }, [symbol]);

    return { containerRef, tvWidgetRef };
};
