import { UseSwapProModeReturnType } from '@app/framework';
import classNames from 'classnames';
import { FC } from 'react';
import {
    ESvgIconType, SvgIcon, Toggle, Typography,
} from '../../../../components/atoms';
import { UseAmountsT } from '../../swap.hooks';
import { SlippageTolerance } from '../../../../components/molecules/slippage-tolerance';

import s from './swap-widget-actions.module.scss';

interface SwapWidgetActionsProps extends Pick<UseAmountsT, 'slippage' | 'handleChangeSlippage' | 'estimating'>,
    Pick<UseSwapProModeReturnType, 'isProMode' | 'showChart' | 'toggleIsProMode'> {
        onChangeBaseToken: VoidFunction;
        showProModeToggle: boolean;
}

const SwapWidgetActions: FC<SwapWidgetActionsProps> = ({
    slippage,
    handleChangeSlippage,
    estimating,
    isProMode,
    showChart,
    showProModeToggle,
    onChangeBaseToken,
    toggleIsProMode,
}) => (
    <div className={s.widget_actions}>
        <div className={s.widget_actions_item}>
            <Typography size="text-mono-xs" upper>
                {`SLIPPAGE TOLERANCE: ${slippage}%`}
            </Typography>
            <SlippageTolerance
                onChange={handleChangeSlippage}
                value={slippage}
                pending={estimating}
                dataTestId="swap-slippage-tolerance"
            />
        </div>
        {isProMode ? (
            <div className={classNames(s.widget_actions_item, { [s.padding_right]: showChart })}>
                {showChart ? (
                    <Typography size="text-mono-xs" upper>
                                        CHANGE BASE TOKEN
                    </Typography>
                ) : null}
                <SvgIcon
                    type={ESvgIconType.FLIP_IN_CIRCLE_FILLED}
                    maskClassName={s.flip_tokens_icon}
                    onClick={onChangeBaseToken}
                    dataTestId="flip-tokens"
                    noFilter
                />
            </div>
        ) : null}
        {showProModeToggle ? (
            <Toggle
                labelNode={(
                    <Typography size="text-mono-xs" upper>
                                                PRO MODE
                    </Typography>
                )}
                checked={isProMode}
                onToggle={toggleIsProMode}
                testId="pro-mode-toggle"
            />
        ) : null}
    </div>
);

export default SwapWidgetActions;
