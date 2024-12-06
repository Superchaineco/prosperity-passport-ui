import type { NextPage } from 'next'
import Head from 'next/head'

import Dashboard from '@/components/dashboard'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Prosperity Passport – Account</title>
      </Head>

      <main>
        <Dashboard />
      </main>
    </>
  )
}

export default Home
