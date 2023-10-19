import {
    IAnalyticsStore, ISimplePoolData, ITokenData, Stores, useDisclosure, useInject,
} from '@app/framework';
import classNames from 'classnames';
import { FC, useCallback, useRef } from 'react';
import { Typography } from '../../../../components/atoms';
import Popup from '../../../../components/atoms/popup/popup';
import { ChevronIcon } from '../../../../components/icons';
import { TokenPairIcon } from '../../../../components/molecules/token-pair-icon';
import { getTokenPairSymbol } from '../../../../utils/get-token-pair-symbol';
import { PoolList, PoolListProps } from '../pool-list';

import s from './pool-selector.module.scss';

const getPopupPosition = (trigger: HTMLButtonElement | null) => {
    const rect = trigger?.getBoundingClientRect();
    return {
        x: rect ? rect.x + rect.width : 0,
        y: rect ? rect.y + rect.height : 0,
    };
};

const PoolSelector: FC<Omit<PoolListProps, 'onSelectPool'> & { onSelectPool?: PoolListProps['onSelectPool']}> = ({
    tokenA,
    tokenB,
    onSelectPool,
}) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const triggerRef = useRef<HTMLButtonElement>(null);

    const handleSelectPool: PoolListProps['onSelectPool'] = useCallback((pool) => {
        onSelectPool?.(pool);
        onClose();
    }, [onClose, onSelectPool]);

    return (
        <>
            <button ref={triggerRef} type="button" onClick={onOpen} className={s.pool_btn}>
                <TokenPairIcon tokenFrom={tokenA} tokenTo={tokenB} size="lg" />
                <Typography size="text-xs">{getTokenPairSymbol(tokenA, tokenB)}</Typography>
                <ChevronIcon direction={isOpen ? 'down' : 'up'} filled mainClassName={s.chevron} />
            </button>
            <Popup
                visible={isOpen}
                testId="pool-selector"
                close={onClose}
                orientation="bottom-right"
                pivot={getPopupPosition(triggerRef.current)}
                className={s.pool_selector}
            >
                <div className={s.scroll_area}>
                    <PoolList tokenA={tokenA} tokenB={tokenB} onSelectPool={handleSelectPool} />
                </div>
            </Popup>
        </>
    );
};
export default PoolSelector;
