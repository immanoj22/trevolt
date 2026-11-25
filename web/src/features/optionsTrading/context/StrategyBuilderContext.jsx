import React, { createContext, useContext, useState, useCallback } from 'react'

const StrategyBuilderContext = createContext(null)

let idCounter = 1

export function StrategyBuilderProvider({ children }) {
    const [contracts, setContracts] = useState([])
    const [multiplier, setMultiplier] = useState(1)

    const addContract = useCallback((contract) => {
        setContracts((pre) => [
            ...pre,
            {
                id: idCounter++,
                checked: true,
                marketOrLimit: true,
                limitPrice: "",
                showOrderBook: false,
                qty: "0.001",
                qtyUnit: "BTC",
                ...contract,
            },
        ])
    }, [])

    const removeContract = useCallback((id) => {
        setContracts((pre) => pre.filter((c) => c.id !== id))
    }, [])

    const toggleField = useCallback((id, key) => {
        setContracts((pre) => pre.map((c) => (c.id === id ? { ...c, [key]: !c[key] } : c)))
    }, [])

    const updateField = useCallback((id, key, value) => {
        setContracts((pre) => pre.map((c) => (c.id === id ? { ...c, [key]: value } : c)))
    }, [])

    const clearAll = useCallback(() => {
        setContracts([])
    }, [])

    return (
        <StrategyBuilderContext.Provider value={{
            contracts,
            addContract,
            removeContract,
            toggleField,
            updateField,
            clearAll,
            multiplier,
            setMultiplier,
        }}>
            {children}
        </StrategyBuilderContext.Provider>
    )
}

export function useStrategyBuilder() {
    const ctx = useContext(StrategyBuilderContext)
    if (!ctx) {
        throw new Error('useStrategyBuilder must be used within a StrategyBuilderProvider')
    }
    return ctx
}
