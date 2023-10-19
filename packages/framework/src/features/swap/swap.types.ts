import { IStorageCost, ITokenData } from '../../api';
import { IStore } from '../../ioc';

export enum ESwapType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum SwapMode {
    PRO = 'pro',
    PRO_INVERTED = 'pro-inverted',
    SIMPLE = 'simple',
}

export interface ISwap {
  tokenA: ITokenData;
  tokenB: ITokenData;
  amountA: string;
  amountB: string;
  expectedAmount: string;
  deposit?: IStorageCost;
}

export interface ISwapProModeStore extends IStore {
  [key: string]: unknown;
}
