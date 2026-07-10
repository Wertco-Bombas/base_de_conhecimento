import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import { supabase } from "../lib/supabaseClient";
import useUser from "../lib/useUser";


export default function Tecnicos(){

const user = useUser();

const [tecnicos,setTecnicos] = useState([]);
const [busca,setBusca] = useState("");
const [estado,setEstado] = useState("");
const [regiao, setRegiao] = useState("");
 const [notaFiltro, setNotaFiltro] = useState("");
 const [avaliacoes, setAvaliacoes] = useState({});


useEffect(()=>{
 carregarTecnicos();
},[]);



async function carregarTecnicos(){

const {data,error}= await supabase
.from("tecnicos")
.select(`

  *,
  avaliacoes_tecnicos(
    nota_eletronica,
    nota_hidraulica,
    nota_comprometimento
  )
`)
.order("nome");


if(!error){

const lista = data.map(t=>{

const notas = t.avaliacoes_tecnicos || [];

const mediaEletronica =
notas.length > 0
? notas.reduce((a,b)=>a+b.nota_eletronica,0)/notas.length
:0;

const mediaHidraulica =
notas.length > 0
? notas.reduce((a,b)=>a+b.nota_hidraulica,0)/notas.length
:0;

const mediaComprometimento =
notas.length > 0
? notas.reduce((a,b)=>a+b.nota_comprometimento,0)/notas.length
:0;

const media =
(mediaEletronica +
 mediaHidraulica +
 mediaComprometimento)/3;


return{

...t,

media_eletronica:mediaEletronica.toFixed(1),

media_hidraulica:mediaHidraulica.toFixed(1),

media_comprometimento:mediaComprometimento.toFixed(1),

nota_media:media.toFixed(1)

}


});


setTecnicos(lista);

}

}


function selecionarNota(tecnicoId, criterio, nota){

  setAvaliacoes(prev=>({

    ...prev,

    [tecnicoId]:{

      ...prev[tecnicoId],

      [criterio]:nota

    }

  }));

}


async function avaliar(id){

  console.log("USER ATUAL:", user);

  const { data: authData } = await supabase.auth.getUser();

  const usuario = authData.user;

  console.log("AUTH USER:", usuario);
  console.log("AUTH UID:", usuario?.id);


  if(!usuario){

    alert("Usuário não identificado");

    return;

  }
const notas = avaliacoes[id];

if(
!notas ||
!notas.eletronica ||
!notas.hidraulica ||
!notas.comprometimento
){

   alert("Preencha as três avaliações.");

   return;

}

  console.log("CLIQUE NA ESTRELA");
  console.log("Técnico:", id);
  console.log("Nota:", nota);
  console.log("Usuário:", usuario);


  const { data, error } = await supabase
    .from("avaliacoes_tecnicos")
.insert({

    tecnico_id: id,

    usuario_id: usuario.id,

    nota_eletronica: notas.eletronica,

    nota_hidraulica: notas.hidraulica,

    nota_comprometimento: notas.comprometimento

})
    .select();


  if(error){

    console.log("ERRO SUPABASE:", error);

    alert(
      "Erro ao salvar avaliação:\n" + error.message
    );

    return;

  }


  console.log("SALVO COM SUCESSO:", data);

  alert("Avaliação salva ⭐");


  carregarTecnicos();

}


const filtrados = tecnicos.filter((t) => {

  return (
    t.nome.toLowerCase().includes(busca.toLowerCase()) &&
    (estado === "" || t.estado === estado) &&
    (regiao === "" || t.regiao === regiao) &&
    (notaFiltro === "" || Number(t.nota_media) >= Number(notaFiltro))
  );

});



return (

<ProtectedRoute>

<Layout>

<div style={styles.container}>


<h1 style={styles.title}>
⭐ Avaliação de Técnicos
</h1>


<input
  placeholder="Buscar técnico..."
  value={busca}
  onChange={(e)=>setBusca(e.target.value)}
  style={styles.input}
/>

<select
  style={styles.input}
  value={estado}
  onChange={(e)=>setEstado(e.target.value)}
>
  <option value="">Todos estados</option>

  {[...new Set(tecnicos.map(t=>t.estado))]
    .sort()
    .map(e=>(
      <option key={e} value={e}>
        {e}
      </option>
    ))
  }
</select>

<select
  style={styles.input}
  value={regiao}
  onChange={(e)=>setRegiao(e.target.value)}
>
  <option value="">Todas regiões</option>

  {[...new Set(tecnicos.map(t=>t.regiao))]
    .sort()
    .map(r=>(
      <option key={r} value={r}>
        {r}
      </option>
    ))
  }
</select>
<select
  style={styles.input}
  value={notaFiltro}
  onChange={(e)=>setNotaFiltro(e.target.value)}
>

  <option value="">
    Todas as notas
  </option>

  <option value="5">
    ⭐ 5 estrelas
  </option>

  <option value="4">
    ⭐ 4 ou mais
  </option>

  <option value="3">
    ⭐ 3 ou mais
  </option>

  <option value="2">
    ⭐ 2 ou mais
  </option>

</select>


<div style={styles.grid}>

{
filtrados.map(t=>(

<div key={t.id} style={styles.card}>

<div style={styles.nome}>
{t.nome}
</div>

<div style={styles.info}>
🏢 {t.empresa || "Sem empresa"}
</div>

<div style={styles.info}>
📍 {t.estado} - {t.regiao}
</div>



<div style={styles.mediaBox}>

<div>
⭐ Média Geral
</div>

<h2 style={{margin:5}}>
{t.nota_media}
</h2>

<hr style={{borderColor:"#333"}}/>

<div>
⚡ Eletrônica
</div>

<strong>
{t.media_eletronica}
</strong>

<br/><br/>

<div>
🚰 Hidráulica
</div>

<strong>
{t.media_hidraulica}
</strong>

<br/><br/>

<div>
🤝 Comprometimento
</div>

<strong>
{t.media_comprometimento}
</strong>

</div>





<div style={styles.avaliarTitulo}>
Avaliar técnico
</div>


<div style={styles.avaliarTitulo}>
⚡ Eletrônica
</div>

<div style={styles.estrelas}>
{[1,2,3,4,5].map(n=>(

<button
key={n}
onClick={()=>selecionarNota(t.id,"eletronica",n)}
style={styles.star}
>

⭐

</button>

))}
</div>


<div style={styles.avaliarTitulo}>
🚰 Hidráulica
</div>

<div style={styles.estrelas}>
{[1,2,3,4,5].map(n=>(

<button
key={n}
onClick={()=>selecionarNota(t.id,"hidraulica",n)}
style={styles.star}
>

⭐

</button>

))}
</div>


<div style={styles.avaliarTitulo}>
🤝 Comprometimento
</div>

<div style={styles.estrelas}>
{[1,2,3,4,5].map(n=>(

<button
key={n}
onClick={()=>selecionarNota(t.id,"comprometimento",n)}
style={styles.star}
>

⭐

</button>

))}
</div>
 <div style={{textAlign:"center",marginTop:20}}>

<button

style={styles.salvar}

onClick={()=>avaliar(t.id)}

>

Salvar Avaliação

</button>

</div>

</div>

))

}

</div>


</div>


</Layout>

</ProtectedRoute>

)


}



