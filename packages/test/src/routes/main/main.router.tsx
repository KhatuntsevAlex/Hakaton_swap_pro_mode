/* eslint-disable max-len */
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LazyLoading } from '../../components/molecules/lazy-loading';
import { Routes as Path } from '../../constants/router.constants';

const SwapPage = lazy(() => import('../../pages/swap'));

export const MainRouter = ({ isMaintenance }: { isMaintenance: boolean }) => (
    <Routes>
        <Route path={Path.HOME} element={<Navigate to={Path.SWAP} />} />
        <Route
            path={Path.SWAP}
            element={
                <Suspense fallback={<LazyLoading />}>
                    <SwapPage />
                </Suspense>
            }
        />
    </Routes>
);
