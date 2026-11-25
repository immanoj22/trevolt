/** PACKAGE IMPORT */
import React from 'react'
import { useParams } from "react-router-dom";
import config from '../../../config/env';
import TradingViewChart from '../../futuresTrading/components/TradingViewChart';

const MobileOptionChart = (props) => {
    const { tikerRoot } = useParams()

    return (
        <div className="mobileChartPage" style={{ width: '100vw', height: '100vh' }}>
            <TradingViewChart
                symbol={tikerRoot}
                interval='5'
                containerId='tv_chart_container'
                datafeedUrl={`${config.API_URL}/option`}
                libraryPath='/charting_library/'
                chartsStorageUrl=''
                chartsStorageApiVersion='1.1'
                clientId='tradingview.com'
                userId='public_user_id'
                fullscreen={false}
                autosize={true}
                studiesOverrides=""
                theme='Dark'
                pair={tikerRoot}
                tradeType={'option'}
            />
        </div>
    )

}


export default MobileOptionChart
