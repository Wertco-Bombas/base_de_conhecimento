
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';
import useUser from '../lib/useUser';


export default function Tecnicos() {

  const user = useUser();

  const [tecnicos,setTecnicos] = useState([]);
  const [busca,setBusca] = useState('');


  async function carregarTecnicos(){

    const {data,error}=await supabase
    .from('tecnicos')
    .select(`
      id,
      nome,
      empresa,
      estado,
      avaliacoes_tecnicos(nota)
    `)
    .order('nome');


    if(!error){

      const lista=data.map(t=>{

        let media=0;

        if(t.avaliacoes_tecnicos.length){

          media=
          t.avaliacoes_tecnicos
          .reduce((a,b)=>a+b.nota,0)
          /
          t.avaliacoes_tecnicos.length;

        }


        return {
          ...t,
          media:media.toFixed(1)
        }

      });


      setTecnicos(lista);

    }

  }


  useEffect(()=>{
    carregarTecnicos();
  },[]);



  async function avaliar(id,nota){

    await supabase
    .from('avaliacoes_tecnicos')
    .insert({

      tecnico_id:id,
      usuario_email:user.email,
      nota

    });


    carregarTecnicos();

  }



  const filtrados=tecnicos.filter(t=>

    t.nome.toLowerCase()
    .includes(busca.toLowerCase())

    ||

    t.empresa.toLowerCase()
    .includes(busca.toLowerCase())

  );


return (

<ProtectedRoute>

<Layout>


<div style={styles.container}>


<h1 style={styles.title}>
⭐ Avaliação de Técnicos
</h1>


<input

placeholder="Pesquisar técnico ou empresa"

value={busca}

onChange={e=>setBusca(e.target.value)}

style={styles.input}

/>


<table style={styles.table}>


<thead>

<tr>

<th>ID</th>
<th>Nome</th>
<th>Empresa</th>
<th>Estado</th>
<th>Média</th>
<th>Avaliar</th>

</tr>

</thead>


<tbody>


{filtrados.map(t=>(


<tr key={t.id}>


<td>{t.id}</td>

<td>{t.nome}</td>

<td>{t.empresa}</td>

<td>{t.estado}</td>


<td>

⭐ {t.media}

</td>


<td>


{[1,2,3,4,5].map(n=>(

<button

key={n}

onClick={()=>avaliar(t.id,n)}

style={styles.star}

>

⭐

</button>


))}


</td>


</tr>


))}


</tbody>


</table>



</div>


</Layout>

</ProtectedRoute>


)

}



const styles={

container:{
padding:20,
color:'#fff'
},


title:{
color:'#f5c400'
},


input:{
width:'100%',
padding:10,
marginBottom:20,
background:'#111',
border:'1px solid #333',
color:'#fff'
},


table:{
width:'100%',
background:'#111',
borderCollapse:'collapse'
},


star:{
background:'transparent',
border:0,
cursor:'pointer'
}


}
