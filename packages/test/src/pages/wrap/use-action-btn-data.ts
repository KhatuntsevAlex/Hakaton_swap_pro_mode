import { ITokenData, toBigTokenAmount } from '@app/framework';
import { GlobalLocales, SwapLocales } from '../../constants/localization';

interface UseActionBtnDataPropsI {
    amount: string;
    maxValueFrom: string;
    tokenTo?: ITokenData;
    tokenFrom?: ITokenData;
}

interface UseActionBtnDataReturnTypeI {
    name: string;
    disabled: boolean;
}

type UseActionBtnDataT = (data: UseActionBtnDataPropsI) => UseActionBtnDataReturnTypeI;

export const useActionBtnData: UseActionBtnDataT = ({
    tokenFrom,
    tokenTo,
    amount,
    maxValueFrom,
}) => {
    const isTokensSelected = !!(tokenTo && tokenFrom);
    const isAmountsProvided = !!+(amount);
    const originalAmount = toBigTokenAmount(tokenFrom?.decimals as number, amount);
    const isNoBalance = +maxValueFrom < +originalAmount;

    const disabled = !isTokensSelected || !isAmountsProvided || isNoBalance;

    if (!isTokensSelected || (!isAmountsProvided && !isNoBalance)) {
        return {
            name: !isTokensSelected
                ? SwapLocales.FORM__BUTTON__SELECT_TOKEN
                : SwapLocales.FORM__BUTTON__ENTER_AMOUNT,
            disabled,
        };
    }

    if (isNoBalance) {
        return {
            name: SwapLocales.FORM__BUTTON__NO_BALANCE,
            disabled,
        };
    }

    return {
        name: GlobalLocales.SUBMIT,
        disabled,
    };
};
