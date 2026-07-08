import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import RoleGuard from "../components/RoleGuard";

export default function Instrucoes() {

    const [lista, setLista] = useState([]);

    const [titulo, setTitulo] = useState("");
    const [caminho, setCaminho] = useState("");
    const [categoria, setCategoria] = useState("");

    const carregar = async () => {
        const { data } = await supabase
            .from("instrucoes_trabalho")
            .select("*")
            .order("titulo");

        setLista(data || []);
    };

    useEffect(() => {
        carregar();
    }, []);

    async function salvar() {

        if (!titulo || !caminho) return;

        await supabase
            .from("instrucoes_trabalho")
            .insert({
                titulo,
                caminho,
                categoria
            });

        setTitulo("");
        setCaminho("");
        setCategoria("");

        carregar();
    }

    async function excluir(id){

        if(!confirm("Excluir?"))
            return;

        await supabase
            .from("instrucoes_trabalho")
            .delete()
            .eq("id",id);

        carregar();
    }

    async function copiar(texto){

        await navigator.clipboard.writeText(texto);

        alert("Caminho copiado.");
    }

    return (

        <Layout>

            <h1>Instruções de Trabalho</h1>

            <RoleGuard roles={["Supervisor"]}>

                <div style={{
                    border:"1px solid #DDD",
                    padding:20,
                    marginBottom:30,
                    borderRadius:10
                }}>

                    <h2>Novo Link</h2>

                    <input
                        placeholder="Título"
                        value={titulo}
                        onChange={(e)=>setTitulo(e.target.value)}
                    />

                    <br/><br/>

                    <input
                        placeholder="Categoria"
                        value={categoria}
                        onChange={(e)=>setCategoria(e.target.value)}
                    />

                    <br/><br/>

                    <input
                        placeholder="Caminho de Rede"
                        value={caminho}
                        onChange={(e)=>setCaminho(e.target.value)}
                        style={{width:"100%"}}
                    />

                    <br/><br/>

                    <button onClick={salvar}>
                        Salvar
                    </button>

                </div>

            </RoleGuard>

            {lista.map(item=>(

                <div
                    key={item.id}
                    style={{
                        border:"1px solid #DDD",
                        marginBottom:20,
                        padding:20,
                        borderRadius:10
                    }}
                >

                    <h3>{item.titulo}</h3>

                    <p>{item.categoria}</p>

                    <input
                        readOnly
                        value={item.caminho}
                        style={{width:"100%"}}
                    />

                    <br/><br/>

                    <button
                        onClick={()=>copiar(item.caminho)}
                    >
                        Copiar Caminho
                    </button>

                    <RoleGuard roles={["Supervisor"]}>

                        <button
                            style={{
                                marginLeft:10,
                                background:"red",
                                color:"#FFF"
                            }}
                            onClick={()=>excluir(item.id)}
                        >
                            Excluir
                        </button>

                    </RoleGuard>

                </div>

            ))}

        </Layout>

    );

}
