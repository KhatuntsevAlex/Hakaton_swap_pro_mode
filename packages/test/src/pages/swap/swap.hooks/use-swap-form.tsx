import {
    ESwapType,
    Stores,
    SwapUrlService,
    useInject,
    useTokenPairState,
    type IErrorPopUpParams,
    type ISwapApi,
    type ITokenData,
    type ITokenStore,
} from '@app/framework';
import {
    useCallback, useState, useEffect, useRef,
} from 'react';
import { TokenFieldTypeT } from '../../../features/token/tokens-form';
import { swap } from '../../../services/swap';
import { toBigTokenAmount } from '../../../utils/convert-token-amount';
import { ResolveEstimation, useEstimation } from './use-estimation';
import { config } from '../../../config';
import { checkWrapInterface } from './use-wrap-interface';
import { estimateGasFeeSwap } from '../../../features/transaction/estimate-fee';

const { slippage: { default: defaultSlippage } } = config;

const getUSDCToken = (token: ITokenData) => token.symbol === 'USDC';

const getDefaultTokens = ({ findToken, getNativeToken }: Pick<ITokenStore, 'findToken' | 'getNativeToken'>) => {
    const [urlTokenA, urlTokenB] = SwapUrlService.tokens;
    let defaultTokenFrom = urlTokenA ? findToken(urlTokenA) : undefined;
    if (!defaultTokenFrom) {
        defaultTokenFrom = findToken(getUSDCToken);
    }
    let defaultTokenTo = urlTokenB ? findToken(urlTokenB) : undefined;
    if (!defaultTokenTo) {
        defaultTokenTo = getNativeToken();
    }
    if (
        urlTokenA !== defaultTokenFrom?.contract
            || urlTokenB !== defaultTokenTo?.contract
    ) {
        SwapUrlService.tokens = [defaultTokenFrom?.contract || '', defaultTokenTo?.contract || ''];
    }
    return {
        defaultTokenFrom,
        defaultTokenTo,
    };
};

