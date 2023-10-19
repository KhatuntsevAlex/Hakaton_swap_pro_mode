import {
    useCallback, useEffect, useRef, useState,
} from 'react';

import { ITokenData } from '../../../api';
import { useResponsive } from '../../../providers';
import { SwapUrlService } from '../../../services';
import { ISimplePoolData } from '../../analytics';
import { getPossiblePoolTokenContracts } from '../../pool/helpers/get-possible-pool-token-contracts';
import { useFetchTVCharPoolList } from '../../tv-chart';

interface UseIsBuyModeProps {
    isProMode: boolean;
    handleFlipTokens: (config?: { isBuySellTrigger?: boolean }) => void;
    tokenFrom?: ITokenData;
    tokenTo?: ITokenData;
    selectedPool: ISimplePoolData | null;
}

const getIsBuyMode = ({
    selectedPool,
    isProMode,
    tokenFrom,
    tokenTo,
    initialIsBuyMode,
}: Omit<UseIsBuyModeProps, 'handleFlipTokens'> & { initialIsBuyMode: boolean }) => {
    if (
        !isProMode || !tokenFrom || !tokenTo
    ) return true;

    const [tokenA, tokenB] = SwapUrlService.tokens;
    if (!tokenA || !tokenB) return true;

    if (!selectedPool) {
        return initialIsBuyMode;
    }

    const checkSameTokens = (tokens: [string, string]) => (
        (
            selectedPool.tokenANative?.contract === tokens[0]
            || selectedPool.tokenA?.contract === tokens[0]
        )
        && (
            selectedPool.tokenBNative?.contract === tokens[1]
            || selectedPool.tokenB?.contract === tokens[1]
        )
    );

    const result = SwapUrlService.isProInvertedMode
        ? checkSameTokens([tokenA, tokenB])
        : checkSameTokens([tokenB, tokenA]);

    return result;
};

const useIsBuyMode = (
    {
        handleFlipTokens,
        isProMode,
        tokenFrom,
        tokenTo,
        selectedPool,
    }: UseIsBuyModeProps,
) => {
    const [isBuyMode, setIsBuyMode] = useState(() => getIsBuyMode({
        isProMode,
        tokenFrom,
        tokenTo,
        selectedPool,
        initialIsBuyMode: true,
    }));

    const changedByUserRef = useRef(false);

    useEffect(() => {
        const listener = () => {
            if (isProMode && tokenFrom && tokenTo) {
                setIsBuyMode((prev) => getIsBuyMode({
                    isProMode,
                    tokenFrom,
                    tokenTo,
                    selectedPool,
                    initialIsBuyMode: prev,
                }));
            }
        };

        if (!changedByUserRef.current) {
            listener();
        }

        changedByUserRef.current = false;

        const unsubscribe = SwapUrlService.onModeChanged(listener);

        return unsubscribe;
    }, [isProMode, selectedPool, tokenFrom, tokenTo]);

    const setMode = useCallback((newMode: boolean) => {
        changedByUserRef.current = true;
        setIsBuyMode(newMode);
        handleFlipTokens({ isBuySellTrigger: true });
    }, [handleFlipTokens]);

    const setBuyMode = useCallback(() => {
        setMode(true);
    }, [setMode]);

    const setSellMode = useCallback(() => {
        setMode(false);
    }, [setMode]);

    return {
        isBuyMode, setBuyMode, setSellMode,
    };
};

interface UseSelectedPoolProps {
    tokenA: ITokenData | undefined;
    tokenB: ITokenData | undefined;
}

