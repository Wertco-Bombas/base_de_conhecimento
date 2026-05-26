import Head from 'next/head';
import '../styles/globals.css';
import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function App({ Component, pageProps }) {

  useEffect(() => {
    // 🔥 Garante sincronização global de auth (EVITA LOOP)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {

      if (event === 'SIGNED_OUT') {
        // limpa estado global do browser
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
      }

    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}
