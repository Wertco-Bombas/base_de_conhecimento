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


useEffect(()=>{
 carregarTecnicos();
},[]);



async function carregarTecnicos(){

const {data,error}= await supabase
.from("tecnicos")
.select(`
  *,
  avaliacoes_tecnicos(
    nota
  )
`)
.order("nome");


if(!error){

const lista = data.map(t=>{

const notas = t.avaliacoes_tecnicos || [];


const media = notas.length > 0

? notas.reduce((a,b)=>a+b.nota,0) / notas.length

: 0;


return {

...t,

nota_media: media.toFixed(1)

};


});


setTecnicos(lista);

}

}





 async function avaliar(id,nota){

console.log("USER ATUAL:", user);

const {data:session} = await supabase.auth.getSession();

console.log("SESSION:", session);


if(!user){

alert("Usuário não identificado");

return;

}


console.log("CLIQUE NA ESTRELA");
console.log("Técnico:", id);
console.log("Nota:", nota);
console.log("Usuário:", user);


if(!user){

alert("Usuário não identificado");
return;

}


const { data, error } = await supabase
.from("avaliacoes_tecnicos")
.insert({

    tecnico_id: id,
    usuario_id: user.id,
    nota: nota

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



const filtrados = tecnicos.filter(t=>{

return (

t.nome.toLowerCase()
.includes(busca.toLowerCase())

&&

(estado==="" || t.estado===estado)

)

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

<option value="">
Todos estados
</option>

{

[...new Set(tecnicos.map(t=>t.estado))]

.map(e=>(

<option key={e}>
{e}
</option>

))

}

</select>



<table style={styles.table}>

<thead>

<tr>

<th>Nome</th>
<th>Empresa</th>
<th>Estado</th>
<th>Média</th>
<th>Avaliar</th>

</tr>

</thead>


<tbody>


{

filtrados.map(t=>(


<tr key={t.id}>


<td>{t.nome}</td>

<td>{t.empresa}</td>

<td>{t.estado}</td>


<td>

{"⭐".repeat(Math.floor(Number(t.nota_media || 0)))}

<br/>

{t.nota_media || 0}

</td>



<td>


{

[1,2,3,4,5].map(n=>(

<button

key={n}

onClick={()=>avaliar(t.id,n)}

style={styles.star}

>

⭐

</button>


))

}


</td>


</tr>


))

}


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
color:"#fff"
},

title:{
color:"#f5c400"
},

input:{
padding:10,
margin:5,
background:"#111",
color:"#fff",
border:"1px solid #333",
borderRadius:5
},

table:{
width:"100%",
marginTop:20,
background:"#111",
color:"#fff",
borderCollapse:"collapse"
},

star:{
background:"transparent",
border:0,
cursor:"pointer",
fontSize:18
}


}
