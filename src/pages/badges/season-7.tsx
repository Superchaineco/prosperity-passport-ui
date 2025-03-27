import type { NextPage } from 'next'
import Head from 'next/head'

import Badges from '@/components/badges'

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Super Account - Season 7 Badges</title>
      </Head>

      <main>
        <Badges season={{ code: 7, name: 'Season 7' }} />
      </main>
    </>
  )
}

export default Home
