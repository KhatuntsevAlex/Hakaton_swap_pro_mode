import { ITokenStore, Stores, useInject } from '@app/framework';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { LazyLoading } from '../../components/molecules/lazy-loading';
import { SwapPage } from './swap';

export const SwapPageContainer: FC = observer(() => {
    const {
        tokensLoaded,
    } = useInject<ITokenStore>(Stores.TOKEN);

    return tokensLoaded ? <SwapPage /> : <LazyLoading />;
});
