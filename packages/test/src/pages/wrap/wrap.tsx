import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useInject, useMaxValues } from '@app/framework';
import { observer } from 'mobx-react-lite';
import Widget from '../../components/molecules/widget/widget.component';
import {
    EButtonSize, EButtonType, ESvgIconType, SvgIcon,
} from '../../components/atoms';
import { useActionBtnData } from './use-action-btn-data';
import { useWrapForm } from './use-wrap-hooks';
import s from './wrap.module.scss';
import TokensForm from '../../features/token/tokens-form/tokens-form';
import { WalletGuardButton } from '../../components/molecules/wallet-guard-button';
import { IWalletStore } from '../../features/wallet';
import { Dx25Stores } from '../../constants/store.constants';
import { Cloud } from '../../components/molecules';
import { config } from '../../config';
import TransactionInfo from './components/transaction-info/transaction-info';
import { capitalizeFirstLetter } from '../../utils/string-utils';
import { PageWrapper } from '../../components/layout/page-wrapper';
import { TokensFormPropsI } from '../../features/token/tokens-form';
import { MAX_WRAP_GAS_FEE_ERD } from '../../constants/gas-fee.constants';

interface IWrapPage {
    isWrapDefault: boolean;
    onSelectToken: TokensFormPropsI['onSelectToken'],
}

export const WrapPage: FC<IWrapPage> = observer(({
    isWrapDefault,
    onSelectToken,
}) => {
    const {
        handleChangeAmount,
        handleFlipTokens,
        handleWrapTokens,
        tokenFrom,
        tokenTo,
        amount,
        wrapping,
        isWrap,
        submitData,
    } = useWrapForm(isWrapDefault);

    const { maxValueFrom } = useMaxValues({
        tokenFrom,
        tokenTo,
        nativeToken: config.EGLD_TOKEN,
        fees: MAX_WRAP_GAS_FEE_ERD,
    });

    const { name: btnName, disabled: btnDisabled } = useActionBtnData({
        tokenFrom,
        tokenTo,
        amount,
        maxValueFrom,
    });

    const { t } = useTranslation();
    const { isConnected } = useInject<IWalletStore>(Dx25Stores.WALLET);

    const onWrapTokens = useCallback(() => {
        handleWrapTokens()
            .then((txHash) => {
                console.log('txHash', txHash);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [handleWrapTokens]);

    const currentProcessTitle = isWrap ? 'Wrap' : 'Unwrap';

    return (
        <PageWrapper>
            <Widget title={currentProcessTitle} dataTestId="wrap">
                <Cloud isConnected={isConnected} btnName={wrapping ? `${currentProcessTitle}ping` : t(btnName) as string} />
                <TokensForm
                    onChangeAmount={handleChangeAmount}
                    onSelectToken={onSelectToken}
                    labelFrom="Send"
                    labelTo="Receive"
                    tokenFrom={tokenFrom}
                    tokenTo={tokenTo}
                    amountFrom={amount}
                    amountTo={amount}
                    hidePrice={false}
                    dividerAction={handleFlipTokens}
                    maxValueFrom={maxValueFrom}
                    dataTestId="wrap-form"
                    mirrored
                    amountIcon={(
                        <SvgIcon
                            type={ESvgIconType.PENCIL}
                            maskClassName={s.pencil}
                        />
                    )}
                    additionalHalfBtnFrom
                    additionalMaxBtnFrom
                />
                {amount && (
                    <TransactionInfo
                        tokenFrom={tokenFrom}
                        tokenTo={tokenTo}
                    />
                )}
                <WalletGuardButton
                    type={EButtonType.COLORED}
                    size={EButtonSize.LARGE}
                    className={s.form__button}
                    disabled={btnDisabled || wrapping || submitData.disabled}
                    fullWidth
                    onClick={onWrapTokens}
                    dataTestId="wrap-wallet-guard-buttom"
                >
                    {wrapping ? `${currentProcessTitle}ping` : capitalizeFirstLetter(t(btnName) as string)}
                </WalletGuardButton>
            </Widget>
        </PageWrapper>
    );
});
