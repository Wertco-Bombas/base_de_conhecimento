import { useState } from "react";
import Layout from "../components/Layout";


const ERROS = {

    "01":"Bico bloqueado pelo console ou console não autorizou",
    "02":"Preço zerado",
    "03":"Transbordamento na operação de predeterminação",
    "04":"Falha no encoder magnético do transdutor",
    "05":"Falha de retrocesso irregular no dispositivo transdutor",
    "06":"Campo magnético externo detectado",
    "07":"Bico bloqueado por limite de volume",
    "0B":"Número de bico não cadastrado",
    "0D":"Fluxo de produto com bico no descanso",
    "EJ":"Bomba bloqueada por motivo metrológico",
    "EE":"Erro memória EEPROM ausente",
    "F0":"Sobrecarga na fonte",
    "F9":"Bateria ausente ou baixa",
    "FF":"Falha comunicação Controladora/interface"

};



export default function AnalisadorLog(){


    const [arquivo,setArquivo] = useState(null);

    const [resultado,setResultado] = useState([]);

    const [filtroBico,setFiltroBico] = useState("");

    const [somenteErro,setSomenteErro] = useState(false);

    const [valorMin,setValorMin] = useState("");

    const [volumeMin,setVolumeMin] = useState("");





    function lerArquivo(e){


        const file = e.target.files[0];


        if(!file)
            return;


        setArquivo(file);



        const reader = new FileReader();



        reader.onload=function(event){


            analisar(event.target.result);


        };



        reader.readAsText(file);


    }





    function analisar(texto){


        const linhas = texto.split("\n");

        let eventos=[];



        linhas.forEach(linha=>{


            linha=linha.trim();



            // Registro de abastecimento

            if(linha.startsWith("&")){


                let venda = linha.match(/Sale N:(\d+)/);

                let valor = linha.match(/\$\:([\d.]+)/);

                let volume = linha.match(/V\:([\d.]+)/);

                let bico = linha.match(/B:(\d+)/);

                let preco = linha.match(/PA:\s*([\d.]+)/);

                let total = linha.match(/Vt:\s*([\d,\.]+)/);



                eventos.push({

                    tipo:"Abastecimento",

                    original:linha,

                    hora:linha.substring(1,9),

                    venda:venda ? venda[1] : "",

                    valor:valor ? Number(valor[1]) : 0,

                    volume:volume ? Number(volume[1]) : 0,

                    bico:bico ? bico[1] : "",

                    preco:preco ? preco[1] : "",

                    total:total ? total[1] : "",

                    erro:null

                });


            }




            // Procura erros

            Object.keys(ERROS).forEach(codigo=>{


                if(linha.includes(codigo)){


                    eventos.push({

                        tipo:"Erro",

                        original:linha,

                        codigo,

                        descricao:ERROS[codigo],

                        erro:true

                    });


                }


            });



        });



        setResultado(eventos);


    }






    const filtrados = resultado.filter(item=>{


        if(filtroBico && item.bico !== filtroBico)
            return false;


        if(somenteErro && !item.erro)
            return false;



        if(valorMin && item.valor < Number(valorMin))
            return false;



        if(volumeMin && item.volume < Number(volumeMin))
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
onChange={lerArquivo}
/>


{arquivo && (

<p>
Arquivo: {arquivo.name}
</p>

)}


</div>





{resultado.length>0 && (


<div style={styles.card}>


<h2>
Filtros
</h2>


<select
style={styles.input}
value={filtroBico}
onChange={e=>setFiltroBico(e.target.value)}
>

<option value="">
Todos os bicos
</option>


{[...new Set(
resultado
.filter(x=>x.bico)
.map(x=>x.bico)
)]
.map(b=>(

<option key={b}>
Bico {b}
</option>

))}


</select>




<label>

<input
type="checkbox"
checked={somenteErro}
onChange={e=>setSomenteErro(e.target.checked)}
/>

 Mostrar somente erros

</label>



<input
style={styles.input}
placeholder="Valor mínimo"
value={valorMin}
onChange={e=>setValorMin(e.target.value)}
/>




<input
style={styles.input}
placeholder="Volume mínimo"
value={volumeMin}
onChange={e=>setVolumeMin(e.target.value)}
/>



</div>

)}







{filtrados.length>0 && (


<div style={styles.card}>


<h2>
Resultado
</h2>


<p>
Eventos encontrados: {filtrados.length}
</p>



{filtrados.map((item,index)=>(


<div key={index} style={styles.linha}>


{
item.erro ? (

<>
⚠️ ERRO {item.codigo}
<br/>
{item.descricao}
<br/>
{item.original}
</>

)

:(

<>
⛽ Bico: {item.bico}
<br/>
Venda: {item.venda}
<br/>
Valor: R$ {item.valor}
<br/>
Volume: {item.volume} L
<br/>
Preço: {item.preco}
<br/>
Hora: {item.hora}
</>

)

}



</div>


))}


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

marginBottom:10,

background:"#222",

color:"#fff",

border:"1px solid #444",

borderRadius:5

},


linha:{


background:"#000",

padding:15,

marginBottom:10,

borderRadius:5,

fontFamily:"monospace",

fontSize:13,

color:"#FFD600"

}


};
