import { useState } from "react";
import Layout from "../components/Layout";
import { codigosErros } from "../utils/codigosErros";


export default function AnalisadorLog(){

    const [arquivo,setArquivo] = useState(null);

    const [dados,setDados] = useState([]);

    const [erros,setErros] = useState([]);

    const [bicoFiltro,setBicoFiltro] = useState("");

    const [horaFiltro,setHoraFiltro] = useState("");

    const [dataFiltro,setDataFiltro] = useState("");

    const [grupos,setGrupos] = useState({});

    const [abertos,setAbertos] = useState({});

    const [resumoErros, setResumoErros] = useState({});
const [errosAbertos, setErrosAbertos] = useState({});

    const [infoLog, setInfoLog] = useState({
    cpu: "",
    jsonModel: "",
    chip: "",
    pci: "",
    paginas: [],
    cartoes: []
});
    
   function aplicarFiltros(grupos){

    const resultado = {};


    Object.keys(grupos).forEach(data=>{
        

        const grupo = grupos[data];


        const abastecimentos = grupo.abastecimentos.filter(item =>

            (!bicoFiltro || item.bico === bicoFiltro) &&

            (!horaFiltro || item.hora.startsWith(horaFiltro)) &&

            (!dataFiltro || item.data === dataFiltro)

        );


        const erros = grupo.erros.filter(item =>

            (!horaFiltro || item.hora.startsWith(horaFiltro)) &&

            (!dataFiltro || item.data === dataFiltro)

        );


        if(abastecimentos.length || erros.length){

            resultado[data] = {
                abastecimentos,
                erros
            };

        }


    });


    return resultado;

}



  function converterData(dataTxt){

    if(!dataTxt)
        return "Data desconhecida";


    const meses = {

        JAN:"01",
        FEB:"02",
        MAR:"03",
        APR:"04",
        MAY:"05",
        JUN:"06",
        JUL:"07",
        AUG:"08",
        SEP:"09",
        OCT:"10",
        NOV:"11",
        DEC:"12"

    };


    const dia = dataTxt.substring(0,2);

    const mes = meses[dataTxt.substring(2,5)] || "01";

    const ano = "20" + dataTxt.substring(5);


    return `${dia}/${mes}/${ano}`;

}




    function selecionarArquivo(e){

        setArquivo(e.target.files[0]);

    }





    function carregar(){


        if(!arquivo){

            alert("Selecione um arquivo TXT.");

            return;

        }



        const reader = new FileReader();



        reader.onload = (evento)=>{


            analisar(evento.target.result);


        };



        reader.readAsText(arquivo);


    }







    function analisar(texto){


        const linhasTxt = texto.split(/\r?\n/);



        let dataAtual = "";

        let abastecimentos=[];

        let errosEncontrados=[];

        let eventos=[];
let cpu = "";
let jsonModel = "";
let chip = "";
let pci = "";

const paginasNaoEncontradas = [];

const cartoes = [];




        linhasTxt.forEach(linha=>{



           if(linha.trim().startsWith("@")){


    const data = linha.match(
        /@(\d{2}[A-Z]{3}\d{2})/
    );


    if(data){

        dataAtual = converterData(data[1]);

    }


    return; // ignora a linha @, ela é apenas marcador de data

}







            if(linha.startsWith("&")){
                // =========================
// Versão da CPU
// =========================

const ver = linha.match(/VER:\s*([A-Z0-9]+)/i);

if(ver){
    cpu = ver[1];
}

// =========================
// Modelo JSON
// =========================

const modelo = linha.match(/Load Json model:\s*([A-Z0-9_]+)/i);

if(modelo){
    jsonModel = modelo[1];
}

// =========================
// CHIP
// =========================

const chipMatch = linha.match(/CHIP:\s*([A-Z0-9_]+)/i);

if(chipMatch){
    chip = chipMatch[1];
}

// =========================
// PCI
// =========================

const pciMatch = linha.match(/PCI([A-Z0-9]+)/i);

if(pciMatch){
    pci = pciMatch[1];
}

// =========================
// Página não encontrada
// =========================

const pagina = linha.match(/tempo sem resposta página:\s*(\d+)/i);

if(pagina){

    if(!paginasNaoEncontradas.includes(pagina[1])){

        paginasNaoEncontradas.push(pagina[1]);

    }

}

// =========================
// Cartão
// =========================

const cartao = linha.match(
/&(\d{2}:\d{2}:\d{2})\s+Card\s+(Tecnico|Gerente|Gerencial)\s+(.+?)\s+\d+\s+(\d{2})\s+(\d{2})\s+(\d{2})/i
);

if(cartao){

    cartoes.push({

        hora: cartao[1],

        tipo:
            cartao[2].toLowerCase().includes("tec")
            ? "Técnico"
            : "Gerencial",

        nome: cartao[3].trim(),

        validade:
            `${cartao[4]}/${cartao[5]}/20${cartao[6]}`

    });

}


                const hora =
                linha.match(/&(\d{2}:\d{2}:\d{2})/);



                const bico =
                linha.match(/B:\s*(\d+)/);



                const venda =
                linha.match(/Sale N:(\d+)/);



                const valor =
                linha.match(/\$:\s*([\d.]+)/);



                const volume =
                linha.match(/V:\s*([\d.]+)/);



                const preco =
                linha.match(/PA:\s*([\d.]+)/);



                const total =
                linha.match(/Vt:\s*([\d,\.]+)/);






                const abastecimento = {


                    tipo:"abastecimento",

                    data:dataAtual,

                    hora:hora ? hora[1]:"",

                    bico:bico ? bico[1]:"",

                    venda:venda ? venda[1]:"",

                    valor:valor ? valor[1]:"",

                    volume:volume ? volume[1]:"",

                    preco:preco ? preco[1]:"",

                    total:total ? total[1]:"",

                    original:linha


                };



                abastecimentos.push(abastecimento);

                eventos.push(abastecimento);



            }









            if(linha.startsWith("#")){



                const hora =
                linha.match(
                    /#(\d{2}:\d{2}:\d{2})/
                );





                const codigo =
                linha.match(
                    /^#\d{2}:\d{2}:\d{2}\s+([A-Z0-9]{1,3})/
                );





                if(codigo){



                    let cod=codigo[1];



                    if(cod.startsWith("EP"))
                        cod="EP";



                    const erro = {


                        tipo:"erro",

                        data:dataAtual,

                        hora:hora ? hora[1]:"",

                        codigo:cod,


                        descricao:

                        codigosErros[cod] ||

                        "Código não cadastrado",


                        linha


                    };




                    errosEncontrados.push(erro);

                    eventos.push(erro);



                }



            }



        });







        eventos.sort((a,b)=>{


            if(a.data !== b.data){

                return a.data.localeCompare(b.data);

            }


            return a.hora.localeCompare(b.hora);


        });






const agrupado = {};
        const resumo = {};



eventos.forEach(evento=>{


    const data = evento.data || "SEM DATA";


    if(!agrupado[data]){

        agrupado[data]={

            abastecimentos:[],
            erros:[]

        };

    }



    if(evento.tipo === "abastecimento"){

        agrupado[data].abastecimentos.push(evento);

    }



if(evento.tipo === "erro"){

    agrupado[data].erros.push(evento);

    if(!resumo[evento.codigo]){
        resumo[evento.codigo] = {
            codigo: evento.codigo,
            descricao: evento.descricao,
            quantidade: 0,
            ocorrencias: []
        };
    }

    resumo[evento.codigo].quantidade++;

    resumo[evento.codigo].ocorrencias.push(evento);

}



});





setDados(abastecimentos);

setErros(errosEncontrados);

setGrupos(agrupado);

setResumoErros(resumo);
        setInfoLog({

    cpu,

    jsonModel,

    chip,

    pci,

    paginas: paginasNaoEncontradas,

    cartoes

});
        



      }
const gruposFiltrados = aplicarFiltros(grupos);

    return (

        <Layout>

            <div style={styles.container}>

<div style={styles.card}>

    <h2>
        📝 Analisador de Log
    </h2>

    <input
        type="file"
        accept=".txt"
        onChange={selecionarArquivo}
    />

    <br/>
    <br/>

    <button
        style={styles.button}
        onClick={carregar}
    >
                  📂 Carregar Log
    </button>

</div>
<div style={styles.card}>

<h2>📋 Informações do Log</h2>

<p><b>CPU:</b> {infoLog.cpu || "-"}</p>

<p><b>Modelo JSON:</b> {infoLog.jsonModel || "-"}</p>

<p><b>CHIP:</b> {infoLog.chip || "-"}</p>

<p><b>PCI:</b> {infoLog.pci || "-"}</p>

<hr/>

<h3>💳 Cartões utilizados</h3>

{infoLog.cartoes.length === 0 ? (

<p>Nenhum cartão encontrado.</p>

) : (

infoLog.cartoes.map((c,i)=>(

<div
key={i}
style={{
background:"#222",
padding:10,
marginBottom:10,
borderRadius:8
}}
>

<p>

<b>

{c.tipo==="Técnico"
? "🟢 Técnico"
: "🔴 Gerencial"}

</b>

</p>

<p><b>Nome:</b> {c.nome}</p>

<p><b>Hora:</b> {c.hora}</p>

<p><b>Validade:</b> {c.validade}</p>

</div>

))

)}

<hr/>

<h3>📄 Páginas não carregadas</h3>

{infoLog.paginas.length===0 ? (

<p>Nenhuma.</p>

) : (

<ul>

{infoLog.paginas.map((pagina)=>(

<li key={pagina}>
Página {pagina}
</li>

))}

</ul>

)}

</div>

<div style={styles.card}>


    <h2>
        🔎 Filtros
    </h2>



    <input
        style={styles.input}
        placeholder="Data DD/MM/AAAA"
        value={dataFiltro}
        onChange={e=>setDataFiltro(e.target.value)}
    />



    <input
        style={styles.input}
        placeholder="Hora HH:MM"
        value={horaFiltro}
        onChange={e=>setHoraFiltro(e.target.value)}
    />



    <input
        style={styles.input}
        placeholder="Bico"
        value={bicoFiltro}
        onChange={e=>setBicoFiltro(e.target.value)}
    />


</div>





<div style={styles.card}>

    <h2>📊 Resumo Geral dos Erros</h2>

    <div style={styles.gridErros}>

        {Object.values(resumoErros)
            .sort((a,b)=>b.quantidade-a.quantidade)
            .map((erro)=>(

                <div key={erro.codigo} style={styles.cardErro}>

                    <div
                        style={styles.cardResumo}
                        onClick={()=>{
                            setErrosAbertos(prev=>({
                                ...prev,
                                [erro.codigo]: !prev[erro.codigo]
                            }));
                        }}
                    >

                        <h2>{erro.codigo}</h2>

                        <p>{erro.quantidade} ocorrências</p>

                        <small>Clique para visualizar</small>

                    </div>

                    {errosAbertos[erro.codigo] && (

                        <div style={styles.expandArea}>

                            <h3>{erro.descricao}</h3>

                            {erro.ocorrencias.map((item,index)=>(

                                <div
                                    key={index}
                                    style={styles.erro}
                                >

                                    <b>{item.codigo}</b>

                                    <br/>

                                    📅 {item.data}

                                    <br/>

                                    ⏰ {item.hora}

                                    <br/>

                                    {item.descricao}

                                    <br/>

                                    <small>{item.linha}</small>

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            ))}

    </div>

</div>
<div style={styles.card}>

    <h2>
        📅 Eventos por data
    </h2>


                {Object.keys(gruposFiltrados).map((data)=>(

                    <div key={data}>


                        <button

                            style={styles.dataButton}

                            onClick={()=>{

                                setAbertos(prev=>({

    ...prev,

    [data]: !prev[data]

}));

                            }}

                        >

                            {abertos[data] ? "▼" : "▶"}

                            {" "}

                            {data}

                            {" - "}

                            {gruposFiltrados[data].abastecimentos.length}

                            {" abastecimentos / "}

                            {gruposFiltrados[data].erros.length}

                            {" erros"}

                        </button>





{abertos[data] && (


                            <div style={styles.expandArea}>


                                {gruposFiltrados[data].abastecimentos.length > 0 && (


                                    <>

                                    <h3>
                                        ⛽ Abastecimentos
                                    </h3>



                                    {gruposFiltrados[data].abastecimentos.map((item,index)=>(


                                        <div

                                            key={index}

                                            style={styles.linha}

                                        >


                                            ⏰ Hora:
                                            {" "}
                                            {item.hora}

                                            <br/>


                                            ⛽ Bico:
                                            {" "}
                                            {item.bico}


                                            <br/>


                                            🧾 Venda:
                                            {" "}
                                            {item.venda}


                                            <br/>


                                            💰 Valor:
                                            {" "}
                                            {item.valor}


                                            <br/>


                                            🛢 Volume:
                                            {" "}
                                            {item.volume}


                                            <br/>


                                            💵 Preço:
                                            {" "}
                                            {item.preco}


                                            <br/>


                                            📊 Total:
                                            {" "}
                                            {item.total}



                                        </div>


                                    ))}


                                    </>

                                )}







                                {gruposFiltrados[data].erros.length > 0 && (


                                    <>


                                    <h3 style={{color:"#ff5555"}}>

                                        🚨 Erros

                                    </h3>




                                    {gruposFiltrados[data].erros.map((erro,index)=>(


                                        <div

                                            key={index}

                                            style={styles.erro}

                                        >


                                            <b>

                                                Código:
                                                {" "}
                                                {erro.codigo}

                                            </b>


                                            <br/>

                                            📅 Data:
                                            {" "}
                                            {erro.data}


                                            <br/>


                                            ⏰ Hora:
                                            {" "}
                                            {erro.hora}



                                            <br/>


                                            📌

                                            {" "}

                                            {erro.descricao}



                                            <br/>


                                            <small>

                                                {erro.linha}

                                            </small>



                                        </div>


                                    ))}



                                    </>

                                )}




                            </div>


                        )}


                    </div>


                ))}

            </div> {/* Fecha o card "Eventos por data" */}

        </div> {/* Fecha o container */}

    </Layout>

);



}



const styles={


container:{

    maxWidth:1300,

    margin:"0 auto",

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

    border:"1px solid #555"


},




button:{


    background:"#FFD600",

    padding:"10px 20px",

    border:"none",

    cursor:"pointer",

    borderRadius:8


},




dataButton:{


    width:"100%",

    textAlign:"left",

    background:"#222",

    color:"#FFD600",

    padding:15,

    border:"1px solid #444",

    cursor:"pointer",

    marginBottom:10,

    borderRadius:8,

    fontSize:16


},




expandArea:{


    paddingLeft:20,

    borderLeft:"2px solid #FFD600",

    marginBottom:20


},




linha:{


    background:"#000",

    padding:15,

    marginBottom:10,

    borderRadius:8,

    fontFamily:"monospace",

    color:"#fff"


},




erro:{


    background:"#450000",

    border:"1px solid #ff4444",

    padding:15,

    marginBottom:10,

    borderRadius:8,

    color:"#fff"


},

gridErros:{

    display:"flex",

    flexWrap:"wrap",

    justifyContent:"center",

    gap:20,

    marginTop:20

},

cardErro:{

    width:220

},

cardResumo:{

    background:"#222",

    border:"2px solid #FFD600",

    borderRadius:12,

    padding:20,

    textAlign:"center",

    cursor:"pointer",

    color:"#fff",

    transition:"0.2s",

    minHeight:120,

    display:"flex",

    flexDirection:"column",

    justifyContent:"center"

},

};
