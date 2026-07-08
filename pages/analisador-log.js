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
    function aplicarFiltros(grupos){

    const resultado={};


    Object.keys(grupos).forEach(data=>{


        const abastecimentos =
        aplicarFiltros(grupos)[data].abastecimentos.filter(item=>

            (!bicoFiltro || item.bico===bicoFiltro) &&

            (!horaFiltro || item.hora.startsWith(horaFiltro)) &&

            (!dataFiltro || item.data===dataFiltro)

        );



        const erros =
        aplicarFiltros(grupos)[data].erros.filter(item=>

            (!horaFiltro || item.hora.startsWith(horaFiltro)) &&

            (!dataFiltro || item.data===dataFiltro)

        );



        if(abastecimentos.length || erros.length){

            resultado[data]={

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





        linhasTxt.forEach(linha=>{



            if(linha.startsWith("@")){


                const data = linha.match(
                    /@(\d{2}[A-Z]{3}\d{2})/
                );



                if(data){

                    dataAtual = converterData(data[1]);

                }


            }








            if(linha.startsWith("&")){


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







       const agrupado={};


eventos.forEach(evento=>{


const chaveData = evento.data || "Data desconhecida";


if(!agrupado[chaveData]){

    agrupado[chaveData]={

        abastecimentos:[],
        erros:[]

    };

}



    if(evento.tipo==="abastecimento"){

        agrupado[chaveData].abastecimentos.push(evento);

    }



    if(evento.tipo==="erro"){

        agrupado[chaveData].erros.push(evento);

    }



});






        setDados(abastecimentos);

        setErros(errosEncontrados);

     setGrupos(agrupado);

        



      }


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


    <h2>
        📅 Eventos por data
    </h2>
                <h2>
                    📅 Eventos por data
                </h2>


                {Object.keys(aplicarFiltros(grupos)).map((data)=>(

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

                            {aplicarFiltros(grupos)[data].abastecimentos.length}

                            {" abastecimentos / "}

                            {aplicarFiltros(grupos)[data].erros.length}

                            {" erros"}

                        </button>





{abertos[data] && (


                            <div style={styles.expandArea}>


                                {aplicarFiltros(grupos)[data].abastecimentos.length > 0 && (


                                    <>

                                    <h3>
                                        ⛽ Abastecimentos
                                    </h3>



                                    {aplicarFiltros(grupos)[data].abastecimentos.map((item,index)=>(


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







                                {aplicarFiltros(grupos)[data].erros.length > 0 && (


                                    <>


                                    <h3 style={{color:"#ff5555"}}>

                                        🚨 Erros

                                    </h3>




                                    {aplicarFiltros(grupos)[data].erros.map((erro,index)=>(


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

            </div>

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


}



};
