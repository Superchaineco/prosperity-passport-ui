import { useState, type ReactElement } from 'react'
import useSuperChainAccount from '@/hooks/super-chain/useSuperChainAccount'
import useSafeAddress from '@/hooks/useSafeAddress'
import { type ADD_EOA_INITIAL_STATE } from '@/components/common/SuperChainEOAS'
import AddEOA from './states/AddEOA'
import LoadingModal from '@/components/common/LoadingModal'
import SuccessAdded from './states/SuccessAdded'
import FailedTxnModal from '@/components/common/ErrorModal'
import { Address, encodeFunctionData } from 'viem'
import { OperationVariables, WatchQueryOptions } from '@apollo/client'
import { SUPER_CHAIN_MODULE_ABI } from '@/features/superChain/constants'
import useWallet from '@/hooks/wallets/useWallet'

export enum ModalState {
  AddEOA,
  Loading,
  Success,
  Error,
}
export type NewEOAEntry = {
  address: Address
}

const AddEOAModal = ({
  updateQuery,
  context,
  onClose,
}: {
  updateQuery: <TVars extends OperationVariables = OperationVariables>(
    mapFn: (previousQueryResult: any, options: Pick<WatchQueryOptions<TVars, any>, 'variables'>) => any,
  ) => void
  context: typeof ADD_EOA_INITIAL_STATE
  onClose: () => void
}): ReactElement => {
  const { getSponsoredCallableSuperChainSmartAccount } = useSuperChainAccount()
  const SmartAccountAddres = useSafeAddress()
  const [currentNewEOAAddress, setCurrentNewEOAAddress] = useState<Address | null>(null)
  const [modalState, setModalState] = useState<ModalState>(ModalState.AddEOA)
  const wallet = useWallet()
  const onSubmit = async (data: NewEOAEntry) => {
    if (!wallet) return
    const superChainSmartAccountSponsored = getSponsoredCallableSuperChainSmartAccount()
    try {
      setCurrentNewEOAAddress(data.address)
      setModalState(ModalState.Loading)

      const txData = encodeFunctionData({
        abi: SUPER_CHAIN_MODULE_ABI,
        functionName: 'populateAddOwner',
        args: [SmartAccountAddres as Address, data.address],
      })

      const hash = await superChainSmartAccountSponsored.callContract(wallet, SmartAccountAddres as Address, txData)
      console.log('Invite sent:', hash)
      updateQuery((data) => ({
        ownerPopulateds: [...data.ownerPopulateds, { address: data.address }],
      }))
      setModalState(ModalState.Success)
    } catch (e) {
      setModalState(ModalState.Error)
    }
  }
  const handleRetry = async () => {
    if (!currentNewEOAAddress) return
    onSubmit({ address: currentNewEOAAddress })
  }

  const onCloseAndClear = () => {
    setModalState(ModalState.AddEOA)
    setCurrentNewEOAAddress(null)
    onClose()
  }

  return (
    <>
      {modalState === ModalState.AddEOA && <AddEOA onSubmit={onSubmit} onClose={onCloseAndClear} context={context} />}
      {modalState === ModalState.Loading && <LoadingModal open={context.open} title="Inviting EOA" />}
      {modalState === ModalState.Success && <SuccessAdded onClose={onCloseAndClear} context={context} />}
      {modalState === ModalState.Error && (
        <FailedTxnModal handleRetry={handleRetry} open={context.open} onClose={onCloseAndClear} />
      )}
    </>
  )
}

export default AddEOAModal
