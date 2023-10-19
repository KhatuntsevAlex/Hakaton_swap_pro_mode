/* eslint-disable import/no-extraneous-dependencies */
import {
    Apis,
    ILoggerApi,
    ITokenStore,
    ResponsiveProvider,
    Stores,
    useInject,
    useInjector,
} from '@app/framework';
import { autorun } from 'mobx';
import { StrictMode, useEffect, useRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import ContentLayout from './components/layout/content-layout/content-layout';
import { PageLayout } from './components/layout/page-layout';
import { QRCodeModal, qrCodeModalRef } from './components/molecules/qr-code-modal';
import { SENTRY_DSN } from './constants/sentry.constants';
import { Dx25Stores } from './constants/store.constants';
import HeaderContainer from './containers/header-container';
import { ITimerStore } from './features/timer';
import './i18next';
import { MainRouter } from './routes/main';
import { config } from './store';
import { HwStepsController } from './features/hardware-wallet/containers/hw-steps-controller';
import WithdrawalContainer from './features/withdrawal/containers/withdrawal-container';

import 'react-toastify/scss/main.scss';
import './styles/app.scss';

const isMaintenance = !!localStorage.getItem('dx25/maintenance');

function App() {
    const disableReRender = useRef(true);

    const injector = useInjector();

    autorun(() => {
        injector.setDependencies(config);
    });

    useEffect(() => {
        injector
            .getDependency<ILoggerApi>(Apis.LOGGER)
            .init(SENTRY_DSN, import.meta.env.VITE_ENV_NAME);
    }, [injector]);

    const { start, addListener, stop } = useInject<ITimerStore>(Dx25Stores.TIMER);

    const { updateAllBalances } = useInject<ITokenStore>(Stores.TOKEN);

    useEffect(() => {
        if (disableReRender.current) {
            addListener(updateAllBalances);
            start();
            disableReRender.current = false;
        }

        return () => {
            stop();
        };
    }, [addListener, start, updateAllBalances, stop]);

    return (
        <StrictMode>
            <BrowserRouter>
                <ResponsiveProvider>
                    {/* <DappProvider

                    environment={EnvironmentsEnum.testnet}
                    customNetworkConfig={{
                        name: 'customConfig',
                        walletConnectV2ProjectId,
                    }}
                > */}
                    <PageLayout>
                        <HeaderContainer />
                        <ContentLayout>
                            <MainRouter isMaintenance={false} />
                        </ContentLayout>
                    </PageLayout>
                    <WithdrawalContainer />
                    <ToastContainer
                        hideProgressBar
                        autoClose={5000}
                        toastClassName="toaster"
                        icon={false}
                        closeButton={false}
                    />
                    <QRCodeModal forwardedRef={qrCodeModalRef} />
                    <HwStepsController />
                </ResponsiveProvider>
            </BrowserRouter>
        </StrictMode>
    );
}

export default App;
