import {
    ISimplePoolData,
    ITokenData,
    useTVChartPoolData,
} from '@app/framework';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { Typography } from '../../../components/atoms';
import { Percentage } from '../../../components/atoms/percentage';
import Tooltip from '../../../components/atoms/tooltip/tooltip';
import { NumberFormatter } from '../../../utils';
import { TVChartProps } from '../tv-chart.types';
import { PoolSelector } from './pool-selector';

import s from './tv-chart.header.module.scss';

const format = NumberFormatter();

interface InfoCellProps {
    label: string;
    value: string | undefined;
    testId: string;
    token?: ITokenData;
    percentage?: string;
}

const pickClassName = (value?: number | string) => {
    const val = Number(value);

    if (val > 0) {
        return s.diffPlus;
    }
    if (val < 0) {
        return s.diffMinus;
    }
    return '';
};

const InfoCell: FC<InfoCellProps> = ({
    label, value, testId, token, percentage,
}) => (
    <div className={s.info_cell}>
        <Typography className={s.info_cell_label} size="text-mono-xs" upper>
            {token ? `${label} (${token.symbol})` : label}
        </Typography>
        <div className={classNames(s.info_cell_value, pickClassName(percentage))}>
            <Typography type="secondary" size="text-m">
                <Tooltip
                    content={format.locale(value || 0)}
                    disable={!+(value || 0)}
                    testId={testId}
                >
                    {!value ? '--' : `${format.significant(value, 4)}`}
                </Tooltip>
            </Typography>
            {percentage ? <Percentage value={percentage} /> : null}
        </div>
    </div>
);

export interface TVChartHeaderProps extends TVChartProps {
    onSelectPool?: (pool: ISimplePoolData) => void;
}

const TVChartHeader: FC<TVChartHeaderProps> = ({ onSelectPool, tokenA, tokenB }) => {
    const data = useTVChartPoolData({ tokenA, tokenB });

    return (
        <div className={s.tv_chart_header}>
            <PoolSelector tokenA={tokenA} tokenB={tokenB} onSelectPool={onSelectPool} />
            <div className={s.info}>
                <InfoCell
                    label="price"
                    value={data?.current}
                    testId="price_token_b"
                    token={tokenB}
                />
                <InfoCell
                    label="24h change"
                    value={data?.change}
                    percentage={data?.change_percents}
                    testId="24h_change"
                />
                <InfoCell
                    label="24h high"
                    value={data?.high}
                    testId="24h_hight_token_b"
                    token={tokenB}
                />
                <InfoCell
                    label="24h low"
                    value={data?.low}
                    testId="24h_low_token_b"
                    token={tokenB}
                />
                <InfoCell
                    label="24h vol"
                    value={data?.volume_a_24h}
                    testId="24h_vol_token_a"
                    token={tokenA}
                />
                <InfoCell
                    label="24h vol"
                    value={data?.volume_b_24h}
                    testId="24h_vol_token_b"
                    token={tokenB}
                />
            </div>
        </div>
    );
};

export default observer(TVChartHeader);
