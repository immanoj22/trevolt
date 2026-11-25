import React, { useEffect, useState } from 'react'

const useBreakpoint = () => {

    const [breakPoint, setBreakPoint] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setBreakPoint(window.innerWidth)

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return breakPoint
}

export default useBreakpoint
