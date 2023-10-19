import {
    useState, useRef, useEffect, useCallback,
} from 'react';
import {
    ITokenData,
    IErrorPopUpParams,
    IDataToSwapEstimation,
    TEstimateSwapResponse,
    IEstimateSwapWithLiquidityResponse,
    ISwapApi,
    ApiError,
} from '@app/framework';

export type ResolveEstimation = (
    isSell: boolean,
    request: IDataToSwapEstimation,
    estimatedData?: IEstimateSwapWithLiquidityResponse
) => void;

interface GetEstimationPropsI {
    tokenA?: ITokenData;
    tokenB?: ITokenData;
    amountA?: string;
    amountB?: string;
    slippage: number;
}

const parseResponse = (
    response?: TEstimateSwapResponse,
): {
    noLiquidity: boolean;
    data: IEstimateSwapWithLiquidityResponse | undefined;
} => {
    if (!response) {
        // means there is some error ocurred
        return {
            noLiquidity: false,
            data: undefined,
        };
    }

    const noLiquidity = !response.pool_exists;

    return {
        noLiquidity,
        data: noLiquidity ? undefined : response,
    };
};

export const useEstimation = (
    estimate: ISwapApi['estimate'],
    resolveEstimation: ResolveEstimation,
    onRenderErrorPopup: (params?: IErrorPopUpParams) => void,
) => {
    const [estimatedData, setEstimatedData] = useState<
        IEstimateSwapWithLiquidityResponse | undefined
    >();
    const [isNoLiquidity, setIsNoLiquidity] = useState<boolean>(false);
    const [isAmountTooSmall, setIsAmountTooSmall] = useState<boolean>(false);
    const [estimating, setEstimating] = useState<boolean>(false);

    const timeoutRef = useRef<NodeJS.Timeout>();
    const isEstimationFromRef = useRef<boolean>(true);
    const refreshLastEstimationTimerRef = useRef<NodeJS.Timeout>();

    const cleanUp = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
        if (refreshLastEstimationTimerRef.current) {
            clearTimeout(refreshLastEstimationTimerRef.current);
            refreshLastEstimationTimerRef.current = undefined;
        }
    }, []);

    useEffect(() => cleanUp, [cleanUp]);

    const onResolve = useCallback(
        (request: IDataToSwapEstimation, response?: TEstimateSwapResponse) => {
            const { noLiquidity, data } = parseResponse(response);
            setEstimating(false);
            setEstimatedData(data);
            setIsNoLiquidity(noLiquidity);
            resolveEstimation(isEstimationFromRef.current, request, data);
            return response;
        },
        [resolveEstimation],
    );

    const onEstimate = useCallback(
        (data: IDataToSwapEstimation) => {
            setEstimating(true);
            // setEstimatedData(undefined);
            setIsAmountTooSmall(false);
            cleanUp();
            estimate(data, isEstimationFromRef.current ? 'sell' : 'buy')
                .then((result) => {
                    onResolve(data, result);
                    if (result) {
                        refreshLastEstimationTimerRef.current = setTimeout(() => {
                            onEstimate(data);
                        }, 5000);
                    }
                })
                .catch((err) => {
                    setEstimating(false);
                    setEstimatedData(undefined);
                    setIsNoLiquidity(true); // todo: check other variants
                    if (err instanceof ApiError) {
                        if (err.code === '_insufficient_liquidity') {
                            setIsNoLiquidity(true);
                            return;
                        }
                        if (err.code === '_incorrect_amount') {
                            onRenderErrorPopup({ message: 'Incorrect amount. Please change the input amount.' });
                            return;
                        }
                        if (err.code === '_amount_too_big') {
                            onRenderErrorPopup({ message: 'Amount too big. Please decrease the input amount.' });
                            return;
                        }
                        if (err.code === '_swap_amount_too_small') {
                            setIsNoLiquidity(false);
                            setIsAmountTooSmall(true);
                            onRenderErrorPopup({ message: 'Amount too small. Please increase the input amount.' });
                            return;
                        }
                    }
                    onRenderErrorPopup();
                });
        },
        [estimate, onResolve, cleanUp, onRenderErrorPopup],
    );

    const getEstimation = useCallback(
        (data: GetEstimationPropsI) => {
            const isSell = isEstimationFromRef.current;
            // setEstimatedData(undefined);
            cleanUp();
            const resultData = {
                tokenA: data.tokenA,
                tokenB: data.tokenB,
                amountA: isSell ? data.amountA : data.amountB,
                slippage: data.slippage,
            } as IDataToSwapEstimation;
            if (!resultData.tokenA || !resultData.tokenB || !+(resultData.amountA || 0)) {
                setEstimating(false);
                return;
            }
            setEstimating(true);
            timeoutRef.current = setTimeout(() => {
                onEstimate(resultData);
            }, 500);
        },
        [onEstimate, cleanUp],
    );

    return {
        estimating,
        estimatedData,
        isEstimationFromRef,
        getEstimation,
        isNoLiquidity,
        isAmountTooSmall,
        setEstimatedData,
    };
};

export type UseEstimationReturnTypeT = ReturnType<typeof useEstimation>;
