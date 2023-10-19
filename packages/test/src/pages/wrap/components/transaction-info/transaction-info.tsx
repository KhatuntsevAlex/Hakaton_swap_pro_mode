import React from 'react';
import s from './transaction-info.module.scss';
import { ITokenData } from '../../../../api/wallet-selector-api';
import {
    ESvgIconType, SvgIcon, Typography,
} from '../../../../components/atoms';

interface ITransactionInfo {
  tokenFrom?: ITokenData | undefined
  tokenTo?: ITokenData | undefined
}
const TransactionInfo: React.FC<ITransactionInfo> = ({
    tokenFrom,
    tokenTo,
}) => (
    <div className={s.root}>
        <div className={s.wrapper}>
            <div className={s.left}>
                <SvgIcon type={ESvgIconType.INFO} maskClassName={s.left_icon_color} />
                <Typography type="main" size="text-xs" className={s.text}>
                    {`1 ${tokenFrom?.symbol} = 1 ${tokenTo?.symbol}`}
                </Typography>
            </div>
        </div>
    </div>
);

export default TransactionInfo;
