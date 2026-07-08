import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";

export default function Instrucoes() {

    const [lista, setLista] = useState([]);

    const [titulo, setTitulo] = useState("");
    const [caminho, setCaminho] = useState("");
    const [categoria, setCategoria] = useState("");

    const [isSupervisor, setIsSupervisor] = useState(false);


    useEffect(() => {

        carregar();
        verificarPermissao();

    }, []);



    async function carregar() {

        const { data, error } = await supabase
            .from("instrucoes_trabalho")
            .select("*")
            .order("titulo");


        if(error){

            console.error("Erro ao carregar instruções:", error);

            return;

        }


        setLista(data || []);

    }





    async function verificarPermissao(){

        const { data } = await supabase.auth.getUser();


        if(!data?.user)
            return;



        const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();



        if(error){

            console.error("Erro ao buscar perfil:", error);

            return;

        }



        const role = profile?.role?.toLowerCase();



        if(role === "supervisor" || role === "admin"){

            setIsSupervisor(true);

        }

    }





    async function salvar(){


        if(!titulo || !caminho){

            alert("Informe o título e o caminho do PDF.");

            return;

        }



        const { error } = await supabase
            .from("instrucoes_trabalho")
            .insert({

                titulo,
                caminho,
                categoria

            });



        if(error){

            alert("Erro ao salvar: " + error.message);

            return;

        }



        alert("Instrução cadastrada com sucesso!");


        setTitulo("");
        setCaminho("");
        setCategoria("");

        carregar();


    }





    async function copiar(texto){

        await navigator.clipboard.writeText(texto);

        alert("Caminho copiado.");

    }




    return (

        <Layout>


            <div style={{padding:20}}>


                <h1>
                    📄 Instruções de Trabalho
                </h1>



                {isSupervisor && (

                    <div style={styles.card}>


                        <h2>
                            Nova Instrução de Trabalho
                        </h2>



                        <input

                            style={styles.input}

                            placeholder="Título da instrução"

                            value={titulo}

                            onChange={(e)=>setTitulo(e.target.value)}

                        />



                        <input

                            style={styles.input}

                            placeholder="Categoria (opcional)"

                            value={categoria}

                            onChange={(e)=>setCategoria(e.target.value)}

                        />



                        <input

                            style={styles.input}

                            placeholder="Caminho do PDF"

                            value={caminho}

                            onChange={(e)=>setCaminho(e.target.value)}

                        />



                        <button

                            style={styles.button}

                            onClick={salvar}

                        >

                            Salvar Instrução

                        </button>


                    </div>

                )}






                <h2>
                    Lista de Instruções
                </h2>




                {lista.map(item=>(


                    <div

                        key={item.id}

                        style={styles.card}

                    >


                        <h3>
                            📄 {item.titulo}
                        </h3>



                        {item.categoria && (

                            <p>
                                Categoria: {item.categoria}
                            </p>

                        )}



                        <input

                            style={styles.input}

                            value={item.caminho}

                            readOnly

                        />



                        <button

                            style={styles.button}

                            onClick={()=>copiar(item.caminho)}

                        >

                            📋 Copiar Caminho

                        </button>



                    </div>


                ))}


            </div>


        </Layout>

    );

}





const styles={


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


    button:{

        background:"#FFD600",

        color:"#000",

        border:"none",

        padding:"10px 15px",

        borderRadius:8,

        cursor:"pointer"

    }


};
