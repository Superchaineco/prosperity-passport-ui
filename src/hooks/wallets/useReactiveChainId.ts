import { useEffect, useState } from 'react'

// Define el tipo mínimo para Ethereum provider
type EIP1193Provider = {
    request: (args: { method: string }) => Promise<any>
    on: (event: string, handler: (...args: any[]) => void) => void
    removeListener: (event: string, handler: (...args: any[]) => void) => void
}

export default function useReactiveChainId(): string | undefined {
    const [chainId, setChainId] = useState<string | undefined>(undefined)

    useEffect(() => {
        const provider = window.ethereum as unknown as EIP1193Provider
        if (!provider?.on) return

        const updateChainId = (chainHex: string) => {
            const parsed = parseInt(chainHex, 16).toString()
            setChainId(parsed)
        }

        provider.request({ method: 'eth_chainId' }).then(updateChainId)
        provider.on('chainChanged', updateChainId)

        return () => {
            provider.removeListener('chainChanged', updateChainId)
        }
    }, [])

    return chainId
}
