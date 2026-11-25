import React from 'react'
import { useGlobalContext } from '../../../context/GlobalProvider'
import Images from '../../../utils/Images'

const FundingChart = () => {

    const { theme } = useGlobalContext()

    return (
        <div>
            <img src={theme == 'dark' ? Images.chartDark : Images.chartDark} alt="FundingChart" />

        </div>
    )
}

export default FundingChart
