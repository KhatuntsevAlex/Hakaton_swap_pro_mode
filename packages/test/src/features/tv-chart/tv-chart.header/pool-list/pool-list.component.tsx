import { ISimplePoolData, ITokenData, useTVCharPoolList } from '@app/framework';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { Typography } from '../../../../components/atoms';
import { TokenPairIcon } from '../../../../components/molecules/token-pair-icon';
import { getTokenPairSymbol } from '../../../../utils/get-token-pair-symbol';
import { isSameTokenPair } from '../../../../utils/is-same-token-pair';

import s from './pool-list.module.scss';

export interface PoolListProps {
    tokenA: ITokenData;
    tokenB: ITokenData;
    onSelectPool: (pool: ISimplePoolData) => void;
}

const PoolList: FC<PoolListProps> = ({
    tokenA,
    tokenB,
    onSelectPool,
}) => {
    const pools = useTVCharPoolList();
    return (
        <ul className={s.pool_list}>
            {pools.map((pool) => {
                const poolTokenA = pool.tokenANative || pool.tokenA;
                const poolTokenB = pool.tokenBNative || pool.tokenB;
                const pairSymbol = getTokenPairSymbol(poolTokenA, poolTokenB);
                const selected = isSameTokenPair(
                    { tokenA: tokenA.contract, tokenB: tokenB.contract },
                    { tokenA: poolTokenA.contract, tokenB: poolTokenB.contract },
                );
                return (
                    // eslint-disable-next-line max-len
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                    <li
                        key={pairSymbol}
                        onClick={() => {
                            if (!selected) {
                                onSelectPool(pool);
                            }
                        }}
                        className={classNames(s.pool_list_item, { [s.selected]: selected })}
                    >
                        <TokenPairIcon tokenFrom={poolTokenA} tokenTo={poolTokenB} size="md" />
                        <Typography size="text-xs">{pairSymbol}</Typography>
                    </li>
                );
            })}
        </ul>
    );
};

export default observer(PoolList);
