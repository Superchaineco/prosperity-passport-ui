import React from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Claim from '../components/airdrop'

const Airdrop: NextPage = () => {
  return (
    <>
      <Head>
        <title>Super Account - Airdrop</title>
      </Head>

      <main>
        <Claim />
      </main>
    </>
  )
}

export default Airdrop
