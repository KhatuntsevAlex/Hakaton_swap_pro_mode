import { useCallback, useState, useEffect } from 'react';
import { ITokenData, SwapUrlService, useInject } from '@app/framework';
import { toBigTokenAmount } from '../../utils/convert-token-amount';
import { IWalletStore } from '../../features/wallet';
import { Dx25Stores } from '../../constants/store.constants';
import { wrap } from '../../services/wrap';
import { config } from '../../config';
import { MAX_WRAP_GAS_FEE_ERD } from '../../constants/gas-fee.constants';

export enum EWrapState {
    NONE,
    NO_BALANCE,
    ENTER_AMOUNT,
    SUBMIT,
}
export interface IWrapValues {
  main: number;
  wrapped: number;
}

export const useWrapForm = (isWrapDefault: boolean) => {
    const { getTokenData, updateAccountTokens } = useInject<IWalletStore>(Dx25Stores.WALLET);
    const [tokenA, setTokenA] = useState<ITokenData | undefined>();
    const [tokenB, setTokenB] = useState<ITokenData | undefined>();
    const [isWrap, setIsWrap] = useState<boolean>(isWrapDefault);
    const [amount, setAmount] = useState<string>('');
    const [wrapping, setWrapping] = useState(false);
    const [submitData, setSubmitData] = useState<{
        disabled: boolean,
        status: EWrapState,
        error?: string | React.ReactNode,
    }>({
        disabled: false,
        status: EWrapState.NONE,
    });

    const onChangeAmount = useCallback((value: string) => {
        setAmount(value);
    }, []);

    const handleFlipTokens = useCallback(() => {
        const currentUrlTokens = SwapUrlService.tokens;
        SwapUrlService.tokens = [currentUrlTokens[1], currentUrlTokens[0]];
        setIsWrap((prev) => !prev);
    }, []);

    const updateBalances = useCallback(() =>
        updateAccountTokens([config.EGLD_TOKEN, config.WRAPPED_EGLD_TOKEN]),
    [updateAccountTokens]);

    const handleWrapTokens = useCallback(async () => {
        try {
            if (!tokenA || !tokenB || !+amount) {
                throw new Error('not enough data');
            }
            setWrapping(true);
            const txHash = await wrap(
                amount,
                isWrap ? 'wrap' : 'unwrap',
            ).then(() => {
                setAmount('');
                updateBalances();
            });
            // setTimeout(updateBalances, 500);

            setWrapping(false);
            return txHash;
        } catch (error) {
            setWrapping(false);
            return Promise.reject(error);
        }
    }, [tokenA, tokenB, amount, isWrap, updateBalances]);

    useEffect(() => {
        Promise.all([
            getTokenData(config.EGLD_TOKEN.contract),
            getTokenData(config.WRAPPED_EGLD_TOKEN.contract),
        ]).then(
            ([main, wrapped]) => {
                if (!main) return;
                setTokenA(main);
                setTokenB(wrapped);
            },
        );
    }, [getTokenData]);

    useEffect(() => {
        const balanceFrom = (isWrap ? tokenA?.available : tokenB?.available) ?? '0';
        const bigFromValue = toBigTokenAmount(config.EGLD_TOKEN.decimals, amount);
        const maxFromValue = BigInt(balanceFrom) - BigInt(isWrap ? MAX_WRAP_GAS_FEE_ERD : '0');
        const isNoBalance = amount ? BigInt(bigFromValue) > BigInt(maxFromValue) : false;

        // eslint-disable-next-line no-nested-ternary
        const status = isNoBalance
            ? EWrapState.NO_BALANCE
            : !+amount
                ? EWrapState.ENTER_AMOUNT
                : EWrapState.SUBMIT;
        const disabled = isNoBalance || !+amount;
        const error = undefined;

        setSubmitData({
            status,
            disabled,
            error,
        });
    }, [amount, isWrap, tokenA?.available, tokenB?.available]);

    return {
        handleChangeAmount: onChangeAmount,
        handleFlipTokens,
        handleWrapTokens,
        tokenFrom: isWrap ? tokenA : tokenB,
        tokenTo: !isWrap ? tokenA : tokenB,
        amount,
        wrapping,
        isWrap,
        submitData,
    };
};

export type UseAmountsT = ReturnType<typeof useWrapForm>;
