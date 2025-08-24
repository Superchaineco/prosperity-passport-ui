import type { NextPage } from 'next'
import Head from 'next/head'

import Badges from '@/components/badges'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Prosperity Pass - Season 1 Badges</title>
      </Head>

      <main>
        <Badges season={{ code: 1, name: 'Season 1' }} />
      </main>
    </>
  )
}

export default Home
