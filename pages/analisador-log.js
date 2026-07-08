import { useState } from "react";
import Layout from "../components/Layout";
import { codigosErros } from "../utils/codigosErros";


export default function AnalisadorLog(){

    const [arquivo,setArquivo] = useState(null);

    const [linhas,setLinhas] = useState([]);

    const [dados,setDados] = useState([]);

    const [erros,setErros] = useState([]);


    const [bicoFiltro,setBicoFiltro] = useState("");

    const [horaFiltro,setHoraFiltro] = useState("");

    const [dataFiltro,setDataFiltro] = useState("");





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


            const texto = evento.target.result;


            analisar(texto);


        };



        reader.readAsText(arquivo);


    }





    function analisar(texto){


        const linhasTxt = texto.split(/\r?\n/);



        let dataAtual = "";

        let abastecimentos=[];

        let errosEncontrados=[];



        linhasTxt.forEach(linha=>{


            if(linha.startsWith("@")){


                const data = linha.match(
                    /@(\d{2}[A-Z]{3}\d{2})/
                );


                if(data){

                    dataAtual=data[1];

                }

            }





            if(linha.startsWith("&")){


                const hora =
                linha.match(/&(\d{2}:\d{2}:\d{2})/);



                const bico =
                linha.match(/B:(\d+)/);



                const venda =
                linha.match(/Sale N:(\d+)/);



                const valor =
                linha.match(/\$\:([0-9.]+)/);



                const volume =
                linha.match(/V:(\d+\.\d+)/);



                const preco =
                linha.match(/PA:\s?([0-9.]+)/);



                const total =
                linha.match(/Vt:\s*([\d,\.]+)/);





                abastecimentos.push({


                    data:dataAtual,

                    hora:hora ? hora[1]:"",

                    bico:bico ? bico[1]:"",

                    venda:venda ? venda[1]:"",

                    valor:valor ? valor[1]:"",

                    volume:volume ? volume[1]:"",

                    preco:preco ? preco[1]:"",

                    total:total ? total[1]:"",

                    original:linha


                });


            }







            if(linha.startsWith("#")){


                const hora =
                linha.match(
                    /#(\d{2}:\d{2}:\d{2})/
                );



                const codigo =
                linha.match(
                    /\s([A-Z0-9]{2,3})\s/
                );



                if(codigo){


                    const cod=codigo[1];



                    errosEncontrados.push({


                        hora:hora ? hora[1]:"",

                        codigo:cod,


                        descricao:
                        codigosErros[cod] ||
                        "Código não cadastrado",


                        linha


                    });


                }


            }



        });



        setDados(abastecimentos);

        setErros(errosEncontrados);

    }





    const filtrados = dados.filter(item=>{


        return (

            (!bicoFiltro || item.bico===bicoFiltro)

            &&

            (!horaFiltro || item.hora.startsWith(horaFiltro))

            &&

            (!dataFiltro || item.data===dataFiltro)

        );


    });






    return (

    <Layout>


    <div style={styles.container}>


        <h1>
            📝 Analisador de Log
        </h1>



        <div style={styles.card}>


            <input
                type="file"
                accept=".txt"
                onChange={selecionarArquivo}
            />


            <br/><br/>


            <button
                style={styles.button}
                onClick={carregar}
            >

                📂 Carregar Log

            </button>


        </div>





        {dados.length>0 && (

        <div style={styles.card}>


            <h2>
                Filtros
            </h2>


            <input
                style={styles.input}
                placeholder="Dia (ex:30JUL17)"
                value={dataFiltro}
                onChange={e=>setDataFiltro(e.target.value)}
            />


            <input
                style={styles.input}
                placeholder="Hora (ex:11:20)"
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

        )}






        {erros.length>0 && (

        <div style={styles.card}>


            <h2>
                🚨 Erros encontrados
            </h2>


            {erros.map((e,i)=>(

            <div key={i} style={styles.erro}>


                <b>
                    {e.codigo}
                </b>

                <br/>

                Hora:
                {e.hora}

                <br/>

                {e.descricao}

                <br/>

                <small>
                    {e.linha}
                </small>


            </div>


            ))}



        </div>

        )}






        <div style={styles.card}>


            <h2>
                Abastecimentos encontrados: {filtrados.length}
            </h2>



            {filtrados.map((item,i)=>(


            <div key={i} style={styles.linha}>


                📅 {item.data}

                <br/>

                ⏰ {item.hora}

                <br/>

                ⛽ Bico: {item.bico}

                <br/>

                Venda: {item.venda}

                <br/>

                Valor: {item.valor}

                <br/>

                Volume: {item.volume}


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
cursor:"pointer"
},


linha:{
background:"#000",
padding:10,
marginBottom:8,
fontFamily:"monospace"
},


erro:{
background:"#400",
padding:15,
marginBottom:10,
borderRadius:8,
color:"#fff"
}


};
