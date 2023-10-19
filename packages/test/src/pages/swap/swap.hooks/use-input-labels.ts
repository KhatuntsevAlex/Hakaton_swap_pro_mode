import { getInject, ITokenStore, Stores } from '@app/framework';
import { useEffect } from 'react';
import { UseAmountsT } from './use-swap-form';

type UseInputLabelsProps = Pick<UseAmountsT, 'amountFrom' | 'amountTo' | 'tokenFrom' | 'tokenTo' | 'isEstimationFromRef'>

export const useInputLabels = ({
    amountFrom,
    amountTo,
    tokenFrom,
    tokenTo,
    isEstimationFromRef,
}: UseInputLabelsProps) => {
    const { updateAllBalances } = getInject<ITokenStore>(Stores.TOKEN);

    useEffect(() => {
        const timer = setTimeout(updateAllBalances, 500);
        return () => {
            clearTimeout(timer);
        };
    }, [amountFrom, amountTo, tokenFrom, tokenTo, updateAllBalances]);

    return (!parseFloat(amountFrom) && !parseFloat(amountTo)) || !tokenFrom || !tokenTo ? {
        to: 'Get',
        from: 'Send',
    } : {
        to: isEstimationFromRef.current ? 'Approximately Get' : 'Exactly Get',
        from: isEstimationFromRef.current ? 'Exactly Send' : 'Approximately Send',
    };
};
