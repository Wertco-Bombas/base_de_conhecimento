import { useState } from "react";
import Layout from "../components/Layout";

export default function AnalisadorLog(){

    const [arquivo,setArquivo] = useState(null);
    const [conteudo,setConteudo] = useState("");
    const [resultado,setResultado] = useState([]);


    function lerArquivo(e){

        const file = e.target.files[0];

        if(!file)
            return;


        setArquivo(file);


        const reader = new FileReader();


        reader.onload = function(event){

            const texto = event.target.result;

            setConteudo(texto);


            analisar(texto);

        };


        reader.readAsText(file);

    }




    function analisar(texto){

        const linhas = texto.split("\n");


        const eventos = linhas.map((linha)=>{

            return {
                original: linha
            }

        });


        setResultado(eventos);

    }




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


                </div>




                {arquivo && (

                    <div style={styles.card}>

                        <h3>
                            Arquivo carregado:
                        </h3>


                        <p>
                            {arquivo.name}
                        </p>


                    </div>

                )}






                {resultado.length > 0 && (

                    <div style={styles.card}>


                        <h2>
                            Resultado da análise
                        </h2>



                        <p>
                            Linhas encontradas: {resultado.length}
                        </p>




                        {resultado.slice(0,50).map((item,index)=>(


                            <div
                                key={index}
                                style={styles.linha}
                            >

                                {item.original}


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


    linha:{


        background:"#000",

        padding:10,

        marginBottom:5,

        borderRadius:5,

        fontFamily:"monospace",

        fontSize:13,

        color:"#FFD600"


    }


};
