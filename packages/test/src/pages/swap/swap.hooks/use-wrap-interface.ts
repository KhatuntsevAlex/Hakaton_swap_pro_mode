import { ITokenData } from '@app/framework';
import { config } from '../../../config';

const { EGLD_TOKEN, WRAPPED_EGLD_TOKEN } = config;

const checkTokensForWrapInterface = ([tokenA, tokenB]: [ITokenData['contract'], ITokenData['contract']]) => (
    tokenA === EGLD_TOKEN.contract && tokenB === WRAPPED_EGLD_TOKEN.contract
);

export const checkWrapInterface = (tokenFrom?: ITokenData['contract'], tokenTo?: ITokenData['contract']) => {
    const result = {
        isWrapInterface: false,
        isFromNativeToken: tokenFrom === EGLD_TOKEN.contract,
    };

    if (!tokenFrom || !tokenTo) return result;

    result.isWrapInterface = (
        checkTokensForWrapInterface([tokenFrom, tokenTo])
        || checkTokensForWrapInterface([tokenTo, tokenFrom])
    );

    return result;
};
