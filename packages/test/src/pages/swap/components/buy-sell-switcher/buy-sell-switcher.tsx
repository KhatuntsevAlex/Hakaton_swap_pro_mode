import { ITokenData } from '@app/framework';
import classNames from 'classnames';
import React, { FC } from 'react';
import { ESvgIconType, SvgIcon, Typography } from '../../../../components/atoms';
import { TokenIcon } from '../../../../components/icons';

import s from './buy-sell-switcher.module.scss';

const Button: FC<{
    firstToken: ITokenData | undefined;
    secondToken: ITokenData | undefined;
    selected: boolean;
    onSelect: VoidFunction;
    description: string;
}> = ({
    firstToken,
    secondToken,
    selected,
    onSelect,
    description,
}) => (
    <button
        type="button"
        className={classNames(s.btn, {
            [s.selected]: selected,
        })}
        onClick={selected ? undefined : onSelect}
        tabIndex={0}
    >
        <div className={s.tokens}>
            <TokenIcon icon={firstToken?.icon || ''} className={s.icon} />
            <SvgIcon
                type={ESvgIconType.ARROW_BACK}
                maskClassName={s.arrow}
                mainClassName={s.icon}
                dataTestId="flip-tokens"
            />
            <TokenIcon icon={secondToken?.icon || ''} className={s.icon} />
        </div>
        <Typography size="text-l">{description}</Typography>
    </button>
);

const BuySellSwitcher: FC<{
    tokenA: ITokenData | undefined;
    tokenB: ITokenData | undefined;
    isBuyMode: boolean;
    setBuyMode: VoidFunction;
    setSellMode: VoidFunction;
}> = ({
    tokenA,
    tokenB,
    isBuyMode,
    setBuyMode,
    setSellMode,
}) => (
    <div className={s.buy_sell_switcher}>
        <Button
            firstToken={tokenB}
            secondToken={tokenA}
            selected={isBuyMode}
            onSelect={setBuyMode}
            description={`Buy ${tokenA?.symbol}`}
        />
        <Button
            firstToken={tokenA}
            secondToken={tokenB}
            selected={!isBuyMode}
            onSelect={setSellMode}
            description={`Sell ${tokenA?.symbol}`}
        />
    </div>
);

export default BuySellSwitcher;
