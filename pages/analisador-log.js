import { useState } from "react";
import Layout from "../components/Layout";

export default function AnalisadorLog() {

    const [arquivo, setArquivo] = useState(null);
    const [conteudo, setConteudo] = useState("");
    const [resultado, setResultado] = useState("");



    function lerArquivo(e) {

        const file = e.target.files[0];


        if(!file){
            return;
        }


        setArquivo(file);


        const reader = new FileReader();


        reader.onload = (evento)=>{

            setConteudo(evento.target.result);

            setResultado("");

        };


        reader.readAsText(file);

    }





    function analisar(){


        if(!conteudo){

            alert("Selecione um arquivo TXT primeiro.");

            return;

        }


        /*
            Aqui entraremos futuramente
            a lógica de análise do log.
        */


        setResultado(
            "Arquivo carregado com sucesso. A análise será adicionada nesta etapa."
        );

    }





    return (

        <Layout>


            <div style={styles.container}>


                <h1>
                    📝 Analisador de Log
                </h1>



                <div style={styles.card}>


                    <h2>
                        Selecionar arquivo de Log
                    </h2>



                    <input

                        type="file"

                        accept=".txt"

                        onChange={lerArquivo}

                    />



                    {arquivo && (

                        <p>
                            Arquivo selecionado: {arquivo.name}
                        </p>

                    )}



                    <button

                        style={styles.button}

                        onClick={analisar}

                    >

                        🔍 Analisar Log

                    </button>


                </div>





                {conteudo && (

                    <div style={styles.card}>


                        <h2>
                            Conteúdo do Log
                        </h2>


                        <textarea

                            style={styles.textarea}

                            value={conteudo}

                            readOnly

                        />


                    </div>

                )}






                {resultado && (

                    <div style={styles.resultado}>


                        <h2>
                            Resultado da Análise
                        </h2>


                        <p>
                            {resultado}
                        </p>


                    </div>

                )}



            </div>


        </Layout>

    );

}




const styles = {


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


    button:{

        marginTop:20,

        background:"#FFD600",

        color:"#000",

        border:"none",

        padding:"12px 20px",

        borderRadius:8,

        cursor:"pointer"

    },


    textarea:{

        width:"100%",

        height:300,

        background:"#222",

        color:"#fff",

        border:"1px solid #444",

        padding:10,

        borderRadius:8

    },


    resultado:{

        background:"#0f3",

        color:"#000",

        padding:20,

        borderRadius:10

    }


};
