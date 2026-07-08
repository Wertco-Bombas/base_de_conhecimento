import { useState } from "react";
import Layout from "../components/Layout";


const ERROS = {

    "01":"Bico bloqueado pelo console ou console não autorizou",
    "02":"Preço zerado",
    "03":"Transbordamento na operação",
    "04":"Falha no encoder magnético",
    "05":"Falha de retrocesso irregular",
    "06":"Campo magnético externo detectado",
    "07":"Bico bloqueado por limite de volume",
    "0B":"Número de bico não cadastrado",
    "0D":"Fluxo com bico no descanso",
    "EJ":"Bomba bloqueada por motivo metrológico",
    "EE":"Erro memória EEPROM",
    "F0":"Sobrecarga na fonte",
    "F9":"Bateria ausente ou baixa",
    "FF":"Falha comunicação Controladora"

};



export default function AnalisadorLog(){


const [arquivo,setArquivo]=useState(null);

const [texto,setTexto]=useState("");

const [resultado,setResultado]=useState([]);


const [filtroBico,setFiltroBico]=useState("");

const [somenteErro,setSomenteErro]=useState(false);



function selecionarArquivo(e){

    const file=e.target.files[0];

    if(!file)
        return;


    setArquivo(file);


    const reader=new FileReader();


    reader.onload=(event)=>{

        setTexto(event.target.result);

    };


    reader.readAsText(file);

}





function carregarLog(){


    if(!texto){

        alert("Selecione um arquivo primeiro.");

        return;

    }


    analisar(texto);


}







function analisar(texto){


const linhas=texto.split(/\r?\n/);


let eventos=[];



linhas.forEach(linha=>{


linha=linha.trim();



if(linha.startsWith("&")){


const venda =
linha.match(/Sale\s*N\s*:\s*(\d+)/i);


const valor =
linha.match(/\$\s*:\s*([\d.,]+)/);



const volume =
linha.match(/\bV\s*:\s*([\d.,]+)/);



const bico =
linha.match(/\bB\s*:\s*(\d+)/);



const preco =
linha.match(/PA\s*:\s*([\d.,]+)/);



const total =
linha.match(/Vt\s*:\s*([\d.,]+)/);





eventos.push({

tipo:"Abastecimento",

original:linha,

hora:linha.substring(1,9),

venda:venda ? venda[1] : "",

valor:valor ? Number(valor[1].replace(",",".")) : 0,

volume:volume ? Number(volume[1].replace(",",".")) : 0,

bico:bico ? bico[1] : "",

preco:preco ? preco[1] : "",

total:total ? total[1] : ""

});


}






Object.keys(ERROS).forEach(codigo=>{


if(linha.includes(codigo)){


eventos.push({

tipo:"Erro",

erro:true,

codigo,

descricao:ERROS[codigo],

original:linha


});


}


});



});



setResultado(eventos);


}







const filtrados=resultado.filter(item=>{


if(filtroBico && item.bico!==filtroBico)
return false;


if(somenteErro && !item.erro)
return false;


return true;


});







return (

<Layout>


<div style={styles.container}>


<h1>
📝 Analisador de Log
</h1>




<div style={styles.card}>


<h2>
Selecionar arquivo TXT
</h2>


<input
type="file"
accept=".txt"
onChange={selecionarArquivo}
/>



<br/><br/>



<button
style={styles.button}
onClick={carregarLog}
>

Carregar Log

</button>



</div>







{resultado.length>0 && (


<div style={styles.card}>


<h2>
Filtros
</h2>




<select

style={styles.input}

value={filtroBico}

onChange={(e)=>setFiltroBico(e.target.value)}

>


<option value="">
Todos os bicos
</option>


{

[...new Set(

resultado

.filter(x=>x.bico)

.map(x=>x.bico)

)]

.map(b=>(

<option key={b} value={b}>

Bico {b}

</option>


))


}



</select>




<label>


<input

type="checkbox"

checked={somenteErro}

onChange={(e)=>setSomenteErro(e.target.checked)}

/>


Somente erros


</label>



<br/><br/>



<button

style={styles.button}

onClick={()=>{

setFiltroBico("");

setSomenteErro(false);

}}

>

Limpar filtros

</button>



</div>


)}









{filtrados.length>0 && (


<div style={styles.card}>


<h2>
Resultado
</h2>


<p>
Encontrados: {filtrados.length}
</p>




{

filtrados.map((item,index)=>(


<div

key={index}

style={styles.linha}

>


{

item.erro ?


<>

⚠️ ERRO {item.codigo}

<br/>

{item.descricao}

<br/>

{item.original}

</>


:


<>

⛽ Bico: {item.bico}

<br/>

Venda: {item.venda}

<br/>

Hora: {item.hora}

<br/>

Valor: R$ {item.valor}

<br/>

Volume: {item.volume} L

<br/>

Preço: {item.preco}

</>


}


</div>


))


}



</div>


)}




</div>


</Layout>

);


}






const styles={


container:{
padding:20
},


card:{

background:"#111",

border:"1px solid #333",

padding:20,

borderRadius:10,

marginBottom:20

},


input:{

width:"100%",

padding:10,

background:"#222",

color:"#fff",

marginBottom:10

},


button:{

background:"#FFD600",

color:"#000",

border:"none",

padding:"10px 20px",

borderRadius:8,

cursor:"pointer"

},


linha:{

background:"#000",

padding:15,

marginBottom:10,

borderRadius:5,

fontFamily:"monospace",

color:"#FFD600"

}


};
