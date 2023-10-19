import type { ITokenData } from '@app/framework';
import { NumberFormatter } from '../../../../utils';
import { numberToString } from '../../../../utils/number-to-string';

const format = NumberFormatter();

export const getSwapPriceString = (
    {
        tokenFrom,
        tokenTo,
        swapPrice,
        reversed,
    }: {
        tokenFrom: ITokenData | undefined;
        tokenTo: ITokenData | undefined;
        swapPrice: string | number | undefined;
        reversed?: boolean;
    },
) => (!tokenFrom || !tokenTo || !swapPrice ? '' : (
    `1 ${tokenFrom?.symbol} ≈ ${format.significant(reversed ? swapPrice
        : numberToString(1 / Number(swapPrice)))} ${tokenTo?.symbol}`
));
