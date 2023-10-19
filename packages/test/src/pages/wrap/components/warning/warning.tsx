import classNames from 'classnames';
import React from 'react';
import { Typography } from '../../../../components/atoms';
import { MAX_WRAP_GAS_FEE } from '../../../../constants/gas-fee.constants';

import s from './warning.module.scss';

const Warning: React.FC = () => (
    <div className={s.info}>
        <Typography tag="div" size="text-mono-xs" type="mono" upper>
            Wrapping EGLD allows you to trade on DX25.
            {' '}
            <span className={classNames(s.info_warning)}>
            Make sure to leave
                {' '}
                {MAX_WRAP_GAS_FEE}
                {' '}
            EGLD for gas fees.
            </span>
        </Typography>
    </div>
);

export default Warning;
