/* eslint-disable no-nested-ternary */
/* eslint-disable max-len */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import {
    Apis,
    GetActionBtnStatePropsI,
    getSwapActionBtnState,
    Stores,
    useInject,
    useMaxValues,
    useSwapProMode,
    type IErrorHandlerStore,
    type ISwapApi,
} from '@app/framework';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    EButtonSize,
    EButtonType,
    ESvgIconType,
    SvgIcon,
    Typography,
} from '../../components/atoms';
import { PageWrapper } from '../../components/layout/page-wrapper';
import { Cloud, Widget } from '../../components/molecules';
import { WalletGuardButton } from '../../components/molecules/wallet-guard-button';
import { config } from '../../config';
import { MAX_WRAP_GAS_FEE_ERD } from '../../constants/gas-fee.constants';
import { GlobalLocales, SwapLocales } from '../../constants/localization';
import { Dx25Stores } from '../../constants/store.constants';
import { TokensForm } from '../../features/token/tokens-form';
import { TVChart } from '../../features/tv-chart';
import type { IWalletStore } from '../../features/wallet';
import { WrapPage } from '../wrap/wrap';
import { BuySellSwitcher } from './components/buy-sell-switcher';
import { SwapWidgetActions } from './components/swap-widget-actions';
import { getSwapPriceString } from './components/transaction-info/helpers';
import TransactionInfo from './components/transaction-info/transaction-info';
import { useInputLabels, useSwapForm } from './swap.hooks';

import s from './swap.module.scss';

const mainButtonLocalization: GetActionBtnStatePropsI['localization'] = {
    selectToken: SwapLocales.FORM__BUTTON__SELECT_TOKEN,
    enterAmount: SwapLocales.FORM__BUTTON__ENTER_AMOUNT,
    noBalance: SwapLocales.FORM__BUTTON__NO_BALANCE,
    insufficientLiquidity: SwapLocales.FORM__BUTTON__INSUFFICIENT_LIQUIDITY,
    makeSwap: SwapLocales.FORM__BUTTON__MAKE_SWAP,
    estimating: SwapLocales.FORM__ESTIMATION__ESTIMATED_SWAP_PRICE,
    amountToSmall: SwapLocales.FORM__BUTTON__SWAP_AMOUNT_IS_TOO_SMALL,
};

