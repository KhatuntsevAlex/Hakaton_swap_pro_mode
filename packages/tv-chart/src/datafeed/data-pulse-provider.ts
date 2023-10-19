/* eslint-disable max-len */
import { IChartSpotPriceCandle } from '@app/framework';

import { HistoryProvider } from './history-provider';

import {
    getTimeFrameFromResolution,
    getTokenSymbolsContractsFromChartSymbol,
    getUTCTimeFromISOString,
    LogMessage,
    parseNewBar,
    TokensChartSymbol,
} from './helpers';
import { LibrarySymbolInfo } from '../@types/charting_library';
import { SubscribeBarsCallback } from '../@types/datafeed-api';

  enum EventType {
    CANDLE = 'spot_price_candle_update',
    VOLUME = 'volume_candle_update',
  }

  enum MethodType {
    PING = 'ping',
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
  }

  enum MessageType {
    NEW_EVENT = 'new_event',
  }

  type EventTypeCombined<T extends EventType> = `${T}@${string}@${string}@${string}`;

  interface SubscriptionMessage {
    id: number | string;
    jsonrpc: string;
    result: {
      event_types: Array<EventTypeCombined<EventType>>;
    }
  }

  interface ErrorMessage {
    id: number | string;
    jsonrpc: string;
    error: {
      code: number;
      message: string;
    }
  }

  type PingMessage = Omit<SubscriptionMessage, 'result'>;

  interface VolumeMessageData {
    pool_id: number;
    time_open: string;
    timeframe: string;
    token_a: string;
    token_b: string;
    volume: string;
  }

  interface CandleMessageData extends IChartSpotPriceCandle {
    timeframe: string;
    token_a: string;
    token_b: string;
    updated_at: string;
  }

  interface MessageParams<T extends EventType> {
    created_at: string;
    type: EventTypeCombined<T>;
    data: T extends EventType.CANDLE ? CandleMessageData : VolumeMessageData;
  }

  interface VolumeMessage {
    jsonrpc: string;
    method: MessageType;
    params: MessageParams<EventType.VOLUME>;
  }

  interface CandleMessage {
    jsonrpc: string;
    method: MessageType;
    params: MessageParams<EventType.CANDLE>;
  }

  type Message = SubscriptionMessage | PingMessage | ErrorMessage | VolumeMessage | CandleMessage;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isChartMessage = (data: Message | null): data is VolumeMessage | CandleMessage => data?.method === MessageType.NEW_EVENT;

const isCandleMessage = (data: Message | null): data is CandleMessage => isChartMessage(data) && data.params.type.startsWith(EventType.CANDLE);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isErrorMessage = (data: Message | null): data is ErrorMessage => !!data.error && !!data.error.code;

export class DataPulseProvider {
    private _ws!: WebSocket;

    private _wsConnectionPromise!: Promise<void>;

    private _autoConnect = false;

    private _subscriptions: Record<string, {
        symbolInfo: LibrarySymbolInfo,
        resolution: string,
        newDataCallback: SubscribeBarsCallback,
        listenerGuid: string,
        unsubscribe: VoidFunction,
    } | undefined> = {};

    private _pingInterval = 20 * 1000;

    private _pingTimer: NodeJS.Timeout | null = null;

    public constructor(
        private readonly _wsUrl: string,
        private readonly _historyProvider: HistoryProvider,
        private readonly _logMessage?: LogMessage,
    ) {
        this._connect();
    }

