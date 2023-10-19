import {
    fromBigTokenAmount,
    IEstimateSwapWithLiquidityResponse,
    ITokenStore,
    Stores,
    useInject,
} from '@app/framework';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { ITokenData } from '../../../../api/wallet-selector-api';
import { ESvgIconType, SvgIcon, Typography } from '../../../../components/atoms';
import TransactionInfoItems from '../../../../components/molecules/transaction-info/transaction-info-items';
import { config } from '../../../../config';
import { Namespaces, SwapLocales } from '../../../../constants/localization';
import { toPercentage } from '../../../../utils/convert-percentage';
import { NumberFormatter } from '../../../../utils/number-formatting';
import { getSwapPriceString } from './helpers';
import s from './transaction-info.module.scss';

interface ITransactionInfo {
    tokenFrom?: ITokenData | undefined;
    tokenTo?: ITokenData | undefined;
    amountFrom: string;
    amountTo: string;
    slippage: number;
    estimatedData: IEstimateSwapWithLiquidityResponse | undefined;
    totalGasFee: number;
    isCurrentEstimationFrom: boolean;
    proMode?: boolean;
}

const format = NumberFormatter();

const TransactionInfo: React.FC<ITransactionInfo> = ({
    tokenFrom,
    tokenTo,
    amountFrom,
    amountTo,
    slippage,
    estimatedData,
    totalGasFee,
    isCurrentEstimationFrom,
    proMode,
}) => {
    const hasEstimation = !!estimatedData && Number(amountFrom) && Number(amountTo);

    const { t } = useTranslation(Namespaces.SWAP);
    const [infoMenuOpen, setInfoMenuOpen] = React.useState(false);
    const { prices } = useInject<ITokenStore>(Stores.TOKEN);
    const wrappedEgldContract = config.WRAPPED_EGLD_TOKEN.contract;
    const price = +prices[wrappedEgldContract];
    const fee = fromBigTokenAmount(config.EGLD_TOKEN.decimals, totalGasFee.toString());

    const priceImpactPercentage = hasEstimation
        ? +(+estimatedData.price_impact * 100).toFixed(2)
        : '0';
    const amountAfterSlippage = hasEstimation
        ? format.significant(estimatedData?.amount_b_bound)
        : '0';

    const feePercentage = hasEstimation
        ? toPercentage(+estimatedData.fee_amount, +amountFrom)
        : '0';

    const estimatedTokenSymbol = (isCurrentEstimationFrom ? tokenTo : tokenFrom)?.symbol || '';

    const transactionInfoItems = React.useMemo(
        () => [
            {
                id: 1,
                title: t(SwapLocales.FORM__ESTIMATION__ESTIMATED_SWAP_FEE),
                value: `${feePercentage}%`,
            },
            {
                id: 2,
                title: t(SwapLocales.FORM__ESTIMATION__PRICE_IMPACT),
                value: `${priceImpactPercentage}%`,
            },
            {
                id: 4,
                title: isCurrentEstimationFrom
                    ? t(SwapLocales.FORM__ESTIMATION__MIN_RECEIVED_AFTER_SLIPPAGE)
                    : t(SwapLocales.FORM__ESTIMATION__MAX_SEND_AFTER_SLIPPAGE),
                value: amountAfterSlippage,
                symbol: <>
                    {` ${estimatedTokenSymbol} (slippage `}
                    <span className={s.black}>
                        {`${slippage}%`}
                    </span>
                    )
                    {/* eslint-disable-next-line react/jsx-closing-tag-location */}
                </>,
            },
            {
                id: 5,
                title: t(SwapLocales.FORM__ESTIMATION__MAXIMUM_TRANSACTION_COST),
                value: `${format.currency(hasEstimation ? price * Number(fee) : '0')}
                            ${' / '}
                            ${hasEstimation ? fee : '0'}
                            ${' '}`,
                symbol: 'EGLD',
            },
        ],
        [
            amountAfterSlippage,
            fee,
            feePercentage,
            hasEstimation,
            isCurrentEstimationFrom,
            price,
            priceImpactPercentage,
            estimatedTokenSymbol,
            slippage,
            t,
        ],
    );

    return (
        <div className={s.root}>
            {proMode ? null : (
                <div
                    role="button"
                    tabIndex={0}
                    className={s.wrapper}
                    onClick={() => setInfoMenuOpen(!infoMenuOpen)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            setInfoMenuOpen(!infoMenuOpen);
                        }
                    }}
                >
                    <div className={s.left}>
                        <SvgIcon type={ESvgIconType.INFO} maskClassName={s.left_icon_color} />
                        <Typography type="main" size="text-xs" className={s.text}>
                            {getSwapPriceString({
                                tokenFrom, tokenTo, swapPrice: estimatedData?.swap_price,
                            })}
                        </Typography>
                    </div>
                    <SvgIcon
                        type={ESvgIconType.EXPAND_MORE}
                        mainClassName={classNames(s.icon)}
                        maskClassName={classNames(s.icon_color)}
                    />
                </div>
            )}
            {proMode || infoMenuOpen ? (
                <TransactionInfoItems
                    title={t(SwapLocales.FORM__ESTIMATION__TITLE) as string}
                    items={transactionInfoItems}
                    className={s.transaction_info}
                />
            ) : null}
        </div>
    );
};

export default observer(TransactionInfo);