export const SwapPage: FC = observer(() => {
    const { t } = useTranslation();
    const { estimate } = useInject<ISwapApi>(Apis.SWAP_API);
    const { renderErrorPopup } = useInject<IErrorHandlerStore>(Stores.ERROR_HANDLER);
    const { isConnected } = useInject<IWalletStore>(Dx25Stores.WALLET);

    const {
        handleChangeAmount,
        handleSelectToken,
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
        swapping,
        totalGasFee,
        isAmountTooSmall,
        isWrapInterface,
        isFromNativeToken,
        handleSelectTokens,
    } = useSwapForm(estimate, renderErrorPopup);

    const {
        isProMode,
        toggleIsProMode,
        showChart,
        isBuyMode,
        setBuyMode,
        setSellMode,
        poolTokens,
        handleSelectPool,
        poolNotExist,
        selectedPool,
    } = useSwapProMode({
        tokenFrom,
        tokenTo,
        handleSelectTokens,
        handleFlipTokens,
    });

    const { maxValueFrom } = useMaxValues({
        tokenFrom,
        tokenTo,
        nativeToken: config.EGLD_TOKEN,
        fees: MAX_WRAP_GAS_FEE_ERD,
    });

    const labels = useInputLabels({
        amountFrom,
        amountTo,
        tokenFrom,
        tokenTo,
        isEstimationFromRef,
    });

    const { name: btnName, disabled: btnDisabled } = getSwapActionBtnState({
        tokenFrom,
        tokenTo,
        amountFrom,
        amountTo,
        maxAmountFrom: maxValueFrom,
        estimating,
        isNoLiquidity,
        isEstimationFrom: isEstimationFromRef.current,
        estimatedData,
        isAmountTooSmall,
        nativeToken: config.EGLD_TOKEN,
        wrappedToken: config.WRAPPED_EGLD_TOKEN,
        localization: mainButtonLocalization,
    });

    const tokensSelected = !!tokenFrom && !!tokenTo;

    const amountsProvided = !!+amountFrom && !!+amountTo;

    const showTransactionInfo = isProMode || (tokensSelected && estimatedData && amountFrom && amountTo);

    const handleChangeBaseToken = useCallback(() => {
        handleFlipTokens();
    }, [handleFlipTokens]);

    return (
        <div className={s.wrapper}>
            {isWrapInterface ? (
                <WrapPage
                    isWrapDefault={isFromNativeToken}
                    onSelectToken={handleSelectToken}
                />
            ) : (
                <PageWrapper>
                    <Widget
                        action={(
                            <SwapWidgetActions
                                slippage={slippage}
                                handleChangeSlippage={handleChangeSlippage}
                                estimating={estimating}
                                isProMode={isProMode}
                                showChart={showChart}
                                showProModeToggle={tokensSelected}
                                onChangeBaseToken={handleChangeBaseToken}
                                toggleIsProMode={toggleIsProMode}
                            />
                        )}
                        title={t(GlobalLocales.TRADE) as string}
                        dataTestId="swap-widget"
                        className={classNames(s.widget, { [s.with_chart]: showChart })}
                    >
                        {showChart ? (
                            <TVChart
                                tokenA={poolTokens.tokenA}
                                tokenB={poolTokens.tokenB}
                                className={s.chart}
                                onSelectPool={handleSelectPool}
                            />
                        ) : null}
                        <div className={s.form_wrapper}>
                            <div className={s.form}>
                                {isProMode ? (
                                    <>
                                        <BuySellSwitcher
                                            {...poolTokens}
                                            isBuyMode={isBuyMode}
                                            setBuyMode={setBuyMode}
                                            setSellMode={setSellMode}
                                        />
                                        {tokensSelected && (selectedPool || poolNotExist || estimatedData) ? (
                                            <Typography
                                                type="main"
                                                size="text-xs"
                                                className={classNames(s.swap_price, { [s.orange]: poolNotExist })}
                                            >
                                                {poolNotExist ? 'This pool doesn’t exist' : (estimatedData || selectedPool) ? getSwapPriceString({
                                                    tokenFrom: poolTokens.tokenA,
                                                    tokenTo: poolTokens.tokenB,
                                                    swapPrice: amountsProvided && estimatedData ? estimatedData?.swap_price : selectedPool?.spotPrice,
                                                    reversed: amountsProvided && estimatedData ? isBuyMode : selectedPool?.tokenA.contract === poolTokens.tokenA?.contract
                                                            || selectedPool?.tokenANative?.contract === poolTokens.tokenA?.contract,
                                                }) : ''}
                                            </Typography>
                                        ) : null}
                                    </>
                                ) : (
                                    <Cloud
                                        isConnected={isConnected}
                                        btnName={swapping ? 'Swapping' : (t(btnName) as string)}
                                    />
                                )}
                                <TokensForm
                                    onChangeAmount={handleChangeAmount}
                                    onSelectToken={handleSelectToken}
                                    labelFrom={labels.from}
                                    labelTo={labels.to}
                                    tokenFrom={tokenFrom}
                                    tokenTo={tokenTo}
                                    amountFrom={amountFrom}
                                    amountTo={amountTo}
                                    hidePrice={false}
                                    dataTestId="swap"
                                    maxValueFrom={maxValueFrom}
                                    mirrored
                                    amountIcon={(
                                        <SvgIcon
                                            type={ESvgIconType.PENCIL}
                                            maskClassName={s.pencil}
                                        />
                                    )}
                                    additionalHalfBtnFrom
                                    additionalMaxBtnFrom
                                    dividerAction={isProMode ? undefined : handleChangeBaseToken}
                                />
                                {showTransactionInfo && (
                                    <TransactionInfo
                                        tokenFrom={tokenFrom}
                                        tokenTo={tokenTo}
                                        amountFrom={amountFrom}
                                        amountTo={amountTo}
                                        totalGasFee={totalGasFee}
                                        isCurrentEstimationFrom={isEstimationFromRef.current}
                                        estimatedData={estimatedData}
                                        slippage={slippage}
                                        proMode={isProMode}
                                    />
                                )}
                                <WalletGuardButton
                                    type={EButtonType.COLORED}
                                    size={EButtonSize.LARGE}
                                    className={s.form__button}
                                    disabled={btnDisabled || swapping}
                                    fullWidth
                                    onClick={handleSwapTokens}
                                    dataTestId="swap-wallet-guard-buttom"
                                >
                                    {swapping ? 'Swapping' : t(btnName)}
                                </WalletGuardButton>
                            </div>
                        </div>
                    </Widget>
                </PageWrapper>
            )}
        </div>
    );
});