export const useSwapForm = (estimate: ISwapApi['estimate'], onRenderErrorPopup: (params?: IErrorPopUpParams) => void) => {
    const { findToken, getNativeToken } = useInject<ITokenStore>(Stores.TOKEN);
    const {
        tokenFrom,
        tokenTo,
        setTokens,
    } = useTokenPairState(getDefaultTokens({ findToken, getNativeToken }));

    const tokenFromRef = useRef(tokenFrom);
    const tokenToRef = useRef(tokenTo);

    tokenFromRef.current = tokenFrom;
    tokenToRef.current = tokenTo;

    const {
        isWrapInterface,
        isFromNativeToken,
    } = checkWrapInterface(tokenFrom?.contract, tokenTo?.contract);

    const [{ amountFrom, amountTo }, setAmounts] = useState<Record<'amountFrom' | 'amountTo', string>>({
        amountFrom: '',
        amountTo: '',
    });
    const [slippage, setSlippage] = useState<number>(defaultSlippage);
    const [swapping, setSwapping] = useState(false);
    const [fetchingPrice, setFetchingPrice] = useState(false);
    const changesAfterEstimationRef = useRef<boolean>(false);
    const [totalGasFee, setTotalGasFee] = useState<number>(0);

    const resolveEstimation: ResolveEstimation = useCallback((isFrom, request, response) => {
        const expectedAmount = response?.amount_b_expected;

        setAmounts((prev) => {
            const newAmount = expectedAmount || '0';
            const key: keyof typeof prev = isFrom ? 'amountTo' : 'amountFrom';

            if (prev[key] === newAmount) return prev;

            return { ...prev, [key]: newAmount };
        });
    }, []);

    const {
        estimating,
        estimatedData,
        isEstimationFromRef,
        getEstimation,
        isNoLiquidity,
        isAmountTooSmall,
        setEstimatedData,
    } = useEstimation(estimate, resolveEstimation, onRenderErrorPopup);

    useEffect(() => {
        if (isWrapInterface) {
            setEstimatedData(undefined);
            setTotalGasFee(0);
            if (SwapUrlService.isProInvertedMode) {
                SwapUrlService.setProMode();
            }
        }
    }, [isWrapInterface, setEstimatedData]);

    useEffect(() => {
        if (!changesAfterEstimationRef.current && !isWrapInterface) {
            getEstimation({
                tokenA: tokenFrom?.contract === config.EGLD_TOKEN.contract
                    ? config.WRAPPED_EGLD_TOKEN : tokenFrom,
                tokenB: tokenTo?.contract === config.EGLD_TOKEN.contract
                    ? config.WRAPPED_EGLD_TOKEN : tokenTo,
                amountA: amountFrom,
                amountB: amountTo,
                slippage,
            });
        }
        changesAfterEstimationRef.current = false;
    }, [
        getEstimation,
        tokenFrom,
        tokenTo,
        amountFrom,
        amountTo,
        slippage,
        isWrapInterface,
        setEstimatedData,
    ]);

    useEffect(() => {
        if (tokenFrom && tokenTo && estimatedData && !isWrapInterface) {
            const { amount_b_bound: expectedB } = estimatedData;
            const expectedAmount = toBigTokenAmount(
                isEstimationFromRef.current ? tokenTo.decimals : tokenFrom.decimals,
                expectedB,
            );

            const amountA = toBigTokenAmount(tokenFrom.decimals, amountFrom);
            const amountB = toBigTokenAmount(tokenTo.decimals, amountTo);
            estimateGasFeeSwap({
                tokenA: tokenFrom,
                tokenB: tokenTo,
                amountA,
                amountB,
                expectedAmount,
            },
            isEstimationFromRef.current ? ESwapType.SELL : ESwapType.BUY)
                .then((res) => setTotalGasFee(res.totalFee));
        }
    }, [
        amountFrom,
        amountTo,
        estimatedData,
        isEstimationFromRef,
        isWrapInterface,
        tokenFrom,
        tokenTo,
    ]);

    const onChangeAmount = useCallback((value: string, field: TokenFieldTypeT) => {
        const isFrom = field === 'from';
        isEstimationFromRef.current = isFrom;
        const tokensSelected = Boolean(tokenFromRef.current && tokenToRef.current);
        setAmounts((prev) => {
            const keyA: keyof typeof prev = isFrom ? 'amountFrom' : 'amountTo';
            const keyB: keyof typeof prev = !isFrom ? 'amountFrom' : 'amountTo';
            return {
                [keyA]: value,
                // eslint-disable-next-line no-nested-ternary
                [keyB]: !tokensSelected ? '' : (!+value ? `${!value ? value : +value}` : prev[keyB]),
            } as typeof prev;
        });
    }, [isEstimationFromRef]);

    const handleChangeAmountFrom = useCallback(
        (value: string) => {
            onChangeAmount(value, 'from');
        },
        [onChangeAmount],
    );

    const handleChangeAmountTo = useCallback(
        (value: string) => {
            onChangeAmount(value, 'to');
        },
        [onChangeAmount],
    );

    const onChangeToken = useCallback((value: ITokenData, field: TokenFieldTypeT) => {
        setTokens((prev) => {
            const newTokens: typeof prev = field === 'from' ? {
                tokenFrom: value,
                tokenTo: value.contract === prev.tokenTo?.contract
                    ? prev.tokenFrom
                    : prev.tokenTo,
            } : {
                tokenTo: value,
                tokenFrom: value.contract === prev.tokenFrom?.contract
                    ? prev.tokenTo
                    : prev.tokenFrom,
            };
            SwapUrlService.tokens = [
                newTokens.tokenFrom?.contract || '',
                newTokens.tokenTo?.contract || '',
            ];

            return newTokens;
        });
    }, [setTokens]);

    const handleSelectTokenFrom = useCallback(
        (token: ITokenData) => {
            onChangeToken(token, 'from');
        },
        [onChangeToken],
    );

    const handleSelectTokenTo = useCallback(
        (token: ITokenData) => {
            onChangeToken(token, 'to');
        },
        [onChangeToken],
    );

    const handleSelectTokens = useCallback(
        (data: Record<'tokenFrom' | 'tokenTo', ITokenData | undefined>) => {
            SwapUrlService.tokens = [
                data.tokenFrom?.contract || '',
                data.tokenTo?.contract || '',
            ];
            setTokens(data);
        },
        [setTokens],
    );

    const handleChangeSlippage = useCallback((value: number) => {
        const result = value ?? defaultSlippage;
        setSlippage(result);
    }, []);

    const handleFlipTokens = useCallback((
        { isBuySellTrigger }: { isBuySellTrigger?: boolean } = {},
    ) => {
        if (tokenFromRef.current || tokenToRef.current) {
            const isPro = SwapUrlService.isProMode;
            const isProInverted = SwapUrlService.isProInvertedMode;
            if (isPro && !isBuySellTrigger) {
                SwapUrlService[isProInverted ? 'setProMode' : 'setProInvertedMode']();
                // runForceUpdate((prev) => !prev);
            }
            if (!isPro || isBuySellTrigger) {
                setAmounts({
                    amountFrom: '',
                    amountTo: '',
                });
                setEstimatedData(undefined);
            }
            setTokens((prev) => {
                if (isPro && !isBuySellTrigger) {
                    return prev;
                }
                const newTokens = {
                    tokenFrom: prev.tokenTo,
                    tokenTo: prev.tokenFrom,
                };
                SwapUrlService.tokens = [newTokens.tokenFrom?.contract || '', newTokens.tokenTo?.contract || ''];
                return newTokens;
            });
        }
    }, [setEstimatedData, setTokens]);

    const clearForm = useCallback(() => {
        setAmounts({
            amountFrom: '',
            amountTo: '',
        });
        if (!SwapUrlService.isProMode) {
            handleSelectTokens({
                tokenFrom: findToken(getUSDCToken),
                tokenTo: getNativeToken(),
            });
            setSlippage(defaultSlippage);
        }
        setEstimatedData(undefined);
    }, [setEstimatedData, handleSelectTokens, findToken, getNativeToken]);

    const handleSwapTokens = useCallback(async () => {
        if (tokenFrom && tokenTo && estimatedData) {
            const { amount_b_bound: expectedB } = estimatedData;

            const expectedAmount = toBigTokenAmount(
                isEstimationFromRef.current ? tokenTo.decimals : tokenFrom.decimals,
                expectedB,
            );

            const amountA = toBigTokenAmount(tokenFrom.decimals, amountFrom);
            const amountB = toBigTokenAmount(tokenTo.decimals, amountTo);

            try {
                setSwapping(true);
                await swap(
                    {
                        tokenA: tokenFrom,
                        tokenB: tokenTo,
                        amountA,
                        amountB,
                        expectedAmount,
                    },
                    isEstimationFromRef.current ? ESwapType.SELL : ESwapType.BUY,
                    {
                        onSubmittedCallback: () => {
                            setSwapping(false);
                            clearForm();
                        },
                        finallyCall: () => {
                            setSwapping(false);
                        },
                    },
                );
            } catch (error: any) {
                setSwapping(false);
            }
        }
    // INFO: not needed put isEstimationFromRef to the dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenFrom, tokenTo, amountFrom, amountTo, estimatedData, clearForm]);

    return {
        handleChangeAmountFrom,
        handleChangeAmountTo,
        handleChangeAmount: onChangeAmount,
        handleSelectTokenFrom,
        handleSelectTokenTo,
        handleSelectToken: onChangeToken,
        handleChangeSlippage,
        handleFlipTokens,
        handleSwapTokens,
        estimating,
        isEstimationFromRef,
        estimatedData,
        tokenFrom,
        tokenTo,
        amountFrom,
        amountTo,
        slippage,
        isNoLiquidity,
        isAmountTooSmall,
        swapping,
        totalGasFee,
        fetchingPrice,
        isWrapInterface,
        isFromNativeToken,
        handleSelectTokens,
    };
};

export type UseAmountsT = ReturnType<typeof useSwapForm>;
