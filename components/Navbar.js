import Link from 'next/link';
import useUser from '../lib/useUser';

export default function Navbar() {
  const user = useUser();

  return (
    <div style={styles.nav}>

      <h3 style={{ color: '#f5c400' }}>
        Sistema
      </h3>


      <Link href="/menu">
        Menu
      </Link>


      <Link href="/base">
        📚 Base de Conhecimento
      </Link>


      <Link href="/informacoes">
        ℹ️ Informações
      </Link>


      <Link href="/approval">
        ✅ Aprovação
      </Link>


      <Link href="/instrucoes">
        📄 Instruções de Trabalho
      </Link>


      <Link href="/analisador-log">
        🔍 Analisador de Log
      </Link>


      <Link href="/tecnicos">
        ⭐ Avaliação de Técnicos
      </Link>


      {(user?.role === 'admin' || user?.role === 'supervisor') && (

        <Link href="/usuarios">
          👥 Usuários
        </Link>

      )}


      <div style={{ marginTop: 'auto' }}>

        {user && (

          <p style={{ fontSize:12 }}>
            {user.name || user.email}
          </p>

        )}

      </div>

    </div>
  );
}



const styles = {

  nav: {

    width:200,

    background:'#111',

    padding:15,

    display:'flex',

    flexDirection:'column',

    gap:10

  }

};