const styles={

container:{
padding:20,
color:"#fff",
maxWidth:1200,
margin:"auto"
},

title:{
color:"#f5c400",
textAlign:"center",
marginBottom:25
},

input:{
padding:12,
margin:5,
background:"#111",
color:"#fff",
border:"1px solid #333",
borderRadius:8,
width:220
},

grid:{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
gap:20,
marginTop:25
},

card:{
background:"#161616",
border:"1px solid #333",
borderRadius:15,
padding:20,
boxShadow:"0 5px 15px rgba(0,0,0,.3)"
},

nome:{
fontSize:20,
fontWeight:"bold",
color:"#f5c400",
marginBottom:12
},

info:{
color:"#ccc",
marginBottom:8,
fontSize:14
},

mediaBox:{
marginTop:15,
padding:15,
background:"#0d0d0d",
borderRadius:10,
textAlign:"center",
fontSize:16
},

avaliarTitulo:{
marginTop:20,
marginBottom:10,
textAlign:"center",
color:"#aaa"
},

estrelas:{
display:"flex",
justifyContent:"center",
gap:8,
flexWrap:"nowrap"
},

star:{
background:"#222",
border:"1px solid #444",
borderRadius:50,
cursor:"pointer",
fontSize:22,
width:42,
height:42,
display:"flex",
alignItems:"center",
justifyContent:"center",
transition:"0.2s",
}
 
 salvar:{

marginTop:10,

padding:"12px 25px",

background:"#f5c400",

color:"#000",

border:0,

borderRadius:8,

cursor:"pointer",

fontWeight:"bold",

fontSize:15,

}

}
