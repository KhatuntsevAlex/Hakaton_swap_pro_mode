import { IEstimateSwapWithLiquidityResponse, ITokenData } from '../../../api';
import { Stores } from '../../../constants';
import { getInject } from '../../../ioc';
import { toBigTokenAmount } from '../../../utils/convert-token-amount';
import { ITokenStore } from '../../token';

interface GetIsNoBalanceForSwapPropsI {
    nativeToken: ITokenData;
    wrappedToken: ITokenData;
    tokenFrom: ITokenData | undefined;
    maxAmountFrom: string;
    amountFrom: string;
    isEstimationFrom: boolean;
    estimatedData: IEstimateSwapWithLiquidityResponse | undefined;
}

const getIsNoBalanceForSwap = ({
    tokenFrom,
    maxAmountFrom,
    amountFrom,
    isEstimationFrom,
    estimatedData,
    nativeToken,
    wrappedToken,
}: GetIsNoBalanceForSwapPropsI) => {
    let availableAmountFrom = BigInt(maxAmountFrom);
    let result = availableAmountFrom < BigInt(
        toBigTokenAmount(tokenFrom?.decimals as number, amountFrom),
    );

    if (result) return result;

    if (!isEstimationFrom && estimatedData) {
        const boundAmount = BigInt(toBigTokenAmount(
            tokenFrom?.decimals as number,
            estimatedData.amount_b_bound,
        ));

        if (tokenFrom?.contract === nativeToken.contract) {
            const { findToken } = getInject<ITokenStore>(Stores.TOKEN);

            const wrappedAmount = findToken(wrappedToken.contract)?.available || '0';
            // INFO: native token estimates as wrapped (bound will be for wrapped)
            // so available amount will be native tokens + existed wrapped (after auto wrap)
            availableAmountFrom += BigInt(wrappedAmount);
        }

        result = availableAmountFrom < boundAmount;
    }

    return result;
};

interface SwapActionBtnStateI {
  name: string;
  disabled: boolean;
}

export interface GetActionBtnStatePropsI extends GetIsNoBalanceForSwapPropsI {
  tokenTo: ITokenData | undefined;
  amountTo: string;
  estimating: boolean;
  isNoLiquidity: boolean;
  isAmountTooSmall: boolean;
  localization: Record<'selectToken' | 'enterAmount' | 'noBalance' | 'insufficientLiquidity' | 'makeSwap' | 'amountToSmall' | 'estimating', string>;
}

export const getSwapActionBtnState = ({
    tokenFrom,
    tokenTo,
    amountFrom,
    amountTo,
    isNoLiquidity,
    localization,
    isEstimationFrom,
    estimating,
    isAmountTooSmall,
    ...rest
}: GetActionBtnStatePropsI): SwapActionBtnStateI => {
    if (!tokenFrom || !tokenTo) {
        return {
            name: localization.selectToken,
            disabled: true,
        };
    }

    const isAmountsProvided = !!+(isEstimationFrom ? amountFrom : amountTo);

    const isNoBalance = getIsNoBalanceForSwap({
        tokenFrom,
        amountFrom,
        isEstimationFrom,
        ...rest,
    });

    if (!isAmountsProvided && !isNoBalance) {
        return {
            name: localization.enterAmount,
            disabled: true,
        };
    }

    if (isNoBalance) {
        return {
            name: localization.noBalance,
            disabled: true,
        };
    }

    if (estimating) {
        return {
            name: localization.estimating,
            disabled: true,
        };
    }

    if (isAmountTooSmall) {
        return {
            name: localization.amountToSmall,
            disabled: true,
        };
    }

    if (isNoLiquidity) {
        return {
            name: localization.insufficientLiquidity,
            disabled: true,
        };
    }

    return {
        name: localization.makeSwap,
        disabled: !isAmountsProvided,
    };
};
