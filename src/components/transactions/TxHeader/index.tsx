import type { ReactElement, ReactNode } from 'react'

import PageHeader from '@/components/common/PageHeader'

const TxHeader = ({ children }: { children?: ReactNode }): ReactElement => {
  return <PageHeader noBorder={true} title="Transactions History" />
}

export default TxHeader