    public subscribeBars = (
        symbolInfo: LibrarySymbolInfo,
        resolution: string,
        newDataCallback: SubscribeBarsCallback,
        listenerGuid: string,
    ): void => {
        this._wsConnectionPromise.then(() => {
            if (this._wsConnected) {
                this._subscriptions[listenerGuid] = {
                    symbolInfo,
                    resolution,
                    newDataCallback,
                    listenerGuid,
                    unsubscribe: () => undefined,
                };
                const [tokenA, tokenB] = getTokenSymbolsContractsFromChartSymbol(symbolInfo.ticker as TokensChartSymbol);
                const dataStr = `${tokenA.contract}@${tokenB.contract}@${getTimeFrameFromResolution(resolution).toLowerCase()}` as const;
                const candleEvent: EventTypeCombined<EventType.CANDLE> = `${EventType.CANDLE}@${dataStr}`;
                const volumeEvent: EventTypeCombined<EventType.VOLUME> = `${EventType.VOLUME}@${dataStr}`;
                const params = {
                    event_types: [candleEvent, volumeEvent],
                };

                this._sendData({
                    method: MethodType.SUBSCRIBE,
                    params,
                });

                const unsubscribeFromEvents = () => this._sendData({
                    method: MethodType.UNSUBSCRIBE,
                    params,
                });

                const onMessage = this._onMessageGenerator(listenerGuid);

                this._ws.addEventListener('message', onMessage);

                if (this._subscriptions[listenerGuid]) {
                    this._subscriptions[listenerGuid]!.unsubscribe = () => {
                        unsubscribeFromEvents();
                        this._ws.removeEventListener('message', onMessage);
                    };
                }

                this._logMessage?.(`DataPulseProvider: subscribed for #${listenerGuid} - {${symbolInfo.name}, ${resolution}}`);
            }
        });
    };

    public unsubscribeBars = (listenerGuid: string): void => {
        this._logMessage?.(`DataPulseProvider: unsubscribed for #${listenerGuid}`);
        const subscription = this._subscriptions[listenerGuid];

        if (subscription) {
            subscription.unsubscribe();
            delete this._subscriptions[listenerGuid];
        }
    };

    public clearSubscriptions = () => {
        this._autoConnect = false;
        if (this._pingTimer) {
            clearInterval(this._pingTimer);
        }
        Object.values(this._subscriptions).forEach((item) => {
            item?.unsubscribe();
        });
        this._subscriptions = {};
        this._ws.close();
    };

    private get _wsConnected() {
        return this._ws.readyState === WebSocket.OPEN;
    }

    private _connect = () => {
        this._logMessage?.('DataPulseProvider: open connection');
        if (this._pingTimer) {
            clearInterval(this._pingTimer);
        }
        this._ws = new WebSocket(this._wsUrl);
        this._ws.addEventListener('error', (event) => {
            this._logMessage?.('DataPulseProvider: connection error', event);
        });
        this._ws.addEventListener('close', () => {
            this._logMessage?.('DataPulseProvider: connection closed');
        });
        this._wsConnectionPromise = new Promise((resolve) => {
            this._ws.addEventListener('open', () => {
                this._autoConnect = true;
                this._logMessage?.('DataPulseProvider: connection opened');
                this._pingTimer = setInterval(() => {
                    this._sendData({ method: MethodType.PING });
                }, this._pingInterval);
                resolve();
            });
        });
    };

    private _onMessageGenerator = (listenerGuid: string) => (event: MessageEvent) => {
        const subscription = this._subscriptions[listenerGuid];

        if (!subscription) return;

        const data: Message | null = JSON.parse(event.data || '') || null;

        if (!data) return;

        if (isErrorMessage(data)) {
            this._logMessage?.(data.error.message);
            return;
        }

        if (isChartMessage(data)) {
            const lastBar = this._historyProvider.getLastBar(subscription.symbolInfo);
            if (isCandleMessage(data)) {
                const newBar = parseNewBar(data.params.data);

                if (newBar && (!lastBar || newBar.time >= lastBar.time)) {
                    this._historyProvider.setLastBar(subscription.symbolInfo, newBar);
                    subscription.newDataCallback(newBar);
                }
            } else if (lastBar) {
                const time = getUTCTimeFromISOString(data.params.data.time_open);
                if (lastBar.time === time && data.params.data.volume) {
                    const newBar = {
                        ...lastBar,
                        volume: parseFloat(data.params.data.volume),
                    };

                    subscription.newDataCallback(newBar);
                }
            }
        }
    };

    private _sendData = <T extends MethodType>({
        method,
        params,
    }: T extends MethodType.PING ? { method: T; params?: void } : {
        method: T;
        params: T extends MethodType.PING ? undefined : {
            event_types: EventTypeCombined<EventType>[]
        };
    }) => {
        if (this._wsConnected) {
            this._ws.send(JSON.stringify({
                jsonrpc: '2.0',
                id: 0,
                method,
                params: params || {},
            }));
        }
    };
}