const useSelectedPool = (
    {
        tokenA, tokenB,
    }: UseSelectedPoolProps,
) => {
    const [selectedPool, setSelectedPool] = useState<ISimplePoolData | null>(null);
    const simplePools = useFetchTVCharPoolList();

    const { poolTokenA, poolTokenB } = getPossiblePoolTokenContracts({ tokenA, tokenB });

    useEffect(() => {
        if (poolTokenA && poolTokenB) {
            const pool = simplePools.find((pool) => {
                const [currentContractA, currentContractB] = [
                    pool.tokenA.contract, pool.tokenB.contract,
                ].sort();
                return currentContractA === poolTokenA && currentContractB === poolTokenB;
            }) || null;
            setSelectedPool((prev) => {
                if (!prev || !pool) return pool;

                if (
                    prev.tokenA !== pool.tokenA
                    || prev.tokenB !== pool.tokenB
                    || prev.spotPrice !== pool.spotPrice
                ) {
                    return pool;
                }

                return prev;
            });
        } else {
            setSelectedPool(null);
        }
    }, [poolTokenA, poolTokenB, simplePools]);

    return { selectedPool, setSelectedPool };
};

interface UseSelectPoolProps {
    setSelectedPool: React.Dispatch<React.SetStateAction<ISimplePoolData | null>>;
    handleSelectTokens: (data: Record<'tokenFrom' | 'tokenTo', ITokenData>) => void;
}

const useSelectPool = ({
    setSelectedPool, handleSelectTokens,
}: UseSelectPoolProps) => useCallback((pool: ISimplePoolData) => {
    const poolTokenA = pool.tokenANative || pool.tokenA;
    const poolTokenB = pool.tokenBNative || pool.tokenB;
    SwapUrlService.setProMode();
    handleSelectTokens({
        tokenFrom: poolTokenB,
        tokenTo: poolTokenA,
    });
    setSelectedPool(pool);
}, [handleSelectTokens, setSelectedPool]);

interface UseIsProModeProps {
    tokensSelected: boolean;
}

const useIsProMode = ({ tokensSelected }: UseIsProModeProps) => {
    const [isProMode, setIsProMode] = useState(() => {
        if (!tokensSelected) {
            SwapUrlService.setSimpleMode();
            return false;
        }

        return SwapUrlService.isProMode;
    });

    const toggleIsProMode = useCallback(() => {
        setIsProMode((prev) => {
            const newValue = !prev;
            SwapUrlService[newValue ? 'setProMode' : 'setSimpleMode']();
            return newValue;
        });
    }, []);

    return { isProMode, toggleIsProMode };
};

export const useSwapProMode = ({
    tokenFrom,
    tokenTo,
    handleSelectTokens,
    handleFlipTokens,
}: {
    tokenFrom: ITokenData | undefined;
    tokenTo: ITokenData | undefined;
    handleSelectTokens: UseSelectPoolProps['handleSelectTokens'];
    handleFlipTokens: UseIsBuyModeProps['handleFlipTokens'];
}) => {
    const { isDesktop } = useResponsive();

    const tokensSelected = Boolean(tokenFrom && tokenTo);

    const {
        isProMode,
        toggleIsProMode,
    } = useIsProMode({ tokensSelected });

    const { selectedPool, setSelectedPool } = useSelectedPool({
        tokenA: tokenFrom,
        tokenB: tokenTo,
    });

    const { isBuyMode, ...buyModeData } = useIsBuyMode({
        isProMode, handleFlipTokens, tokenFrom, tokenTo, selectedPool,
    });

    const handleSelectPool = useSelectPool({
        setSelectedPool,
        handleSelectTokens,
    });

    useEffect(() => SwapUrlService.resetState, []);

    return {
        isProMode,
        toggleIsProMode,
        showChart: tokensSelected && isProMode && isDesktop,
        selectedPool,
        poolNotExist: !selectedPool,
        isBuyMode,
        ...buyModeData,
        poolTokens: {
            tokenA: isBuyMode ? tokenTo : tokenFrom,
            tokenB: isBuyMode ? tokenFrom : tokenTo,
        },
        handleSelectPool,
    };
};

export type UseSwapProModeReturnType = ReturnType<typeof useSwapProMode>;
